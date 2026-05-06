import {
	enqueueAiReviewForProject,
	getProjectAiReviewOrJob,
	hasCompletedReviewForRepo,
	retryLatestAiReviewJobForProject
} from '$lib/server/ai-review';
import { getProjectById } from '$lib/server/review-workspace';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const project = await getProjectById(params.projectId);
	const aiReview = await getProjectAiReviewOrJob(params.projectId);
	const hasPreviousSuccessfulReview =
		project?.giteaUrl ? await hasCompletedReviewForRepo(project.giteaUrl) : false;
	return { aiReview, hasPreviousSuccessfulReview, hasRepoUrl: Boolean(project?.giteaUrl) };
};

export const actions: Actions = {
	retryAiReview: async ({ locals, params }) => {
		const admin = locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);
		const res = await retryLatestAiReviewJobForProject(params.projectId);
		if (!res.ok) return fail(400, { message: res.error });
		return { success: true };
	},
	reviewAgainFresh: async ({ locals, params, request }) => {
		const admin = locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);
		const fd = await request.formData();
		const confirmed = fd.get('confirm');
		if (confirmed !== '1') return fail(400, { message: 'Confirmation required' });
		const p = await getProjectById(params.projectId);
		if (!p?.giteaUrl) return fail(400, { message: 'Project has no repository URL' });
		const res = await enqueueAiReviewForProject(params.projectId, p.giteaUrl, { forceFresh: true });
		return { success: true, source: res.source };
	}
};
