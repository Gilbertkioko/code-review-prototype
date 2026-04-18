import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		sessionUser: locals.user
			? {
					id: locals.user.id,
					username: locals.user.username,
					email: locals.user.email,
					role: locals.user.role
				}
			: null
	};
};
