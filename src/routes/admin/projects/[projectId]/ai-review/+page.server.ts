import { getProjectAiReviewOrJob, retryLatestAiReviewJobForProject } from '$lib/server/ai-review';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const aiReview = await getProjectAiReviewOrJob(params.projectId);
	return { aiReview };
};

export const actions: Actions = {
	retryAiReview: async ({ locals, params }) => {
		const admin = locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);
		const res = await retryLatestAiReviewJobForProject(params.projectId);
		if (!res.ok) return fail(400, { message: res.error });
		return { success: true };
	}
};
