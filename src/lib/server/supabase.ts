import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

/**
 * Server-side Supabase client.
 * Uses environment variables for configuration.
 */
function createSupabaseClient() {
	const url = env.SUPABASE_URL;
	const key = env.SUPABASE_ANON_KEY;

	if (!url || !key) {
		console.warn('Supabase environment variables not configured. API calls will fail.');
		// Return a client that will fail gracefully
		return createClient('https://placeholder.supabase.co', 'placeholder-key');
	}

	return createClient(url, key);
}

export const supabase = createSupabaseClient();
