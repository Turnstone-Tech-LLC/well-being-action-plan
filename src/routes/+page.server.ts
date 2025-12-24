import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasPlanCookie } from '$lib/guards/cookies.server';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	// Priority 1: Authenticated provider -> provider dashboard
	if (locals.session && locals.user) {
		redirect(303, '/provider');
	}

	// Priority 2: Has plan cookie (patient with local data) -> patient app
	// Client-side in +page.svelte provides fallback verification
	if (hasPlanCookie(cookies)) {
		redirect(303, '/app');
	}

	// Otherwise show the landing page
	return {};
};
