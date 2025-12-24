import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthErrorMessage, isExpiredTokenError } from '$lib/auth';
import { getAuthRedirect, clearAuthRedirect } from '$lib/guards/cookies.server';

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

	// Handle errors from Supabase
	if (error) {
		console.error('Auth callback error:', error, errorDescription);

		// Redirect to auth page with error
		const errorMessage = getAuthErrorMessage(error, errorDescription);
		redirect(303, `/auth?error=${encodeURIComponent(errorMessage)}`);
	}

	// If no code, redirect to auth page
	if (!code) {
		redirect(303, '/auth?error=Invalid%20link');
	}

	// Exchange code for session
	const { error: exchangeError } = await locals.supabase.auth.exchangeCodeForSession(code);

	if (exchangeError) {
		console.error('Code exchange error:', exchangeError.message);

		// Handle expired links
		if (isExpiredTokenError(exchangeError.message, exchangeError.code)) {
			redirect(303, '/auth?error=Link%20expired.%20Please%20request%20a%20new%20one.');
		}

		redirect(303, '/auth?error=Unable%20to%20sign%20in.%20Please%20try%20again.');
	}

	// Successfully authenticated - check for saved redirect URL
	const savedRedirect = getAuthRedirect(cookies);
	clearAuthRedirect(cookies);

	// Validate redirect is internal (starts with /) to prevent open redirect
	const safeRedirect = savedRedirect?.startsWith('/') ? savedRedirect : '/provider';

	redirect(303, safeRedirect);
};
