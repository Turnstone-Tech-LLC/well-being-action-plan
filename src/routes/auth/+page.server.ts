import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isValidEmail, isRateLimitError } from '$lib/auth';

export const load: PageServerLoad = async ({ locals, url }) => {
	// If already logged in, redirect to dashboard
	if (locals.session) {
		redirect(303, '/provider');
	}

	// Get error from query params (from callback redirect)
	const error = url.searchParams.get('error');

	return {
		error
	};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return fail(400, {
				error: 'Email is required',
				email: ''
			});
		}

		// Validate email format
		if (!isValidEmail(email)) {
			return fail(400, {
				error: 'Please enter a valid email address',
				email
			});
		}

		// Check if provider exists for this email (silently skip if not)
		const { data: providerExists } = await locals.supabase.rpc('provider_exists_for_email', {
			check_email: email
		});

		// If no provider profile exists, still redirect to verify page
		// but don't actually send the email (prevents enumeration)
		if (!providerExists) {
			redirect(303, `/auth/verify?email=${encodeURIComponent(email)}`);
		}

		// Send magic link (only if provider exists)
		const { error } = await locals.supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			// Handle rate limiting
			if (isRateLimitError(error.message, error.status)) {
				return fail(429, {
					error: 'Too many requests. Please wait a moment before trying again.',
					email
				});
			}

			// Generic error - don't expose details to prevent enumeration
			console.error('Auth error:', error.message);
			return fail(500, {
				error: 'Unable to send magic link. Please try again.',
				email
			});
		}

		// Redirect to verify page (always, to prevent email enumeration)
		redirect(303, `/auth/verify?email=${encodeURIComponent(email)}`);
	}
};
