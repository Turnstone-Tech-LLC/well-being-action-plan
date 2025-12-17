import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Redirect legacy login URL to new auth page
export const load: PageServerLoad = async () => {
	redirect(301, '/auth');
};
