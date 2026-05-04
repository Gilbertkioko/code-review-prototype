import { env } from '$env/dynamic/private';
import { CATEGORIES } from '$lib/constants';
import { createFullTestingItems } from '$lib/features/testing/checklist';
import { and, count, desc, eq, inArray, isNull, lte, or } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { promisify } from 'node:util';
import { getDb } from './db';
import { aiReviewCache, aiReviewJob, projectAiReview } from './db/schema';

export const AI_REVIEW_PROMPT_VERSION = 'v2';
export const AI_REVIEW_MODEL = 'claude-haiku-4-5-20251001';
/** Long structured reviews exceed 4k tokens; truncated JSON fails to parse. */
const AI_REVIEW_MAX_OUTPUT_TOKENS = 16_384;
const execFileAsync = promisify(execFile);
const MAX_REPO_FILES = 80;
const MAX_FILE_CHARS = 10_000;
const MAX_TOTAL_CHARS = 220_000;
const ALLOWED_EXTS = new Set([
	'.ts',
	'.tsx',
	'.js',
	'.jsx',
	'.mjs',
	'.cjs',
	'.py',
	'.go',
	'.rs',
	'.java',
	'.kt',
	'.swift',
	'.php',
	'.rb',
	'.cs',
	'.cpp',
	'.c',
	'.h',
	'.hpp',
	'.sql',
	'.json',
	'.yaml',
	'.yml',
	'.toml',
	'.md',
	'.svelte',
	'.vue',
	'.html',
	'.css'
]);

type AiReviewStatus = 'pending' | 'running' | 'completed' | 'failed';
type AiJobStatus = 'queued' | 'running' | 'retrying' | 'completed' | 'failed';

function resolveAnthropicApiKey(): string {
	return (env.ANTHROPIC_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim() || '').trim();
}

function tryParseJson<T>(text: string): T | null {
	try {
		return JSON.parse(text) as T;
	} catch {
		return null;
	}
}

function extractFirstJsonObject(text: string): string | null {
	let start = -1;
	let depth = 0;
	let inString = false;
	let escaping = false;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (inString) {
			if (escaping) escaping = false;
			else if (ch === '\\') escaping = true;
			else if (ch === '"') inString = false;
			continue;
		}
		if (ch === '"') {
			inString = true;
			continue;
		}
		if (ch === '{') {
			if (start === -1) start = i;
			depth += 1;
			continue;
		}
		if (ch === '}') {
			if (depth > 0) depth -= 1;
			if (depth === 0 && start !== -1) return text.slice(start, i + 1);
		}
	}
	return null;
}

function formatWorkerError(e: unknown): string {
	if (e instanceof Error) {
		let msg = e.message || 'Unknown error';
		const anyE = e as unknown as { cause?: unknown; code?: unknown };
		if (anyE.cause instanceof Error) msg += ` | cause: ${anyE.cause.message}`;
		else if (anyE.cause !== undefined) msg += ` | cause: ${String(anyE.cause)}`;
		if (anyE.code !== undefined) msg += ` | code: ${String(anyE.code)}`;
		return msg;
	}
	return String(e);
}

function toAdminFriendlyError(raw: string): string {
	const lower = raw.toLowerCase();
	if (lower.includes('credit balance is too low') || (lower.includes('anthropic api failed (400)') && lower.includes('billing'))) {
		return 'AI review unavailable: Anthropic credits are exhausted. Top up billing, then click Retry AI review.';
	}
	if (lower.includes('anthropic_api_key is not set')) {
		return 'AI review unavailable: server is missing ANTHROPIC_API_KEY. Set it in env and retry.';
	}
	if (lower.includes('eai_again') || lower.includes('getaddrinfo')) {
		return 'AI review temporarily unavailable: network/DNS issue while contacting external services. Retry shortly.';
	}
	return raw;
}

export type AiReviewStructuredResult = {
	overall_summary: string;
	functional_testing: Array<{
		question_id: string;
		question: string;
		verdict: 'accept' | 'decline';
		evidence: string;
	}>;
	code_review: Array<{
		question_id: string;
		question: string;
		verdict: 'accept' | 'decline';
		severity: 'low' | 'medium' | 'high';
		finding: string;
		evidence: string;
		recommendation: string;
	}>;
	key_risks: string[];
	action_items: string[];
};

