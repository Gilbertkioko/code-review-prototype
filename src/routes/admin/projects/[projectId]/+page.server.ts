import {
	notifyAdminDashboard,
	notifyProjectReviewUpdate,
	notifyReviewerReassigned,
	recomputeAndPersistSubmissionProgress
} from '$lib/server/review-live';
import {
	assignReviewPair,
	adminResetReviewCycle,
	adminReassignReviewerSlot,
	getPairForProject,
	listUsersForAdmin,
	setProjectAdminSidebarHidden,
	userPublicRow
} from '$lib/server/review-workspace';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const data = await parent();
	const users = await listUsersForAdmin();
	const reviewers = users.filter((u) => u.role === 'reviewer');
	return { ...data, reviewers };
};

export const actions: Actions = {
	assignPair: async (event) => {
		const admin = event.locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		const reviewerAId = fd.get('reviewerAId');
		const reviewerBId = fd.get('reviewerBId');
		if (
			typeof projectId !== 'string' ||
			typeof reviewerAId !== 'string' ||
			typeof reviewerBId !== 'string'
		) {
			return fail(400, { message: 'Missing fields' });
		}

		const res = await assignReviewPair({
			projectId,
			reviewerAId,
			reviewerBId,
			adminId: admin.id
		});
		if (!res.ok) return fail(400, { message: res.error });

		notifyProjectReviewUpdate(projectId);
		notifyAdminDashboard();
		return { success: true, message: 'Pair created and review activated.' };
	},
	resetReviewCycle: async (event) => {
		const admin = event.locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		if (typeof projectId !== 'string') return fail(400, { message: 'Missing projectId' });

		const res = await adminResetReviewCycle(projectId);
		if (!res.ok) return fail(400, { message: res.error });

		await recomputeAndPersistSubmissionProgress(projectId);

		notifyProjectReviewUpdate(projectId);
		notifyAdminDashboard();

		return { success: true, message: 'Project reset — start testing again and accept your assignments.' };
	},
	reassignReviewer: async (event) => {
		const admin = event.locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		const slot = fd.get('slot');
		const newReviewerId = fd.get('newReviewerId');
		if (
			typeof projectId !== 'string' ||
			(slot !== 'A' && slot !== 'B') ||
			typeof newReviewerId !== 'string'
		) {
			return fail(400, { message: 'Invalid reassignment request' });
		}

		const oldPair = await getPairForProject(projectId);
		const oldReviewerId =
			oldPair == null ? null : slot === 'A' ? oldPair.reviewerAId : oldPair.reviewerBId;

		const res = await adminReassignReviewerSlot({ projectId, slot, newReviewerId });
		if (!res.ok) return fail(400, { message: res.error });

		const [oldReviewer, newReviewer] = await Promise.all([
			oldReviewerId ? userPublicRow(oldReviewerId) : Promise.resolve(null),
			userPublicRow(newReviewerId)
		]);
		if (oldReviewerId && oldReviewerId !== newReviewerId) {
			notifyReviewerReassigned({
				reviewerUserId: oldReviewerId,
				projectId,
				reason: `You were replaced on this review project by admin (${slot === 'A' ? 'slot A' : 'slot B'}).`
			});
		}

		notifyProjectReviewUpdate(projectId);
		notifyAdminDashboard();
		return {
			success: true,
			message: `${slot === 'A' ? 'Slot A' : 'Slot B'} reassigned: ${oldReviewer?.username ?? 'previous reviewer'} -> ${newReviewer?.username ?? 'new reviewer'}.`
		};
	},
	toggleSidebarHidden: async (event) => {
		const admin = event.locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		const hiddenRaw = fd.get('hidden');
		if (typeof projectId !== 'string') return fail(400, { message: 'Missing project' });
		const hidden = hiddenRaw === '1' || hiddenRaw === 'true';
		await setProjectAdminSidebarHidden(projectId, hidden);
		notifyAdminDashboard();
		return { success: true };
	}
};
