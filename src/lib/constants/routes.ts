/**
 * Route Constants
 *
 * Centralized definitions of all application routes for consistent
 * route protection and navigation logic.
 *
 * @module routes
 */

/**
 * Patient-only routes that require onboarding completion
 * and cannot be accessed when in provider mode
 */
export const PATIENT_ROUTES = [
  '/dashboard',
  '/check-in',
  '/history',
  '/settings',
  '/onboarding',
] as const;

/**
 * Provider-only routes that require Supabase authentication
 * and cannot be accessed by patients
 */
export const PROVIDER_ROUTES = [
  '/provider/dashboard',
  '/provider/link-generator',
  '/provider/links',
  '/provider/strategies',
  '/provider/profile',
  '/provider/settings',
] as const;

/**
 * Provider authentication routes (public access for login/signup)
 */
export const PROVIDER_AUTH_ROUTES = [
  '/provider/auth/login',
  '/provider/auth/signup',
  '/provider/auth/reset-password',
  '/provider/auth/callback',
] as const;

/**
 * Public routes accessible to everyone
 */
export const PUBLIC_ROUTES = ['/', '/link'] as const;

/**
 * Checks if a given pathname is a patient route
 *
 * @param pathname - The pathname to check
 * @returns true if the pathname is a patient route
 */
export function isPatientRoute(pathname: string): boolean {
  return PATIENT_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Checks if a given pathname is a provider route (excluding auth routes)
 *
 * @param pathname - The pathname to check
 * @returns true if the pathname is a protected provider route
 */
export function isProviderRoute(pathname: string): boolean {
  return PROVIDER_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Checks if a given pathname is a provider auth route
 *
 * @param pathname - The pathname to check
 * @returns true if the pathname is a provider auth route
 */
export function isProviderAuthRoute(pathname: string): boolean {
  return PROVIDER_AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Checks if a given pathname is a public route
 *
 * @param pathname - The pathname to check
 * @returns true if the pathname is a public route
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Checks if a given pathname requires any authentication or protection
 *
 * @param pathname - The pathname to check
 * @returns true if the pathname is protected
 */
export function isProtectedRoute(pathname: string): boolean {
  return isPatientRoute(pathname) || isProviderRoute(pathname);
}
