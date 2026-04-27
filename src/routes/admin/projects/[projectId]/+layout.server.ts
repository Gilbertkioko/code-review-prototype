import { CATEGORIES } from '$lib/constants';
import {
	parseFeedback360SnapshotFromCodeReviewJson,
	parseStandupSnapshotFromCodeReviewJson
} from '$lib/server/code-review-payload';
import { buildAdminTestingSummary } from '$lib/server/admin-testing-summary';
import {
	auditCodeReviewThreads,
	auditTestingThreads,
	groupAuditThreads,
	normalizeAuditPersona,
	personaDisplayName
} from '$lib/server/review-audit';
import type { AuditThreadEntry } from '$lib/server/review-audit';
import {
	adminProjectDisplayTitle,
	getPairForProject,
	getProjectById,
	listCodeReviewThreadMessagesForProject,
	listTestingItemProgressForProject,
	listTestingThreadMessagesForProject,
	reviewRoomDisplayLabels,
	userPublicRow
} from '$lib/server/review-workspace';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

function categoryTitle(id: string): string {
	return CATEGORIES.find((c) => c.id === id)?.title ?? id;
}

function observationSnippet(categoryId: string, observationId: string): string {
	const cat = CATEGORIES.find((c) => c.id === categoryId);
	const o = cat?.observations.find((x) => x.id === observationId);
	const t = o?.text ?? observationId;
	return t.length > 72 ? `${t.slice(0, 72)}…` : t;
}

function relabelThreadEntries(
	entries: AuditThreadEntry[],
	room: { submitterUsername: string; reviewerAUsername: string; reviewerBUsername: string }
): AuditThreadEntry[] {
	return entries.map((e) => ({
		...e,
		authorLabel:
			e.authorPersona === 'sandra'
				? room.submitterUsername
				: e.authorPersona === 'jane'
					? room.reviewerAUsername
					: e.authorPersona === 'joe'
						? room.reviewerBUsername
						: e.authorLabel
	}));
}

export const load: LayoutServerLoad = async ({ params, parent }) => {
	await parent();
	const projectRow = await getProjectById(params.projectId);
	if (!projectRow) error(404, 'Not found');
	const pair = await getPairForProject(params.projectId);

	const tm = await listTestingThreadMessagesForProject(params.projectId);
	const cm = await listCodeReviewThreadMessagesForProject(params.projectId);
	const testingProgressRows = await listTestingItemProgressForProject(params.projectId);

	const room = pair
		? await reviewRoomDisplayLabels(projectRow.submitterId, pair)
		: {
				submitterUsername: (await userPublicRow(projectRow.submitterId))?.username ?? 'Submitter',
				reviewerAUsername: 'Reviewer A (not paired)',
				reviewerBUsername: 'Reviewer B (not paired)'
			};

	let testingThreads: AuditThreadEntry[];
	if (tm.length > 0) {
		const progByItem = new Map(testingProgressRows.map((p) => [p.itemId, p]));
		testingThreads = tm.map((m) => {
			const p = progByItem.get(m.itemId);
			const prefix = p ? (p.section === 'mandatory' ? 'Testing · mandatory' : 'Testing · extra') : 'Testing';
			const sn = (p?.itemSummary ?? m.itemId).slice(0, 80);
			const ap = String(m.authorPersona);
			return {
				context: `${prefix} · ${m.itemId} — ${sn}`,
				authorLabel: personaDisplayName(ap),
				authorPersona: normalizeAuditPersona(ap),
				round: m.round,
				at: new Date(m.postedAt).toISOString(),
				text: m.body
			};
		});
	} else {
		testingThreads = auditTestingThreads(projectRow.testingJson ?? null);
	}

	let codeReviewThreads: AuditThreadEntry[];
	if (cm.length > 0) {
		codeReviewThreads = cm.map((m) => {
			const ap = String(m.authorPersona);
			return {
				context: `Code review · ${categoryTitle(m.categoryId)} · ${m.observationId} — ${observationSnippet(m.categoryId, m.observationId)}`,
				authorLabel: personaDisplayName(ap),
				authorPersona: normalizeAuditPersona(ap),
				round: m.round,
				at: new Date(m.postedAt).toISOString(),
				text: m.body
			};
		});
	} else {
		codeReviewThreads = auditCodeReviewThreads(projectRow.codeReviewJson ?? null);
	}

	const testingThreadGroups = groupAuditThreads(relabelThreadEntries(testingThreads, room));
	const codeReviewThreadGroups = groupAuditThreads(relabelThreadEntries(codeReviewThreads, room));

	const testingChecklistAdminSummary = buildAdminTestingSummary(
		projectRow.testingJson ?? null,
		testingProgressRows
	);

	const projectDisplayTitle = adminProjectDisplayTitle(
		projectRow.giteaUrl,
		projectRow.instructions
	);

	return {
		project: projectRow,
		projectDisplayTitle,
		pair,
		submitterName: room.submitterUsername,
		reviewerAName: room.reviewerAUsername,
		reviewerBName: room.reviewerBUsername,
		testingThreadGroups,
		testingChecklistAdminSummary,
		codeReviewThreadGroups,
		standupSnapshot: parseStandupSnapshotFromCodeReviewJson(projectRow.codeReviewJson ?? null),
		feedback360Snapshot: parseFeedback360SnapshotFromCodeReviewJson(projectRow.codeReviewJson ?? null)
	};
};
