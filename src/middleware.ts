/**
 * Next.js Middleware
 *
 * Handles authentication and session management for protected routes.
 *
 * ## Dual Authentication System
 *
 * This middleware implements two separate authentication mechanisms:
 *
 * ### 1. Provider Authentication (Server-Side)
 * - Routes: /provider/* (except /provider/auth/*)
 * - Method: Supabase Auth with session cookies
 * - Handled in: src/lib/supabase/middleware.ts
 * - Behavior: Redirects to /provider/auth/login if not authenticated
 *
 * ### 2. Patient Authentication (Client-Side)
 * - Routes: /dashboard, /check-in/*, /history, /settings
 * - Method: IndexedDB validation via usePatientAuth hook
 * - Handled in: src/hooks/usePatientAuth.ts
 * - Behavior: Redirects to /onboarding if not completed
 *
 * ## Why Two Systems?
 *
 * - **Provider routes**: Need server-side auth for API access and data management
 * - **Patient routes**: Must remain local-only for privacy (no server-side auth)
 *
 * Patient data NEVER leaves the device - all validation is done in the browser
 * using IndexedDB, which is not accessible in edge middleware.
 *
 * @see src/lib/supabase/middleware.ts for provider auth implementation
 * @see src/hooks/usePatientAuth.ts for patient auth implementation
 */

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Middleware function that runs on every request
 *
 * Currently only handles provider authentication. Patient authentication
 * is handled client-side in individual page components.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Middleware configuration
 *
 * Matches all routes except:
 * - Static files (_next/static, _next/image)
 * - Public assets (favicon, images, etc.)
 * - API routes (handled separately)
 *
 * This ensures the middleware runs for all page requests where
 * authentication might be needed.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (images, icons, manifest, etc.)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
