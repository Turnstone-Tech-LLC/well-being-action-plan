/**
 * Supabase Browser Client
 *
 * This client is used for client-side authentication and operations.
 * It handles provider authentication for the provider portal.
 *
 * Note: If Supabase credentials are not configured, this will use placeholder
 * values to allow the build to succeed. The provider portal will not function
 * without proper credentials, but patient-facing features will work fine.
 */

import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseUrl, getSupabaseAnonKey } from './config';

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
