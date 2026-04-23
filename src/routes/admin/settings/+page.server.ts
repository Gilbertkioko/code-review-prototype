import { notifyAdminDashboard } from '$lib/server/review-live';
import { listAdminHiddenSidebarProjects, setProjectAdminSidebarHidden } from '$lib/server/review-workspace';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const hiddenProjects = await listAdminHiddenSidebarProjects();
	return { hiddenProjects };
};

export const actions: Actions = {
	restoreProjectSidebar: async (event) => {
		const admin = event.locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);
		const fd = await event.request.formData();
		const projectId = fd.get('projectId');
		if (typeof projectId !== 'string') return fail(400, { message: 'Missing project' });
		await setProjectAdminSidebarHidden(projectId, false);
		notifyAdminDashboard();
		return { success: true };
	}
};
