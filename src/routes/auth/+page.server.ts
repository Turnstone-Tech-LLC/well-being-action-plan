import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isValidEmail, isRateLimitError } from '$lib/auth';
import { setAuthRedirect } from '$lib/guards/cookies.server';

export const load: PageServerLoad = async ({ locals, url }) => {
	// If already logged in, redirect to saved destination or provider dashboard
	if (locals.session) {
		const redirectTo = url.searchParams.get('redirect');
		// Validate redirect is internal to prevent open redirect
		// Must start with / but NOT // (protocol-relative URLs like //evil.com)
		const isValidRedirect =
			redirectTo !== null && redirectTo.startsWith('/') && !redirectTo.startsWith('//');
		const safeRedirect = isValidRedirect ? redirectTo : '/provider';
		redirect(303, safeRedirect);
	}

	// Get error and redirect from query params
	const error = url.searchParams.get('error');
	const redirectParam = url.searchParams.get('redirect');

	return {
		error,
		redirect: redirectParam
	};
};

export const actions: Actions = {
	default: async ({ request, locals, url, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		// Get redirect parameter from URL or form
		const redirectTo = url.searchParams.get('redirect');

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

		// Store redirect URL in cookie for after magic link callback
		if (redirectTo?.startsWith('/')) {
			setAuthRedirect(cookies, redirectTo);
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