export function normalizeRepoUrl(input: string): string {
	const raw = input.trim();
	try {
		const u = new URL(raw);
		const protocol = u.protocol.toLowerCase();
		const host = u.host.toLowerCase();
		let path = u.pathname.replace(/\/+/g, '/').replace(/\/$/, '');
		if (path.endsWith('.git')) path = path.slice(0, -4);
		return `${protocol}//${host}${path}`;
	} catch {
		return raw.toLowerCase().replace(/\/+$/, '').replace(/\.git$/, '');
	}
}

/** IDE / GUI-launched Node often has a stripped PATH; git lives in /usr/bin on typical Linux. */
function gitSpawnEnv(): NodeJS.ProcessEnv {
	const standard =
		process.platform === 'win32'
			? ['C:\\Program Files\\Git\\cmd', 'C:\\Program Files\\Git\\bin']
			: ['/usr/local/bin', '/usr/bin', '/bin'];
	const prefix = standard.join(delimiter);
	const cur = process.env.PATH ?? '';
	const pathValue = cur.length ? `${prefix}${delimiter}${cur}` : prefix;
	return { ...process.env, PATH: pathValue };
}

async function runGit(args: string[], cwd?: string): Promise<void> {
	await execFileAsync('git', args, {
		cwd,
		timeout: 120_000,
		maxBuffer: 10 * 1024 * 1024,
		env: gitSpawnEnv()
	});
}

function extensionOf(path: string): string {
	const idx = path.lastIndexOf('.');
	return idx >= 0 ? path.slice(idx).toLowerCase() : '';
}

async function listRepoFiles(root: string, rel = ''): Promise<string[]> {
	const full = join(root, rel);
	const entries = await readdir(full, { withFileTypes: true });
	const out: string[] = [];
	for (const e of entries) {
		const childRel = rel ? `${rel}/${e.name}` : e.name;
		if (e.name === '.git' || e.name === 'node_modules' || e.name === 'dist' || e.name === 'build') continue;
		if (e.isDirectory()) {
			out.push(...(await listRepoFiles(root, childRel)));
		} else if (e.isFile()) {
			out.push(childRel);
		}
	}
	return out;
}

async function buildRepoContextText(repoUrl: string): Promise<{ contextText: string; fileCount: number }> {
	const tmpRoot = await mkdtemp(join(tmpdir(), 'ai-review-repo-'));
	const worktree = join(tmpRoot, 'repo');
	try {
		await runGit(['clone', '--depth', '1', repoUrl, worktree]);
		const files = await listRepoFiles(worktree);
		const selected = files.filter((p) => ALLOWED_EXTS.has(extensionOf(p))).slice(0, MAX_REPO_FILES);
		const chunks: string[] = [];
		let total = 0;
		for (const rel of selected) {
			if (total >= MAX_TOTAL_CHARS) break;
			const raw = await readFile(join(worktree, rel), 'utf8').catch(() => '');
			if (!raw) continue;
			const trimmed = raw.slice(0, MAX_FILE_CHARS);
			chunks.push(`FILE: ${rel}\n${trimmed}`);
			total += trimmed.length;
		}
		return { contextText: chunks.join('\n\n---\n\n'), fileCount: chunks.length };
	} finally {
		await rm(tmpRoot, { recursive: true, force: true });
	}
}

type ReviewQuestionsSnapshot = {
	functional: Array<{ id: string; text: string }>;
	codeReview: Array<{ id: string; category: string; text: string }>;
};

export function buildQuestionsSnapshot(): ReviewQuestionsSnapshot {
	const functional = createFullTestingItems().map((item) => ({
		id: item.id,
		text: item.text
	}));
	const codeReview = CATEGORIES.flatMap((cat) =>
		cat.observations.map((obs) => ({
			id: `${cat.id}:${obs.id}`,
			category: cat.title,
			text: obs.text
		}))
	);
	return { functional, codeReview };
}

