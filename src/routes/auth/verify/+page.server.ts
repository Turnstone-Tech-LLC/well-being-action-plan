import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	// If already logged in, redirect to dashboard
	if (locals.session) {
		redirect(303, '/provider');
	}

	const email = url.searchParams.get('email') ?? '';

	return {
		email
	};
};
