import { CATEGORIES } from '$lib/constants';
import type { CategorySession, TestingItem } from '$lib/types';

export type AuditThreadEntry = {
	context: string;
	authorLabel: string;
	round?: number;
	at: string;
	text: string;
};

export function personaDisplayName(author: string): string {
	if (author === 'sandra') return 'Submitter';
	if (author === 'jane') return 'Reviewer 1';
	if (author === 'joe') return 'Reviewer 2';
	return author;
}

function truncate(s: string, n: number): string {
	if (s.length <= n) return s;
	return `${s.slice(0, n)}…`;
}

/** Flatten saved Testing checklist comment threads for admin audit. */
export function auditTestingThreads(testingJson: string | null): AuditThreadEntry[] {
	const out: AuditThreadEntry[] = [];
	if (!testingJson) return out;
	try {
		const doc = JSON.parse(testingJson) as { testingItems?: TestingItem[] };
		const items = doc.testingItems;
		if (!Array.isArray(items)) return out;
		for (const item of items) {
			if (!item?.id || !Array.isArray(item.comments)) continue;
			const prefix = item.section === 'mandatory' ? 'Testing · mandatory' : 'Testing · extra';
			const snippet = truncate(typeof item.text === 'string' ? item.text : item.id, 80);
			for (const c of item.comments) {
				if (!c || typeof c.text !== 'string') continue;
				out.push({
					context: `${prefix} · ${item.id} — ${snippet}`,
					authorLabel: personaDisplayName(String(c.author)),
					round: typeof c.round === 'number' ? c.round : undefined,
					at: typeof c.at === 'string' ? c.at : '',
					text: c.text
				});
			}
		}
	} catch {
		/* invalid JSON */
	}
	return out;
}

/** Flatten saved code-review observation comment threads for admin audit. */
export function auditCodeReviewThreads(codeReviewJson: string | null): AuditThreadEntry[] {
	const out: AuditThreadEntry[] = [];
	if (!codeReviewJson) return out;
	try {
		const root = JSON.parse(codeReviewJson) as Record<string, unknown>;
		const sessions =
			root.categorySessions && typeof root.categorySessions === 'object'
				? (root.categorySessions as Record<string, CategorySession>)
				: (root as Record<string, CategorySession>);
		if (!sessions || typeof sessions !== 'object') return out;
		for (const cat of CATEGORIES) {
			const s = sessions[cat.id];
			if (!s?.observationRows) continue;
			for (const o of cat.observations) {
				const row = s.observationRows[o.id];
				if (!row || !Array.isArray(row.comments)) continue;
				const obsSnippet = truncate(o.text, 72);
				for (const c of row.comments) {
					if (!c || typeof c.text !== 'string') continue;
					out.push({
						context: `Code review · ${cat.title} · ${o.id} — ${obsSnippet}`,
						authorLabel: personaDisplayName(String(c.author)),
						round: typeof c.round === 'number' ? c.round : undefined,
						at: typeof c.at === 'string' ? c.at : '',
						text: c.text
					});
				}
			}
		}
	} catch {
		/* invalid JSON */
	}
	return out;
}
