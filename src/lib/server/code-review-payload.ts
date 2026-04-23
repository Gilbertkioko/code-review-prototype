import { CATEGORIES } from '$lib/constants';
import type {
	CategorySession,
	ReviewerRatingSet,
	SandraRating,
	StandupTakeawayMessage
} from '$lib/types';

const STANDUP_LEN = 5;

export type StandupSnapshotPersisted = {
	standupWhen: string;
	standupVoiceChannel: string;
	standupTakeaways: string;
	standupTakeawayMessages: StandupTakeawayMessage[];
	standupItems: boolean[];
};

/** Optional standup block embedded in `code_review_json` (saved with code review workspace). */
export function parseStandupSnapshotFromCodeReviewJson(
	codeReviewJson: string | null
): StandupSnapshotPersisted | null {
	if (!codeReviewJson) return null;
	try {
		const root = JSON.parse(codeReviewJson) as Record<string, unknown>;
		const s = root.standup;
		if (!s || typeof s !== 'object') return null;
		const o = s as Record<string, unknown>;
		const items: boolean[] = [];
		if (Array.isArray(o.standupItems)) {
			for (let i = 0; i < STANDUP_LEN; i++) {
				items.push(i < o.standupItems.length ? Boolean(o.standupItems[i]) : false);
			}
		} else {
			for (let i = 0; i < STANDUP_LEN; i++) items.push(false);
		}
		const msgs: StandupTakeawayMessage[] = [];
		if (Array.isArray(o.standupTakeawayMessages)) {
			for (const x of o.standupTakeawayMessages) {
				if (!x || typeof x !== 'object') continue;
				const m = x as Record<string, unknown>;
				if (m.author !== 'sandra' && m.author !== 'jane' && m.author !== 'joe') continue;
				if (typeof m.text !== 'string' || !m.text.trim()) continue;
				msgs.push({
					id: typeof m.id === 'string' ? m.id : `m-${msgs.length}`,
					author: m.author,
					text: m.text.slice(0, 2000),
					at: typeof m.at === 'string' ? m.at : ''
				});
			}
		}
		const legacy = typeof o.standupTakeaways === 'string' ? o.standupTakeaways : '';
		if (msgs.length === 0 && legacy.trim()) {
			msgs.push({
				id: 'legacy',
				author: 'sandra',
				text: legacy.trim().slice(0, 2000),
				at: ''
			});
		}
		msgs.sort((a, b) => a.at.localeCompare(b.at));
		return {
			standupWhen: typeof o.standupWhen === 'string' ? o.standupWhen : '',
			standupVoiceChannel: typeof o.standupVoiceChannel === 'string' ? o.standupVoiceChannel : '',
			standupTakeaways: legacy,
			standupTakeawayMessages: msgs,
			standupItems: items
		};
	} catch {
		return null;
	}
}

export type Feedback360SnapshotPersisted = {
	sandraRatings: SandraRating[];
	reviewerRatings: Record<'jane' | 'joe', ReviewerRatingSet>;
};

function blankReviewerSet(): ReviewerRatingSet {
	return {
		readableCode: { score: null, comment: '', submitted: false },
		codeComments: { score: null, comment: '', submitted: false },
		crossReviewer: { score: null, comment: '', submitted: false }
	};
}

function parseMiniRating(
	raw: unknown,
	fallback: { score: number | null; comment: string; submitted: boolean }
): { score: number | null; comment: string; submitted: boolean } {
	if (!raw || typeof raw !== 'object') return { ...fallback };
	const o = raw as Record<string, unknown>;
	let score: number | null = fallback.score;
	if (o.score === null) score = null;
	else if (typeof o.score === 'number' && o.score >= 1 && o.score <= 5) score = o.score;
	return {
		score,
		comment: typeof o.comment === 'string' ? o.comment : fallback.comment,
		submitted: typeof o.submitted === 'boolean' ? o.submitted : fallback.submitted
	};
}

function parseReviewerSlot(raw: unknown, blank: ReviewerRatingSet): ReviewerRatingSet {
	if (!raw || typeof raw !== 'object') return { ...blank };
	const o = raw as Record<string, unknown>;
	return {
		readableCode: parseMiniRating(o.readableCode, blank.readableCode),
		codeComments: parseMiniRating(o.codeComments, blank.codeComments),
		crossReviewer: parseMiniRating(o.crossReviewer, blank.crossReviewer)
	};
}

/** Optional `feedback360` block in `code_review_json` (admin / reporting). */
export function parseFeedback360SnapshotFromCodeReviewJson(
	codeReviewJson: string | null
): Feedback360SnapshotPersisted | null {
	if (!codeReviewJson) return null;
	try {
		const root = JSON.parse(codeReviewJson) as Record<string, unknown>;
		const fb = root.feedback360;
		if (!fb || typeof fb !== 'object') return null;
		const o = fb as Record<string, unknown>;

		const byId = new Map<string, SandraRating>();
		if (Array.isArray(o.sandraRatings)) {
			for (const x of o.sandraRatings) {
				if (!x || typeof x !== 'object') continue;
				const r = x as Record<string, unknown>;
				if (typeof r.categoryId !== 'string') continue;
				let score: number | null = null;
				if (r.score === null) score = null;
				else if (typeof r.score === 'number' && r.score >= 1 && r.score <= 5) score = r.score;
				byId.set(r.categoryId, {
					categoryId: r.categoryId,
					score,
					comment: typeof r.comment === 'string' ? r.comment : '',
					submitted: Boolean(r.submitted)
				});
			}
		}
		const sandraRatings: SandraRating[] = CATEGORIES.map((c) => {
			const row = byId.get(c.id);
			return (
				row ?? {
					categoryId: c.id,
					score: null,
					comment: '',
					submitted: false
				}
			);
		});

		const blank = blankReviewerSet();
		const rr = o.reviewerRatings;
		const rrObj = rr && typeof rr === 'object' ? (rr as Record<string, unknown>) : {};
		const reviewerRatings: Record<'jane' | 'joe', ReviewerRatingSet> = {
			jane: parseReviewerSlot(rrObj.jane, blank),
			joe: parseReviewerSlot(rrObj.joe, blank)
		};

		return { sandraRatings, reviewerRatings };
	} catch {
		return null;
	}
}

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
