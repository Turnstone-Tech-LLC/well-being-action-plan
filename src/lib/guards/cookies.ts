/**
 * Client-side cookie helpers for plan presence detection.
 * Used for self-healing and cookie synchronization with IndexedDB.
 */

export const PLAN_COOKIE_NAME = 'wbap_has_plan';
export const PLAN_COOKIE_VALUE = 'true';

// 10 years in seconds - long-lived since cookie contains no sensitive data
const PLAN_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

/**
 * Check if the plan cookie exists.
 * Returns false in SSR context.
 */
export function hasPlanCookie(): boolean {
	if (typeof document === 'undefined') return false;
	return document.cookie.includes(`${PLAN_COOKIE_NAME}=${PLAN_COOKIE_VALUE}`);
}

/**
 * Set the plan cookie to indicate local plan exists.
 * No-op in SSR context.
 */
export function setPlanCookie(): void {
	if (typeof document === 'undefined') return;

	const secure = typeof location !== 'undefined' && location.protocol === 'https:';
	const parts = [
		`${PLAN_COOKIE_NAME}=${PLAN_COOKIE_VALUE}`,
		'path=/',
		`max-age=${PLAN_COOKIE_MAX_AGE}`,
		'samesite=lax'
	];

	if (secure) {
		parts.push('secure');
	}

	document.cookie = parts.join('; ');
}

/**
 * Clear the plan cookie.
 * No-op in SSR context.
 */
export function clearPlanCookie(): void {
	if (typeof document === 'undefined') return;
	document.cookie = `${PLAN_COOKIE_NAME}=; path=/; max-age=0`;
}
