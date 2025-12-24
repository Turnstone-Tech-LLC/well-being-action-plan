/**
 * Server-side cookie helpers for plan presence detection.
 * Used for fast server-side routing decisions.
 */

import type { Cookies } from '@sveltejs/kit';

export const PLAN_COOKIE_NAME = 'wbap_has_plan';
export const PLAN_COOKIE_VALUE = 'true';

// 10 years in seconds - long-lived since cookie contains no sensitive data
const PLAN_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

/**
 * Check if the plan cookie exists.
 */
export function hasPlanCookie(cookies: Cookies): boolean {
	return cookies.get(PLAN_COOKIE_NAME) === PLAN_COOKIE_VALUE;
}

/**
 * Set the plan cookie to indicate local plan exists.
 */
export function setPlanCookie(cookies: Cookies): void {
	cookies.set(PLAN_COOKIE_NAME, PLAN_COOKIE_VALUE, {
		path: '/',
		httpOnly: false, // Must be accessible to client JS for sync
		secure: !import.meta.env.DEV,
		sameSite: 'lax',
		maxAge: PLAN_COOKIE_MAX_AGE
	});
}

/**
 * Clear the plan cookie.
 */
export function clearPlanCookie(cookies: Cookies): void {
	cookies.delete(PLAN_COOKIE_NAME, { path: '/' });
}

// Auth redirect cookie for preserving redirect URL across magic link flow
export const AUTH_REDIRECT_COOKIE_NAME = 'wbap_auth_redirect';
const AUTH_REDIRECT_COOKIE_MAX_AGE = 60 * 60; // 1 hour

/**
 * Get the saved auth redirect URL.
 */
export function getAuthRedirect(cookies: Cookies): string | null {
	return cookies.get(AUTH_REDIRECT_COOKIE_NAME) ?? null;
}

/**
 * Save a redirect URL for after authentication.
 */
export function setAuthRedirect(cookies: Cookies, redirectUrl: string): void {
	cookies.set(AUTH_REDIRECT_COOKIE_NAME, redirectUrl, {
		path: '/',
		httpOnly: true,
		secure: !import.meta.env.DEV,
		sameSite: 'lax',
		maxAge: AUTH_REDIRECT_COOKIE_MAX_AGE
	});
}

/**
 * Clear the auth redirect cookie.
 */
export function clearAuthRedirect(cookies: Cookies): void {
	cookies.delete(AUTH_REDIRECT_COOKIE_NAME, { path: '/' });
}
