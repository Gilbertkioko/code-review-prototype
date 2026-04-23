import { listAdminSidebarProjects } from '$lib/server/review-workspace';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}
	const sidebarProjects = await listAdminSidebarProjects();
	const adminIsDashboard = url.pathname === '/admin' || url.pathname === '/admin/';
	const m = url.pathname.match(/^\/admin\/projects\/([^/]+)/);
	const adminProjectRouteId = m?.[1] ?? null;
	return { sidebarProjects, adminIsDashboard, adminProjectRouteId };
};