export function computeQuestionsHash(snapshot: ReviewQuestionsSnapshot): string {
	const canonical = JSON.stringify({
		promptVersion: AI_REVIEW_PROMPT_VERSION,
		functional: snapshot.functional,
		codeReview: snapshot.codeReview
	});
	return createHash('sha256').update(canonical).digest('hex');
}

/** Strip leading ```json / ``` and trailing ``` (handles complete fences; opening-only if output was truncated). */
function unwrapModelJsonText(raw: string): string {
	let t = raw.trim();
	const open = t.match(/^```(?:json)?\s*/i);
	if (open) t = t.slice(open[0].length);
	const closeM = t.match(/\s*```\s*$/);
	if (closeM) t = t.slice(0, t.length - closeM[0].length);
	return t.trim();
}

function parseAnthropicTextPayload(rawText: string): AiReviewStructuredResult {
	const trimmed = rawText.trim();
	const unwrapped = unwrapModelJsonText(trimmed);
	const direct = tryParseJson<AiReviewStructuredResult>(unwrapped);
	const firstUnwrapped = extractFirstJsonObject(unwrapped);
	const fromFirstUnwrapped = firstUnwrapped ? tryParseJson<AiReviewStructuredResult>(firstUnwrapped) : null;
	const directRaw = tryParseJson<AiReviewStructuredResult>(trimmed);
	const firstRaw = extractFirstJsonObject(trimmed);
	const fromFirstRaw = firstRaw ? tryParseJson<AiReviewStructuredResult>(firstRaw) : null;

	const parsed = direct ?? fromFirstUnwrapped ?? directRaw ?? fromFirstRaw;
	if (!parsed) {
		throw new Error(`Could not parse model response as JSON. Full response:\n${trimmed}`);
	}
	if (!parsed || typeof parsed !== 'object') throw new Error('AI response JSON root is not an object');
	if (!Array.isArray(parsed.functional_testing) || !Array.isArray(parsed.code_review)) {
		throw new Error('AI response JSON does not contain expected sections');
	}
	// Backward-compatible cleanup in case model returns legacy pass/fail/partial labels.
	for (const row of parsed.functional_testing) {
		const v = String((row as { verdict?: unknown }).verdict ?? '').toLowerCase();
		(row as { verdict: 'accept' | 'decline' }).verdict = v === 'accept' || v === 'pass' ? 'accept' : 'decline';
	}
	for (const row of parsed.code_review) {
		const v = String((row as { verdict?: unknown }).verdict ?? '').toLowerCase();
		(row as { verdict: 'accept' | 'decline' }).verdict = v === 'accept' || v === 'pass' ? 'accept' : 'decline';
	}
	return parsed;
}

