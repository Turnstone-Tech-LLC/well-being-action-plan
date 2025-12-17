import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';

/**
 * Browser-side Supabase client.
 * Uses public environment variables for client-side access.
 */
export function createSupabaseBrowserClient() {
	const url = env.PUBLIC_SUPABASE_URL;
	const key = env.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !key) {
		console.warn('Public Supabase environment variables not configured.');
		// Return a client that will fail gracefully
		return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');
	}

	return createBrowserClient(url, key);
}
