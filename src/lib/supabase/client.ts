/**
 * Supabase Browser Client
 *
 * This client is used for client-side authentication and operations.
 * It handles provider authentication for the provider portal.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
