import { listAdminSidebarProjects } from '$lib/server/review-workspace';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export type AdminProjectSection =
	| 'overview'
	| 'testing'
	| 'code-review'
	| 'ai-review'
	| 'standup'
	| 'feedback'
	| null;

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}
	const sidebarProjects = await listAdminSidebarProjects();
	const path = url.pathname.replace(/\/$/, '') || '/';
	const adminIsDashboard = path === '/admin';
	const adminUsersActive = path === '/admin/users';
	const adminSettingsActive = path === '/admin/settings';
	const m = path.match(/^\/admin\/projects\/([^/]+)(?:\/([^/]+))?$/);
	const adminProjectRouteId = m?.[1] ?? null;
	const rawSec = m?.[2] ?? null;
	const validSecs = ['testing', 'code-review', 'ai-review', 'standup', 'feedback'] as const;
	type AuditTab = (typeof validSecs)[number];
	let sectionTab: AuditTab | null = null;
	if (rawSec && (validSecs as readonly string[]).includes(rawSec)) {
		sectionTab = rawSec as AuditTab;
	}
	const adminProjectSection: AdminProjectSection = !adminProjectRouteId
		? null
		: sectionTab ?? 'overview';
	return {
		sidebarProjects,
		adminIsDashboard,
		adminUsersActive,
		adminSettingsActive,
		adminProjectRouteId,
		adminProjectSection
	};
};
