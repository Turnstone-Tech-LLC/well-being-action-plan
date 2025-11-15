/**
 * Unified Authentication Utilities
 *
 * Centralized authentication logic for both provider (Supabase) and
 * patient (IndexedDB) authentication flows.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

/**
 * Authentication modes
 */
export enum AuthMode {
  Provider = 'provider',
  Patient = 'patient',
  Public = 'public',
}

/**
 * Auth status result
 */
export interface AuthStatus {
  authenticated: boolean;
  mode: AuthMode;
  userId?: string;
  user?: User;
  redirectTo?: string;
  error?: string;
}

/**
 * Route authentication configuration
 */
export interface RouteAuthConfig {
  mode: AuthMode;
  redirectTo?: string;
  allowPartial?: boolean; // Allow partially completed onboarding
}

/**
 * Route configurations for authentication
 */
export const ROUTE_AUTH_CONFIG: Record<string, RouteAuthConfig> = {
  // Provider routes
  '/provider': { mode: AuthMode.Provider, redirectTo: '/provider/auth/login' },
  '/provider/dashboard': { mode: AuthMode.Provider, redirectTo: '/provider/auth/login' },
  '/provider/links': { mode: AuthMode.Provider, redirectTo: '/provider/auth/login' },
  '/provider/profile': { mode: AuthMode.Provider, redirectTo: '/provider/auth/login' },
  '/provider/settings': { mode: AuthMode.Provider, redirectTo: '/provider/auth/login' },

  // Patient routes
  '/dashboard': { mode: AuthMode.Patient, redirectTo: '/onboarding' },
  '/check-in': { mode: AuthMode.Patient, redirectTo: '/onboarding' },
  '/check-in/green': { mode: AuthMode.Patient, redirectTo: '/onboarding' },
  '/check-in/yellow': { mode: AuthMode.Patient, redirectTo: '/onboarding' },
  '/check-in/red': { mode: AuthMode.Patient, redirectTo: '/onboarding' },
  '/history': { mode: AuthMode.Patient, redirectTo: '/onboarding' },
  '/settings': { mode: AuthMode.Patient, redirectTo: '/onboarding' },

  // Public routes
  '/': { mode: AuthMode.Public },
  '/onboarding': { mode: AuthMode.Public },
  '/onboarding/step-1': { mode: AuthMode.Public },
  '/onboarding/step-2': { mode: AuthMode.Public },
  '/onboarding/step-3': { mode: AuthMode.Public },
  '/provider/auth/login': { mode: AuthMode.Public },
  '/provider/auth/signup': { mode: AuthMode.Public },
  '/provider/auth/callback': { mode: AuthMode.Public },
};

/**
 * Check provider authentication status
 */
export async function checkProviderAuth(request?: NextRequest): Promise<AuthStatus> {
  try {
    // Server-side check
    if (request) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return {
          authenticated: false,
          mode: AuthMode.Provider,
          redirectTo: '/provider/auth/login',
          error: error?.message,
        };
      }

      return {
        authenticated: true,
        mode: AuthMode.Provider,
        userId: user.id,
        user,
      };
    }

    // Client-side check
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authenticated: false,
        mode: AuthMode.Provider,
        redirectTo: '/provider/auth/login',
        error: error?.message,
      };
    }

    return {
      authenticated: true,
      mode: AuthMode.Provider,
      userId: user.id,
      user,
    };
  } catch (error) {
    return {
      authenticated: false,
      mode: AuthMode.Provider,
      redirectTo: '/provider/auth/login',
      error: (error as Error).message,
    };
  }
}

/**
 * Check patient authentication status (onboarding completion)
 */
export async function checkPatientAuth(): Promise<AuthStatus> {
  if (typeof window === 'undefined') {
    // Can't check IndexedDB server-side
    return {
      authenticated: false,
      mode: AuthMode.Patient,
      error: 'Server-side check not supported',
    };
  }

  try {
    const { getUserIdentity } = await import('@/lib/services/userIdentityService');
    const { checkPatientOnboarding } = await import('@/lib/utils/patientAuth');

    const { userId } = await getUserIdentity();
    const onboardingStatus = await checkPatientOnboarding(userId);

    if (!onboardingStatus.isComplete) {
      return {
        authenticated: false,
        mode: AuthMode.Patient,
        redirectTo: '/onboarding',
        error: onboardingStatus.missingSteps?.join(', '),
      };
    }

    return {
      authenticated: true,
      mode: AuthMode.Patient,
      userId,
    };
  } catch (error) {
    return {
      authenticated: false,
      mode: AuthMode.Patient,
      redirectTo: '/onboarding',
      error: (error as Error).message,
    };
  }
}

/**
 * Get authentication requirements for a route
 */
export function getRouteAuthRequirements(pathname: string): RouteAuthConfig {
  // Find exact match first
  if (ROUTE_AUTH_CONFIG[pathname]) {
    return ROUTE_AUTH_CONFIG[pathname];
  }

  // Check for pattern matches
  for (const [pattern, config] of Object.entries(ROUTE_AUTH_CONFIG)) {
    if (pathname.startsWith(pattern.replace(/\*$/, ''))) {
      return config;
    }
  }

  // Default to public
  return { mode: AuthMode.Public };
}

/**
 * Check if a route requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  const config = getRouteAuthRequirements(pathname);
  return config.mode !== AuthMode.Public;
}

/**
 * Check if user has access to a route
 */
export async function checkRouteAccess(
  pathname: string,
  request?: NextRequest
): Promise<{ allowed: boolean; redirectTo?: string }> {
  const config = getRouteAuthRequirements(pathname);

  if (config.mode === AuthMode.Public) {
    return { allowed: true };
  }

  if (config.mode === AuthMode.Provider) {
    const status = await checkProviderAuth(request);
    return {
      allowed: status.authenticated,
      redirectTo: status.authenticated ? undefined : config.redirectTo,
    };
  }

  if (config.mode === AuthMode.Patient) {
    const status = await checkPatientAuth();
    return {
      allowed: status.authenticated,
      redirectTo: status.authenticated ? undefined : config.redirectTo,
    };
  }

  return { allowed: false, redirectTo: '/' };
}

/**
 * Provider authentication guard for API routes
 */
export async function requireProviderAuth(
  request: NextRequest
): Promise<{ user: User } | NextResponse> {
  const status = await checkProviderAuth(request);

  if (!status.authenticated || !status.user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Provider authentication required' },
      { status: 401 }
    );
  }

  return { user: status.user };
}

/**
 * Create redirect response
 */
export function createAuthRedirect(
  request: NextRequest,
  redirectTo: string,
  preserveQuery = true
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = redirectTo;

  if (preserveQuery && request.nextUrl.pathname !== '/') {
    url.searchParams.set('from', request.nextUrl.pathname);
  }

  return NextResponse.redirect(url);
}

/**
 * Sign out utilities
 */
export async function signOutProvider(): Promise<void> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function signOutPatient(): Promise<void> {
  const { clearUserIdentity } = await import('@/lib/services/userIdentityService');
  clearUserIdentity();

  // Clear any cached onboarding state
  if (typeof window !== 'undefined') {
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('providerConfig');
    localStorage.removeItem('providerLinkId');
    sessionStorage.clear();
  }
}

/**
 * Combined sign out for complete reset
 */
export async function signOutCompletely(): Promise<void> {
  await Promise.all([
    signOutProvider().catch(console.error),
    signOutPatient().catch(console.error),
  ]);
}
