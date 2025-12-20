import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

/**
 * Get Supabase URL and anon key from environment variables.
 * Logs a warning if not configured.
 */
function getSupabaseConfig() {
	const url = env.SUPABASE_URL;
	const key = env.SUPABASE_ANON_KEY;

	if (!url || !key) {
		console.warn('Supabase environment variables not configured. Auth will not work.');
		return {
			url: 'https://placeholder.supabase.co',
			key: 'placeholder-key',
			configured: false
		};
	}

	return { url, key, configured: true };
}

/**
 * Create a Supabase client for server-side use with cookie-based session handling.
 * This client properly handles auth state through cookies for SSR.
 */
export function createSupabaseServerClient(cookies: Cookies) {
	const config = getSupabaseConfig();

	return createServerClient(config.url, config.key, {
		cookies: {
			getAll() {
				return cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					cookies.set(name, value, {
						...options,
						path: '/'
					});
				});
			}
		}
	});
}

/**
 * Simple Supabase client for non-auth operations.
 * Use createSupabaseServerClient for auth-related operations.
 */
function createSimpleSupabaseClient() {
	const config = getSupabaseConfig();
	return createClient(config.url, config.key);
}

export const supabase = createSimpleSupabaseClient();

/**
 * Create a Supabase Admin client with service role key.
 * This bypasses RLS and should only be used for admin operations.
 */
export function createSupabaseAdminClient() {
	const url = env.SUPABASE_URL;
	const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !serviceKey) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
	}

	return createClient(url, serviceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}
