/**
 * Route guard utilities for patient and provider authentication.
 *
 * Client-side:
 *   import { hasPlanCookie, setPlanCookie, clearPlanCookie } from '$lib/guards/cookies';
 *
 * Server-side:
 *   import { patientGuard } from '$lib/guards/patientGuard.server';
 *   import { providerGuard } from '$lib/guards/providerGuard.server';
 *   import { hasPlanCookie, ... } from '$lib/guards/cookies.server';
 */

// Re-export for convenience (though direct imports are preferred for tree-shaking)
export {
	PLAN_COOKIE_NAME,
	PLAN_COOKIE_VALUE,
	hasPlanCookie,
	setPlanCookie,
	clearPlanCookie
} from './cookies';
