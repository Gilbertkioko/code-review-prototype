import { notifyAdminDashboard } from '$lib/server/review-live';
import { setProjectAdminSidebarHidden } from '$lib/server/review-workspace';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
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
