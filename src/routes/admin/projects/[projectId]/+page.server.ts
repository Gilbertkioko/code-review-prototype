import { CATEGORIES } from '$lib/constants';
import { auditCodeReviewThreads, auditTestingThreads, personaDisplayName } from '$lib/server/review-audit';
import type { AuditThreadEntry } from '$lib/server/review-audit';
import {
	getPairForProject,
	getProjectById,
	listCodeReviewObservationProgressForProject,
	listCodeReviewThreadMessagesForProject,
	listTestingItemProgressForProject,
	listTestingThreadMessagesForProject
} from '$lib/server/review-workspace';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const runtime = 'nodejs';

function categoryTitle(id: string): string {
	return CATEGORIES.find((c) => c.id === id)?.title ?? id;
}

function observationSnippet(categoryId: string, observationId: string): string {
	const cat = CATEGORIES.find((c) => c.id === categoryId);
	const o = cat?.observations.find((x) => x.id === observationId);
	const t = o?.text ?? observationId;
	return t.length > 72 ? `${t.slice(0, 72)}…` : t;
}

export const load: PageServerLoad = async ({ params }) => {
	const projectRow = await getProjectById(params.projectId);
	if (!projectRow) error(404, 'Not found');
	const pair = await getPairForProject(params.projectId);

	const tp = await listTestingItemProgressForProject(params.projectId);
	const tm = await listTestingThreadMessagesForProject(params.projectId);
	const cp = await listCodeReviewObservationProgressForProject(params.projectId);
	const cm = await listCodeReviewThreadMessagesForProject(params.projectId);

	let testingThreads: AuditThreadEntry[];
	if (tm.length > 0) {
		const progByItem = new Map(tp.map((p) => [p.itemId, p]));
		testingThreads = tm.map((m) => {
			const p = progByItem.get(m.itemId);
			const prefix = p ? (p.section === 'mandatory' ? 'Testing · mandatory' : 'Testing · extra') : 'Testing';
			const sn = (p?.itemSummary ?? m.itemId).slice(0, 80);
			return {
				context: `${prefix} · ${m.itemId} — ${sn}`,
				authorLabel: personaDisplayName(m.authorPersona),
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
		codeReviewThreads = cm.map((m) => ({
			context: `Code review · ${categoryTitle(m.categoryId)} · ${m.observationId} — ${observationSnippet(m.categoryId, m.observationId)}`,
			authorLabel: personaDisplayName(m.authorPersona),
			round: m.round,
			at: new Date(m.postedAt).toISOString(),
			text: m.body
		}));
	} else {
		codeReviewThreads = auditCodeReviewThreads(projectRow.codeReviewJson ?? null);
	}

	return {
		project: projectRow,
		pair,
		testingItemProgress: tp,
		codeReviewObservationProgress: cp,
		testingThreads,
		codeReviewThreads
	};
};
