import { browser } from '$app/environment';
import { createSupabaseBrowserClient } from '$lib/supabase';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ depends }) => {
	// Mark this as dependent on supabase:auth for proper invalidation
	depends('supabase:auth');

	// Create browser client for client-side auth state listening
	const supabase = browser ? createSupabaseBrowserClient() : null;

	return {
		supabase
	};
};
