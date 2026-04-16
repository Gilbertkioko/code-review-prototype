import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Review collaboration lives on `/`; keep this URL for old bookmarks. */
export const load: PageServerLoad = () => {
	throw redirect(301, '/');
};
