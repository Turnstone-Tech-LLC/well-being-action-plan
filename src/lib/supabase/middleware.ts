/**
 * Supabase Middleware Client
 *
 * This client is used in Next.js middleware to refresh sessions
 * and protect routes from unauthorized access.
 *
 * Note: If Supabase credentials are not configured, this will use placeholder
 * values to allow the build to succeed. The provider portal will not function
 * without proper credentials, but patient-facing features will work fine.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseUrl, getSupabaseAnonKey } from './config';

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

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

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect provider routes
  if (
    request.nextUrl.pathname.startsWith('/provider') &&
    !request.nextUrl.pathname.startsWith('/provider/auth')
  ) {
    if (!user) {
      // Redirect to login if not authenticated
      const url = request.nextUrl.clone();
      url.pathname = '/provider/auth/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect to dashboard if already authenticated and trying to access auth pages
  if (request.nextUrl.pathname.startsWith('/provider/auth') && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/provider';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
