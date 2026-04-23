import { getPersonaDisplayLabel } from '$lib/appState.svelte';
import type { TestingComment, TestingDecision } from '$lib/types';

export function verdictChipClass(d: TestingDecision) {
	if (d === 'accept') return 'bg-kood-accent/15 text-kood-accent ring-kood-accent/40';
	if (d === 'decline') return 'bg-red-500/10 text-red-300 ring-red-400/35';
	return 'bg-kood-bg text-kood-muted ring-kood-border';
}

export function verdictLabel(d: TestingDecision) {
	if (d === 'accept') return 'Accept';
	if (d === 'decline') return 'Decline';
	return 'Pending';
}

export function formatShortTimestamp(iso: string) {
	try {
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	} catch {
		return iso;
	}
}

export function reviewerDisplayName(author: 'jane' | 'joe' | 'sandra'): string {
	return getPersonaDisplayLabel(author);
}

export function commentAuthorLabel(a: TestingComment['author']) {
	return reviewerDisplayName(a);
}

/** Submitter vs reviewer slot (A = prototype Jane, B = Joe) — neutral UI, no role colours. */
export function testingCommentThreadSlotLabel(author: TestingComment['author']): string {
	if (author === 'sandra') return 'Submitter';
	if (author === 'jane') return 'Reviewer A';
	return 'Reviewer B';
}

/** Thread row — one neutral style; role is read from `testingCommentThreadSlotLabel` only. */
export function testingCommentThreadChrome(_author: TestingComment['author']): {
	rolePill: string;
	rowClass: string;
} {
	return {
		rolePill:
			'shrink-0 rounded border border-kood-border/60 bg-kood-surface/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-kood-muted',
		rowClass: 'rounded-md border border-kood-border/60 bg-kood-bg/30 px-2.5 py-2'
	};
}

export function formatVerdictHistoryLine(h: {
	round: number;
	jane: TestingDecision;
	joe: TestingDecision;
}): string {
	const j = getPersonaDisplayLabel('jane');
	const o = getPersonaDisplayLabel('joe');
	return `R${h.round}: ${j} ${h.jane} · ${o} ${h.joe}`;
}
