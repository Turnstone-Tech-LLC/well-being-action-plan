/**
 * Supabase Server Client
 *
 * This client is used for server-side authentication and operations.
 * It handles cookies and session management for SSR.
 *
 * Note: If Supabase credentials are not configured, this will use placeholder
 * values to allow the build to succeed. The provider portal will not function
 * without proper credentials, but patient-facing features will work fine.
 */

'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseUrl, getSupabaseAnonKey } from './config';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
