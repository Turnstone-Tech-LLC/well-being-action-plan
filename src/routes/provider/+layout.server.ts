import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Require authentication for all /provider/* routes
	if (!locals.session || !locals.user) {
		redirect(303, '/auth');
	}

	// Return user info for use in provider pages
	return {
		user: {
			id: locals.user.id,
			email: locals.user.email
		}
	};
};