async function callClaudeForReview(params: {
	repoUrl: string;
	repoContextText: string;
	repoFileCount: number;
	functionalQuestions: Array<{ id: string; text: string }>;
	codeReviewQuestions: Array<{ id: string; category: string; text: string }>;
}): Promise<string> {
	const apiKey = resolveAnthropicApiKey();
	if (env.AI_REVIEW_WORKER_DEBUG === '1') {
		console.log('[ai-review] api key present:', Boolean(apiKey));
	}
	if (!apiKey) {
		throw new Error('ANTHROPIC_API_KEY is not set (checked $env/dynamic/private and process.env)');
	}

	if (env.AI_REVIEW_WORKER_DEBUG === '1') {
		console.log('[ai-review] calling Anthropic messages API', { model: AI_REVIEW_MODEL });
	}

	const prompt = [
		'You are a strict software reviewer.',
		'Review the provided repository source files and answer the supplied question sets.',
		'Respond with valid JSON only (no markdown, no extra text, no code fences).',
		'JSON schema:',
		'{',
		'  "overall_summary": string,',
		'  "functional_testing": [{ "question_id": string, "question": string, "verdict": "accept"|"decline", "evidence": string }],',
		'  "code_review": [{ "question_id": string, "question": string, "verdict": "accept"|"decline", "severity": "low"|"medium"|"high", "finding": string, "evidence": string, "recommendation": string }],',
		'  "key_risks": string[],',
		'  "action_items": string[]',
		'}',
		'Use verdict="accept" only when the criterion is correctly implemented and works.',
		'Use verdict="decline" when the criterion is missing, incorrect, or not working.',
		`Repository URL: ${params.repoUrl}`,
		`Repository files provided: ${params.repoFileCount}`,
		`Repository source text:\n${params.repoContextText}`,
		`Functional questions: ${JSON.stringify(params.functionalQuestions)}`,
		`Code review questions: ${JSON.stringify(params.codeReviewQuestions)}`
	].join('\n');

	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model: AI_REVIEW_MODEL,
			max_tokens: AI_REVIEW_MAX_OUTPUT_TOKENS,
			temperature: 0.2,
			messages: [{ role: 'user', content: prompt }]
		})
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Anthropic API failed (${res.status}): ${body}`);
	}
	const payload = (await res.json()) as {
		content?: Array<{ type?: string; text?: string }>;
		stop_reason?: string;
	};
	const textBlocks = (payload.content ?? []).filter((b) => b.type === 'text' && typeof b.text === 'string');
	const rawText = textBlocks.map((b) => b.text ?? '').join('\n').trim();
	if (!rawText) throw new Error('Anthropic response did not include text content');
	if (payload.stop_reason === 'max_tokens') {
		throw new Error(
			'AI review output was truncated (hit max_tokens). Increase AI_REVIEW_MAX_OUTPUT_TOKENS in ai-review.ts or shorten the prompt context.'
		);
	}
	return rawText;
}

async function linkReviewToProject(projectId: string, cacheId: string) {
	const db = getDb();
	const now = Date.now();
	await db
		.insert(projectAiReview)
		.values({
			projectId,
			aiReviewCacheId: cacheId,
			linkedAt: now
		})
		.onConflictDoNothing();
}

async function latestCompletedCache(repoUrlNormalized: string, questionsHash: string) {
	const rows = await getDb()
		.select()
		.from(aiReviewCache)
		.where(
			and(
				eq(aiReviewCache.repoUrlNormalized, repoUrlNormalized),
				eq(aiReviewCache.questionsHash, questionsHash),
				eq(aiReviewCache.promptVersion, AI_REVIEW_PROMPT_VERSION),
				eq(aiReviewCache.status, 'completed')
			)
		)
		.orderBy(desc(aiReviewCache.completedAt), desc(aiReviewCache.updatedAt))
		.limit(1);
	return rows[0] ?? null;
}

function nextRetryDelayMs(attempt: number): number {
	if (attempt <= 1) return 30_000;
	if (attempt === 2) return 120_000;
	if (attempt === 3) return 600_000;
	return 1_800_000;
}

export type ProjectAiReviewView = {
	cacheId: string;
	status: string;
	model: string;
	promptVersion: string;
	questionsHash: string;
	repoUrlNormalized: string;
	createdAt: number;
	updatedAt: number;
	completedAt: number | null;
	error: string | null;
	rawResponse: string | null;
	result: AiReviewStructuredResult | null;
	linkedAt: number;
	reusedAcrossProjects: boolean;
	jobStatus: string | null;
	jobAttemptCount: number | null;
	jobMaxAttempts: number | null;
	jobLastError: string | null;
};

export async function getProjectAiReview(projectId: string): Promise<ProjectAiReviewView | null> {
	const db = getDb();
	const rows = await db
		.select({
			cacheId: aiReviewCache.id,
			status: aiReviewCache.status,
			model: aiReviewCache.model,
			promptVersion: aiReviewCache.promptVersion,
			questionsHash: aiReviewCache.questionsHash,
			repoUrlNormalized: aiReviewCache.repoUrlNormalized,
			createdAt: aiReviewCache.createdAt,
			updatedAt: aiReviewCache.updatedAt,
			completedAt: aiReviewCache.completedAt,
			error: aiReviewCache.error,
			rawResponse: aiReviewCache.rawResponse,
			resultJson: aiReviewCache.resultJson,
			linkedAt: projectAiReview.linkedAt
		})
		.from(projectAiReview)
		.innerJoin(aiReviewCache, eq(projectAiReview.aiReviewCacheId, aiReviewCache.id))
		.where(eq(projectAiReview.projectId, projectId))
		.orderBy(desc(projectAiReview.linkedAt))
		.limit(1);
	const row = rows[0];
	if (!row) return null;

	const countRows = await db
		.select({ total: count() })
		.from(projectAiReview)
		.where(eq(projectAiReview.aiReviewCacheId, row.cacheId));
	const totalLinks = countRows[0]?.total ?? 1;
	let result: AiReviewStructuredResult | null = null;
	if (row.resultJson) {
		try {
			result = JSON.parse(row.resultJson) as AiReviewStructuredResult;
		} catch {
			result = null;
		}
	}
	return {
		cacheId: row.cacheId,
		status: row.status,
		model: row.model,
		promptVersion: row.promptVersion,
		questionsHash: row.questionsHash,
		repoUrlNormalized: row.repoUrlNormalized,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		completedAt: row.completedAt ?? null,
		error: row.error ?? null,
		rawResponse: row.rawResponse ?? null,
		result,
		linkedAt: row.linkedAt,
		reusedAcrossProjects: totalLinks > 1,
		jobStatus: null,
		jobAttemptCount: null,
		jobMaxAttempts: null,
		jobLastError: null
	};
}

async function completeJob(jobId: string) {
	await getDb()
		.update(aiReviewJob)
		.set({
			status: 'completed',
			lockedAt: null,
			updatedAt: Date.now(),
			finishedAt: Date.now(),
			lastError: null
		})
		.where(eq(aiReviewJob.id, jobId));
}

async function failOrRetryJob(jobId: string, attemptCount: number, maxAttempts: number, errorMessage: string) {
	const now = Date.now();
	if (attemptCount >= maxAttempts) {
		await getDb()
			.update(aiReviewJob)
			.set({
				status: 'failed',
				lockedAt: null,
				lastError: errorMessage,
				updatedAt: now,
				finishedAt: now
			})
			.where(eq(aiReviewJob.id, jobId));
		return;
	}
	await getDb()
		.update(aiReviewJob)
		.set({
			status: 'retrying',
			lockedAt: null,
			lastError: errorMessage,
			updatedAt: now,
			nextRunAt: now + nextRetryDelayMs(attemptCount)
		})
		.where(eq(aiReviewJob.id, jobId));
}

function shouldRetryJob(errorMessage: string): boolean {
	const m = errorMessage.toLowerCase();
	if (
		m.includes('unexpected token') ||
		m.includes('could not parse model response as json') ||
		(m.includes('anthropic api failed (400)') && m.includes('invalid_request_error')) ||
		m.includes('credits are exhausted')
	) {
		return false;
	}
	return true;
}

export async function enqueueAiReviewForProject(
	projectId: string,
	repoUrl: string,
	opts?: { forceFresh?: boolean }
): Promise<{
	source: 'cache_hit' | 'queued';
	cacheId?: string;
	jobId?: string;
}> {
	const repoUrlNormalized = normalizeRepoUrl(repoUrl);
	const questionsSnapshot = buildQuestionsSnapshot();
	const questionsHash = computeQuestionsHash(questionsSnapshot);

	if (!opts?.forceFresh) {
		const hit = await latestCompletedCache(repoUrlNormalized, questionsHash);
		if (hit) {
			await linkReviewToProject(projectId, hit.id);
			return { source: 'cache_hit', cacheId: hit.id };
		}
	}

	const now = Date.now();
	const existingJob = await getDb()
		.select()
		.from(aiReviewJob)
		.where(
			and(
				eq(aiReviewJob.projectId, projectId),
				inArray(aiReviewJob.status, ['queued', 'running', 'retrying'] as AiJobStatus[])
			)
		)
		.orderBy(desc(aiReviewJob.createdAt))
		.limit(1);
	if (existingJob[0]) return { source: 'queued', jobId: existingJob[0].id };
	const jobId = generateIdFromEntropySize(16);
	await getDb().insert(aiReviewJob).values({
		id: jobId,
		projectId,
		repoUrl: repoUrl.trim(),
		repoUrlNormalized,
		questionsHash,
		promptVersion: AI_REVIEW_PROMPT_VERSION,
		status: 'queued',
		attemptCount: 0,
		maxAttempts: 3,
		nextRunAt: now,
		lockedAt: null,
		lastError: null,
		createdAt: now,
		updatedAt: now,
		finishedAt: null
	});
	return { source: 'queued', jobId };
}

export async function hasCompletedReviewForRepo(repoUrl: string): Promise<boolean> {
	const repoUrlNormalized = normalizeRepoUrl(repoUrl);
	const qh = computeQuestionsHash(buildQuestionsSnapshot());
	const hit = await latestCompletedCache(repoUrlNormalized, qh);
	return Boolean(hit);
}

export async function processOneAiReviewJob(): Promise<{ processed: boolean; jobId?: string; status?: string }> {
	const db = getDb();
	const now = Date.now();
	const candidates = await db
		.select()
		.from(aiReviewJob)
		.where(
			and(
				inArray(aiReviewJob.status, ['queued', 'retrying'] as AiJobStatus[]),
				lte(aiReviewJob.nextRunAt, now),
				or(isNull(aiReviewJob.lockedAt), lte(aiReviewJob.lockedAt, now - 10 * 60_000))
			)
		)
		.orderBy(aiReviewJob.nextRunAt)
		.limit(1);
	const job = candidates[0];
	if (candidates.length > 0) {
		// Safe log: confirms worker sees eligible jobs (no secrets).
		console.log(
			'[ai-review-worker] eligible job:',
			`jobId=${job?.id ?? 'unknown'}`,
			`status=${job?.status ?? 'unknown'}`,
			`attempt=${job?.attemptCount ?? '?'}/${job?.maxAttempts ?? '?'}`,
			`nextRunAt=${job?.nextRunAt ?? '?'}`
		);
	}
	if (env.AI_REVIEW_WORKER_DEBUG === '1') {
		console.log(
			'[ai-review] worker tick candidates:',
			candidates.length,
			job?.id ? `job=${job.id}` : ''
		);
	}
	if (!job) return { processed: false };

	const lockRes = await db
		.update(aiReviewJob)
		.set({
			status: 'running',
			lockedAt: now,
			attemptCount: job.attemptCount + 1,
			updatedAt: now
		})
		.where(
			and(
				eq(aiReviewJob.id, job.id),
				inArray(aiReviewJob.status, ['queued', 'retrying'] as AiJobStatus[])
			)
		);
	const changes = Number((lockRes as { rowsAffected?: number })?.rowsAffected ?? 0);
	if (changes < 1) return { processed: false };

	let cacheId: string | null = null;
	let rawModelResponse: string | null = null;
	try {
		const hit = await latestCompletedCache(job.repoUrlNormalized, job.questionsHash);
		if (hit) {
			await linkReviewToProject(job.projectId, hit.id);
			await completeJob(job.id);
			return { processed: true, jobId: job.id, status: 'cache_hit' };
		}
		cacheId = generateIdFromEntropySize(16);
		await db.insert(aiReviewCache).values({
			id: cacheId,
			repoUrlNormalized: job.repoUrlNormalized,
			questionsHash: job.questionsHash,
			promptVersion: job.promptVersion,
			model: AI_REVIEW_MODEL,
			status: 'running' satisfies AiReviewStatus,
			resultJson: null,
			rawResponse: null,
			error: null,
			createdAt: now,
			updatedAt: now,
			completedAt: null
		});
		// Link immediately so failed runs still appear on the project page with raw response/error details.
		await linkReviewToProject(job.projectId, cacheId);
		const repoCtx = await buildRepoContextText(job.repoUrl);
		rawModelResponse = await callClaudeForReview({
			repoUrl: job.repoUrl,
			repoContextText: repoCtx.contextText,
			repoFileCount: repoCtx.fileCount,
			functionalQuestions: buildQuestionsSnapshot().functional,
			codeReviewQuestions: buildQuestionsSnapshot().codeReview
		});
		const review = parseAnthropicTextPayload(rawModelResponse);
		const doneAt = Date.now();
		await getDb()
			.update(aiReviewCache)
			.set({
				status: 'completed',
				resultJson: JSON.stringify(review),
				rawResponse: rawModelResponse,
				error: null,
				updatedAt: doneAt,
				completedAt: doneAt
			})
			.where(eq(aiReviewCache.id, cacheId));
		await linkReviewToProject(job.projectId, cacheId);
		await completeJob(job.id);
		return { processed: true, jobId: job.id, status: 'completed' };
	} catch (e) {
		const message = formatWorkerError(e);
		const friendly = toAdminFriendlyError(message);
		console.error('[ai-review-worker] job failed:', { jobId: job.id, error: message });
		if (cacheId) {
			await getDb()
				.update(aiReviewCache)
				.set({
					status: 'failed',
					rawResponse: rawModelResponse,
					error: message,
					updatedAt: Date.now(),
					completedAt: null
				})
				.where(eq(aiReviewCache.id, cacheId));
		}
		const retryable = shouldRetryJob(message);
		await failOrRetryJob(
			job.id,
			retryable ? job.attemptCount + 1 : job.maxAttempts,
			job.maxAttempts,
			friendly
		);
		return { processed: true, jobId: job.id, status: 'retry_or_failed' };
	}
}

export async function getProjectAiReviewOrJob(projectId: string): Promise<ProjectAiReviewView | null> {
	const review = await getProjectAiReview(projectId);
	const jobRows = await getDb()
		.select()
		.from(aiReviewJob)
		.where(eq(aiReviewJob.projectId, projectId))
		.orderBy(desc(aiReviewJob.createdAt))
		.limit(1);
	const j = jobRows[0];

	if (review) {
		return {
			...review,
			jobStatus: j?.status ?? null,
			jobAttemptCount: j?.attemptCount ?? null,
			jobMaxAttempts: j?.maxAttempts ?? null,
			jobLastError: j?.lastError ?? null
		};
	}
	if (!j) return null;
	return {
		cacheId: '',
		status: j.status,
		model: AI_REVIEW_MODEL,
		promptVersion: j.promptVersion,
		questionsHash: j.questionsHash,
		repoUrlNormalized: j.repoUrlNormalized,
		createdAt: j.createdAt,
		updatedAt: j.updatedAt,
		completedAt: null,
		error: j.lastError ?? null,
		rawResponse: null,
		result: null,
		linkedAt: j.createdAt,
		reusedAcrossProjects: false,
		jobStatus: j.status,
		jobAttemptCount: j.attemptCount,
		jobMaxAttempts: j.maxAttempts,
		jobLastError: j.lastError ?? null
	};
}

export async function retryLatestAiReviewJobForProject(projectId: string): Promise<{
	ok: true;
	jobId: string;
} | { ok: false; error: string }> {
	const db = getDb();
	const rows = await db
		.select()
		.from(aiReviewJob)
		.where(eq(aiReviewJob.projectId, projectId))
		.orderBy(desc(aiReviewJob.createdAt))
		.limit(1);
	const job = rows[0];
	if (!job) return { ok: false, error: 'No AI review job found for this project' };
	if (job.status !== 'failed') {
		return { ok: false, error: `AI review job is not failed (status: ${job.status})` };
	}
	const now = Date.now();
	await db
		.update(aiReviewJob)
		.set({
			status: 'queued',
			attemptCount: 0,
			lockedAt: null,
			nextRunAt: now,
			lastError: null,
			updatedAt: now,
			finishedAt: null
		})
		.where(eq(aiReviewJob.id, job.id));
	return { ok: true, jobId: job.id };
}

let workerLoopStarted = false;
export function startAiReviewWorkerLoop() {
	const g = globalThis as typeof globalThis & { __aiReviewWorkerInterval?: ReturnType<typeof setInterval> };
	if (workerLoopStarted || g.__aiReviewWorkerInterval) return;
	if (env.AI_REVIEW_WORKER_DISABLED === '1') return;
	workerLoopStarted = true;
	console.log('[ai-review-worker] started');
	const tick = async () => {
		try {
			await processOneAiReviewJob();
		} catch (e) {
			console.error('[ai-review-worker] tick error', e);
		}
	};
	void tick();
	g.__aiReviewWorkerInterval = setInterval(() => {
		void tick();
	}, 5000);
}
