import { CATEGORIES } from '$lib/constants';
import type { CategorySession } from '$lib/types';

/** Parse code review JSON from UI (legacy category map or wrapped `{ categorySessions, codeReviewRound }`). */
export function parseCodeReviewSavePayload(json: string): {
	sessions: Record<string, CategorySession>;
	codeReviewRound: number;
} | null {
	try {
		const root = JSON.parse(json) as Record<string, unknown>;
		const sessions =
			root.categorySessions && typeof root.categorySessions === 'object'
				? (root.categorySessions as Record<string, CategorySession>)
				: (root as Record<string, CategorySession>);
		if (!sessions || typeof sessions !== 'object') return null;
		if (!CATEGORIES.some((c) => c.id in sessions)) return null;
		const round =
			typeof root.codeReviewRound === 'number' && root.codeReviewRound >= 1
				? root.codeReviewRound
				: 1;
		return { sessions, codeReviewRound: round };
	} catch {
		return null;
	}
}
