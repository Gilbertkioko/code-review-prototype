import { notifyAdminDashboard } from '$lib/server/review-live';
import {
	adminDeleteUser,
	adminSetUserRole,
	listUsersForAdmin
} from '$lib/server/review-workspace';
import { isSignUpRole } from '$lib/userRole';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const users = await listUsersForAdmin();
	return { users };
};

export const actions: Actions = {
	updateUserRole: async (event) => {
		const admin = event.locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);
		const fd = await event.request.formData();
		const userId = fd.get('userId');
		const role = fd.get('role');
		if (typeof userId !== 'string' || typeof role !== 'string' || !isSignUpRole(role)) {
			return fail(400, { message: 'Invalid role or user' });
		}
		const res = await adminSetUserRole(userId, role);
		if (!res.ok) return fail(400, { message: res.error });
		notifyAdminDashboard();
		return { success: true };
	},
	deleteUser: async (event) => {
		const admin = event.locals.user;
		if (!admin || admin.role !== 'admin') return fail(403);
		const fd = await event.request.formData();
		const userId = fd.get('userId');
		if (typeof userId !== 'string') return fail(400, { message: 'Missing user' });
		const res = await adminDeleteUser(userId, admin.id);
		if (!res.ok) return fail(400, { message: res.error });
		notifyAdminDashboard();
		return { success: true };
	}
};
