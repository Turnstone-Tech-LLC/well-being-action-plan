/**
 * Supabase Middleware Client
 *
 * This middleware handles authentication for the Well-Being Action Plan app.
 * It implements a dual authentication system:
 *
 * 1. **Provider Routes** (/provider/*):
 *    - Uses Supabase Auth for server-side authentication
 *    - Requires valid session to access provider portal
 *    - Redirects to login if not authenticated
 *    - Handles session refresh automatically
 *
 * 2. **Patient Routes** (all other routes):
 *    - No server-side authentication required
 *    - Patient route protection is handled client-side via usePatientAuth hook
 *    - Validates onboarding completion using local IndexedDB
 *    - Maintains privacy-first architecture (no patient data on server)
 *
 * Note: If Supabase credentials are not configured, this will use placeholder
 * values to allow the build to succeed. The provider portal will not function
 * without proper credentials, but patient-facing features will work fine.
 *
 * @see src/hooks/usePatientAuth.ts for patient route protection
 * @see src/lib/utils/patientAuth.ts for onboarding validation
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseUrl, getSupabaseAnonKey } from './config';

/**
 * Update session and protect provider routes
 *
 * This function runs on every request (via middleware matcher) and:
 * - Refreshes Supabase auth sessions
 * - Protects provider routes from unauthorized access
 * - Handles session expiry gracefully
 * - Redirects authenticated users away from auth pages
 *
 * Patient route protection is NOT handled here - it's done client-side
 * because IndexedDB is not accessible in edge middleware.
 *
 * @param request - Next.js request object
 * @returns NextResponse - Response with updated session cookies
 */
export async function updateSession(request: NextRequest) {
  // Create response that will be returned
  const supabaseResponse = NextResponse.next({
    request,
  });

  // Create Supabase client for server-side auth
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh the auth token and get current user
  // This automatically handles session expiry and token refresh
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Log session errors for debugging (but don't expose to client)
  if (error) {
    console.error('Supabase auth error in middleware:', error.message);
  }

  // ============================================================================
  // Provider Route Protection (Supabase Auth)
  // ============================================================================

  // Protect all /provider/* routes except /provider/auth/*
  const isProviderRoute = request.nextUrl.pathname.startsWith('/provider');
  const isProviderAuthRoute = request.nextUrl.pathname.startsWith('/provider/auth');

  if (isProviderRoute && !isProviderAuthRoute) {
    if (!user) {
      // User is not authenticated - redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/provider/auth/login';
      // Preserve the original URL for redirect after login
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated providers away from auth pages
  if (isProviderAuthRoute && user) {
    const url = request.nextUrl.clone();
    // Check if there's a redirect parameter
    const redirectTo = request.nextUrl.searchParams.get('redirect');
    url.pathname = redirectTo && redirectTo.startsWith('/provider') ? redirectTo : '/provider';
    url.search = ''; // Clear search params
    return NextResponse.redirect(url);
  }

  // ============================================================================
  // Patient Route Protection - Block Authenticated Providers
  // ============================================================================
  // Authenticated providers should not access patient routes
  // This prevents accidental mixing of provider and patient contexts

  const patientRoutes = ['/dashboard', '/check-in', '/history', '/settings', '/onboarding'];
  const isPatientRoute = patientRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  if (user && isPatientRoute) {
    // Authenticated provider trying to access patient route - redirect to provider portal
    const url = request.nextUrl.clone();
    url.pathname = '/provider';
    url.searchParams.set('error', 'provider_cannot_access_patient_routes');
    return NextResponse.redirect(url);
  }

  // ============================================================================
  // Patient Routes - Client-Side Protection
  // ============================================================================
  // Patient routes are also protected client-side using the usePatientAuth hook
  // This maintains the privacy-first architecture where patient data never
  // leaves the device and IndexedDB validation happens in the browser.

  return supabaseResponse;
}
