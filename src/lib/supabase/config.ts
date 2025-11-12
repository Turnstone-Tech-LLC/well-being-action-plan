/**
 * Supabase Configuration
 *
 * Centralized configuration for Supabase client credentials.
 * Provides fallback placeholder values to allow builds to succeed
 * without Supabase credentials configured (e.g., in CI).
 *
 * The provider portal requires actual credentials to function,
 * but patient-facing features work without Supabase.
 */

/**
 * Get Supabase URL from environment or use placeholder
 */
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
}

/**
 * Get Supabase anonymous key from environment or use placeholder
 */
export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-for-build';
}

/**
 * Check if Supabase is properly configured with real credentials
 * (not placeholder values)
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-anon-key-for-build'
  );
}
