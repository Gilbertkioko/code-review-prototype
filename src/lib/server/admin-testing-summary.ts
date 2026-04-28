import { createFullTestingItems } from '$lib/features/testing/checklist';
import type { TestingDecision, TestingItem } from '$lib/types';

type ProgressRow = {
	itemId: string;
	section: string;
	itemSummary: string;
	mandatoryOwner: string | null;
	janeVerdict: string;
	joeVerdict: string;
	testingRound: number;
};

export type AdminTestingOutcome = 'pass' | 'fail' | 'pending';

export type AdminTestingRowSummary = {
	order: number;
	itemId: string;
	section: 'mandatory' | 'extra';
	summary: string;
	mandatoryOwner: 'jane' | 'joe' | null;
	jane: TestingDecision;
	joe: TestingDecision;
	outcome: AdminTestingOutcome;
};

export type AdminTestingSectionStats = {
	total: number;
	pass: number;
	fail: number;
	pending: number;
};

export type AdminTestingSummary = {
	testingRound: number;
	rows: AdminTestingRowSummary[];
	mandatory: AdminTestingSectionStats;
	extra: AdminTestingSectionStats;
	firstFailure: AdminTestingRowSummary | null;
	allMandatoryPass: boolean;
};

function asVerdict(v: string): TestingDecision {
	if (v === 'accept' || v === 'decline' || v === 'pending') return v;
	return 'pending';
}

function mergeTestingFromJson(json: string | null): { items: TestingItem[]; round: number } {
	const fresh = createFullTestingItems();
	if (!json) return { items: fresh, round: 1 };
	try {
		const doc = JSON.parse(json) as { testingRound?: number; testingItems?: TestingItem[] };
		const round = typeof doc.testingRound === 'number' && doc.testingRound >= 1 ? doc.testingRound : 1;
		const parsed = doc.testingItems;
		if (!Array.isArray(parsed) || parsed.length === 0) return { items: fresh, round };
		const row0 = parsed[0] as unknown as Record<string, unknown> | undefined;
		if (!row0 || typeof row0.jane !== 'string' || !('section' in row0)) return { items: fresh, round };
		const items = fresh.map((def) => {
			const old = parsed.find((x) => x?.id === def.id) as TestingItem | undefined;
			if (!old || typeof old.jane !== 'string') return { ...def };
			return {
				...def,
				jane: old.jane,
				joe: old.joe,
				verdictHistory: Array.isArray(old.verdictHistory) ? old.verdictHistory : [],
				comments: Array.isArray(old.comments) ? old.comments : [],
				drafts: old.drafts && typeof old.drafts === 'object' ? { ...old.drafts } : {}
			};
		});
		return { items, round };
	} catch {
		return { items: fresh, round: 1 };
	}
}

function applyProgressRows(items: TestingItem[], rows: ProgressRow[]): TestingItem[] {
	if (rows.length === 0) return items;
	return items.map((def) => {
		const r = rows.find((x) => x.itemId === def.id);
		if (!r) return def;
		return {
			...def,
			jane: asVerdict(r.janeVerdict),
			joe: asVerdict(r.joeVerdict)
		};
	});
}

function rowOutcome(t: TestingItem): AdminTestingOutcome {
	if (t.section === 'mandatory' && t.mandatoryOwner) {
		const v = t[t.mandatoryOwner];
		if (v === 'accept') return 'pass';
		if (v === 'decline') return 'fail';
		return 'pending';
	}
	if (t.jane === 'decline' || t.joe === 'decline') return 'fail';
	if (t.jane === 'accept' && t.joe === 'accept') return 'pass';
	return 'pending';
}

function snippet(text: string, n: number): string {
	const s = text.trim();
	if (s.length <= n) return s;
	return `${s.slice(0, n)}…`;
}

/** Merge saved JSON with optional DB progress rows, then compute admin-facing checklist stats. */
export function buildAdminTestingSummary(
	testingJson: string | null,
	progressRows: ProgressRow[]
): AdminTestingSummary {
	const fromJson = mergeTestingFromJson(testingJson);
	let items = fromJson.items;
	let round = fromJson.round;
	items = applyProgressRows(items, progressRows);
	if (progressRows.length > 0) {
		const maxR = Math.max(...progressRows.map((r) => r.testingRound), round);
		if (Number.isFinite(maxR) && maxR >= 1) round = maxR;
	}

	const rows: AdminTestingRowSummary[] = items.map((t, order) => ({
		order,
		itemId: t.id,
		section: t.section,
		summary: snippet(t.text, 96),
		mandatoryOwner: t.mandatoryOwner ?? null,
		jane: t.jane,
		joe: t.joe,
		outcome: rowOutcome(t)
	}));

	const mandRows = rows.filter((r) => r.section === 'mandatory');
	const extraRows = rows.filter((r) => r.section === 'extra');

	function stats(list: AdminTestingRowSummary[]): AdminTestingSectionStats {
		return {
			total: list.length,
			pass: list.filter((x) => x.outcome === 'pass').length,
			fail: list.filter((x) => x.outcome === 'fail').length,
			pending: list.filter((x) => x.outcome === 'pending').length
		};
	}

	const firstFailure =
		rows.find((r) => r.outcome === 'fail') ?? null;

	const allMandatoryPass = mandRows.length > 0 && mandRows.every((r) => r.outcome === 'pass');

	return {
		testingRound: round,
		rows,
		mandatory: stats(mandRows),
		extra: stats(extraRows),
		firstFailure,
		allMandatoryPass
	};
}
