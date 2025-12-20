import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If authenticated provider, redirect to provider dashboard
	if (locals.session && locals.user) {
		redirect(303, '/provider');
	}

	// Otherwise show the landing page
	// Note: Patient redirect (IndexedDB check) happens client-side in +page.svelte
	return {};
};
