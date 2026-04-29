import { env } from '$env/dynamic/private';
import { CATEGORIES } from '$lib/constants';
import { createFullTestingItems } from '$lib/features/testing/checklist';
import { and, count, desc, eq, inArray, isNull, lte, or } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { createHash } from 'node:crypto';
import { getDb } from './db';
import { aiReviewCache, aiReviewJob, projectAiReview } from './db/schema';

export const AI_REVIEW_PROMPT_VERSION = 'v2';
export const AI_REVIEW_MODEL = 'claude-haiku-4-5-20251001';

type AiReviewStatus = 'pending' | 'running' | 'completed' | 'failed';
type AiJobStatus = 'queued' | 'running' | 'retrying' | 'completed' | 'failed';

function resolveAnthropicApiKey(): string {
	return (env.ANTHROPIC_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim() || '').trim();
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

function parseAnthropicTextPayload(rawText: string): AiReviewStructuredResult {
	const trimmed = rawText.trim();
	const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
	const jsonText = fenced ? fenced[1] : trimmed;
	const parsed = JSON.parse(jsonText) as AiReviewStructuredResult;
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
	functionalQuestions: Array<{ id: string; text: string }>;
	codeReviewQuestions: Array<{ id: string; category: string; text: string }>;
}): Promise<{ structured: AiReviewStructuredResult; raw: string }> {
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
		'Review the repository at the provided URL using the supplied question sets.',
		'If direct repository access is not possible, clearly state assumptions and limit certainty.',
		'Respond with valid JSON only (no markdown, no extra text).',
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
			max_tokens: 4000,
			temperature: 0.2,
			messages: [{ role: 'user', content: prompt }]
		})
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Anthropic API failed (${res.status}): ${body.slice(0, 500)}`);
	}
	const payload = (await res.json()) as {
		content?: Array<{ type?: string; text?: string }>;
	};
	const textBlocks = (payload.content ?? []).filter((b) => b.type === 'text' && typeof b.text === 'string');
	const rawText = textBlocks.map((b) => b.text ?? '').join('\n').trim();
	if (!rawText) throw new Error('Anthropic response did not include text content');
	const structured = parseAnthropicTextPayload(rawText);
	return { structured, raw: rawText };
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
				lastError: errorMessage.slice(0, 2000),
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
			lastError: errorMessage.slice(0, 2000),
			updatedAt: now,
			nextRunAt: now + nextRetryDelayMs(attemptCount)
		})
		.where(eq(aiReviewJob.id, jobId));
}

export async function enqueueAiReviewForProject(projectId: string, repoUrl: string): Promise<{
	source: 'cache_hit' | 'queued';
	cacheId?: string;
	jobId?: string;
}> {
	const repoUrlNormalized = normalizeRepoUrl(repoUrl);
	const questionsSnapshot = buildQuestionsSnapshot();
	const questionsHash = computeQuestionsHash(questionsSnapshot);

	const hit = await latestCompletedCache(repoUrlNormalized, questionsHash);
	if (hit) {
		await linkReviewToProject(projectId, hit.id);
		return { source: 'cache_hit', cacheId: hit.id };
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

	try {
		const hit = await latestCompletedCache(job.repoUrlNormalized, job.questionsHash);
		if (hit) {
			await linkReviewToProject(job.projectId, hit.id);
			await completeJob(job.id);
			return { processed: true, jobId: job.id, status: 'cache_hit' };
		}
		const cacheId = generateIdFromEntropySize(16);
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
		const review = await callClaudeForReview({
			repoUrl: job.repoUrl,
			functionalQuestions: buildQuestionsSnapshot().functional,
			codeReviewQuestions: buildQuestionsSnapshot().codeReview
		});
		const doneAt = Date.now();
		await getDb()
			.update(aiReviewCache)
			.set({
				status: 'completed',
				resultJson: JSON.stringify(review.structured),
				rawResponse: review.raw,
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
		await failOrRetryJob(job.id, job.attemptCount + 1, job.maxAttempts, friendly);
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
	if (workerLoopStarted) return;
	if (env.AI_REVIEW_WORKER_DISABLED === '1') return;
	workerLoopStarted = true;
	console.log('[ai-review-worker] started');
	if (env.AI_REVIEW_WORKER_DEBUG === '1') {
		console.log('[ai-review-worker] started');
	}
	const tick = async () => {
		try {
			await processOneAiReviewJob();
		} catch (e) {
			console.error('[ai-review-worker] tick error', e);
		}
	};
	void tick();
	setInterval(() => {
		void tick();
	}, 5000);
}
