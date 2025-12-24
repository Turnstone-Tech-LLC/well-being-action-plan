/**
 * Server-side guard for provider routes (/provider/*).
 * Checks for authenticated session and redirects appropriately:
 * - If authenticated: proceed
 * - If has plan cookie (patient): redirect to /app
 * - Otherwise: redirect to /auth with redirect param
 */

import { redirect, type Cookies } from '@sveltejs/kit';
import type { Session, User } from '@supabase/supabase-js';
import { hasPlanCookie, setAuthRedirect } from './cookies.server';

interface ProviderGuardOptions {
	session: Session | null;
	user: User | null;
	url: URL;
	cookies: Cookies;
}

/**
 * Guard for provider routes. Handles three cases:
 * 1. Authenticated provider -> proceed (no redirect)
 * 2. Patient with local plan -> redirect to /app
 * 3. Unauthenticated -> save redirect URL, redirect to /auth
 *
 * Usage in +layout.server.ts:
 *   providerGuard({ session: locals.session, user: locals.user, url, cookies });
 */
export function providerGuard({ session, user, url, cookies }: ProviderGuardOptions): void {
	// Authenticated provider - proceed
	if (session && user) {
		return;
	}

	// Patient with local plan - redirect to their dashboard
	if (hasPlanCookie(cookies)) {
		redirect(303, '/app');
	}

	// Unauthenticated - save intended destination and redirect to auth
	const redirectPath = url.pathname + url.search;
	setAuthRedirect(cookies, redirectPath);
	redirect(303, '/auth');
}
