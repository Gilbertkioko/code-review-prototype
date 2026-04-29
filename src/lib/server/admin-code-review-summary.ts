import { CATEGORIES, codeReviewObservationsForCategory } from '$lib/constants';
import { parseCodeReviewSavePayload } from '$lib/server/code-review-payload';
import type { TestingDecision } from '$lib/types';

type ProgressRow = {
	categoryId: string;
	observationId: string;
	janeVerdict: string;
	joeVerdict: string;
	codeReviewRound: number;
};

export type AdminCodeReviewOutcome = 'pass' | 'fail' | 'pending';

export type AdminCodeReviewRowSummary = {
	order: number;
	categoryId: string;
	observationId: string;
	compositeId: string;
	categoryTitle: string;
	summary: string;
	assignee: 'jane' | 'joe';
	jane: TestingDecision;
	joe: TestingDecision;
	ownerVerdict: TestingDecision;
	outcome: AdminCodeReviewOutcome;
	ownerDeclines: number;
	ownerDeclinesBeforeAccept: number;
};

export type AdminCodeReviewSummary = {
	codeReviewRound: number;
	rows: AdminCodeReviewRowSummary[];
	janeTotal: number;
	joeTotal: number;
};

type VerdictEventRow = {
	categoryId: string;
	observationId: string;
	persona: string;
	verdict: string;
	changedAt: number;
};

function asVerdict(v: string): TestingDecision {
	if (v === 'accept' || v === 'decline' || v === 'pending') return v;
	return 'pending';
}

function ownerOutcome(v: TestingDecision): AdminCodeReviewOutcome {
	if (v === 'accept') return 'pass';
	if (v === 'decline') return 'fail';
	return 'pending';
}

function snippet(text: string, n: number): string {
	const s = text.trim();
	if (s.length <= n) return s;
	return `${s.slice(0, n)}...`;
}

export function buildAdminCodeReviewSummary(
	codeReviewJson: string | null,
	progressRows: ProgressRow[],
	assigneeMap: Record<string, 'jane' | 'joe'>,
	verdictEvents: VerdictEventRow[] = []
): AdminCodeReviewSummary {
	const parsed = codeReviewJson ? parseCodeReviewSavePayload(codeReviewJson) : null;
	const sessions = parsed?.sessions ?? {};
	let round = parsed?.codeReviewRound ?? 1;
	if (progressRows.length > 0) {
		const maxR = Math.max(...progressRows.map((r) => r.codeReviewRound), round);
		if (Number.isFinite(maxR) && maxR >= 1) round = maxR;
	}

	const progressByKey = new Map(progressRows.map((r) => [`${r.categoryId}:${r.observationId}`, r]));
	const rows: AdminCodeReviewRowSummary[] = [];
	let order = 0;
	for (const cat of CATEGORIES) {
		const categoryAssignee = assigneeMap[cat.id] ?? cat.assignee;
		for (const obs of codeReviewObservationsForCategory(cat)) {
			const key = `${cat.id}:${obs.id}`;
			const p = progressByKey.get(key);
			const sessionRow = sessions?.[cat.id]?.observationRows?.[obs.id];
			const jane = asVerdict(p?.janeVerdict ?? sessionRow?.jane ?? 'pending');
			const joe = asVerdict(p?.joeVerdict ?? sessionRow?.joe ?? 'pending');
			const ownerEvents = verdictEvents
				.filter(
					(e) =>
						e.categoryId === cat.id &&
						e.observationId === obs.id &&
						e.persona === categoryAssignee
				)
				.sort((a, b) => a.changedAt - b.changedAt);
			const ownerSeq = ownerEvents.map((e) => asVerdict(e.verdict));
			const ownerDeclines = ownerSeq.filter((v) => v === 'decline').length;
			const firstAccept = ownerSeq.findIndex((v) => v === 'accept');
			const ownerDeclinesBeforeAccept =
				firstAccept >= 0
					? ownerSeq.slice(0, firstAccept).filter((v) => v === 'decline').length
					: ownerDeclines;
			const ownerVerdict = categoryAssignee === 'jane' ? jane : joe;
			rows.push({
				order: order++,
				categoryId: cat.id,
				observationId: obs.id,
				compositeId: key,
				categoryTitle: cat.title,
				summary: snippet(obs.text, 110),
				assignee: categoryAssignee,
				jane,
				joe,
				ownerVerdict,
				outcome: ownerOutcome(ownerVerdict),
				ownerDeclines,
				ownerDeclinesBeforeAccept
			});
		}
	}

	return {
		codeReviewRound: round,
		rows,
		janeTotal: rows.filter((r) => r.assignee === 'jane').length,
		joeTotal: rows.filter((r) => r.assignee === 'joe').length
	};
}
