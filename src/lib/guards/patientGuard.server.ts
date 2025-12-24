/**
 * Server-side guard for patient routes (/app/*).
 * Checks for plan cookie and redirects to landing if not present.
 */

import { redirect, type Cookies } from '@sveltejs/kit';
import { hasPlanCookie } from './cookies.server';

interface PatientGuardOptions {
	cookies: Cookies;
}

/**
 * Guard for patient routes. Redirects to landing page if no plan cookie.
 *
 * Usage in +layout.server.ts:
 *   patientGuard({ cookies });
 *
 * Note: Client-side verification in +layout.svelte handles stale cookies
 * (cookie exists but IndexedDB is empty) by clearing the cookie and redirecting.
 */
export function patientGuard({ cookies }: PatientGuardOptions): void {
	if (!hasPlanCookie(cookies)) {
		redirect(303, '/');
	}
}
