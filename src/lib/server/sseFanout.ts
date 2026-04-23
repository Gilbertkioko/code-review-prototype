import { getPairForProject, getProjectById } from '$lib/server/review-workspace';
import { ssePublishUser } from '$lib/server/sseHub';

/** Mirror project-room `review:invalidate` to per-user SSE channels (layout only has user-scoped subscriptions). */
export async function sseFanoutReviewToProjectWatchers(projectId: string) {
	const p = await getProjectById(projectId);
	if (!p) return;
	const pair = await getPairForProject(projectId);
	const ids = new Set<string>([p.submitterId]);
	if (pair) {
		ids.add(pair.reviewerAId);
		ids.add(pair.reviewerBId);
	}
	for (const id of ids) {
		ssePublishUser(id, 'review', { projectId });
	}
}
