import { browser } from '$app/environment';
import { invalidateAll, goto } from '$app/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Auth state synchronization for multi-tab support.
 *
 * Listens for auth state changes (sign in/out) and synchronizes
 * across browser tabs. When a user signs in or out in one tab,
 * other tabs will automatically update.
 */

type AuthSyncOptions = {
	/** Called when user signs in (from another tab) */
	onSignIn?: () => void | Promise<void>;
	/** Called when user signs out (from another tab) */
	onSignOut?: () => void | Promise<void>;
};

/**
 * Initialize auth state synchronization.
 * Call this once in the root layout.
 *
 * @param supabase - The Supabase client instance
 * @param options - Optional callbacks for auth events
 * @returns Cleanup function to unsubscribe
 */
export function initAuthSync(supabase: SupabaseClient, options: AuthSyncOptions = {}): () => void {
	if (!browser) {
		return () => {};
	}

	// Track if we initiated the auth change (to avoid double-handling)
	let isLocalChange = false;

	const {
		data: { subscription }
	} = supabase.auth.onAuthStateChange(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		async (event, _session) => {
			// Skip if this was a local change (handled by the component that triggered it)
			if (isLocalChange) {
				isLocalChange = false;
				return;
			}

			switch (event) {
				case 'SIGNED_IN':
				case 'TOKEN_REFRESHED':
					// User signed in (possibly from another tab)
					// Invalidate server data to reflect new auth state
					await invalidateAll();
					if (options.onSignIn) {
						await options.onSignIn();
					}
					break;

				case 'SIGNED_OUT':
					// User signed out (possibly from another tab)
					await invalidateAll();
					if (options.onSignOut) {
						await options.onSignOut();
					}
					// Redirect to home if on a protected route
					if (window.location.pathname.startsWith('/provider')) {
						await goto('/', { invalidateAll: true });
					}
					break;
			}
		}
	);

	// Cleanup function
	return () => {
		subscription.unsubscribe();
	};
}

/**
 * Mark the next auth change as local (triggered by this tab).
 * This prevents double-handling when we know we're initiating the change.
 *
 * Note: This is generally not needed as SvelteKit's invalidateAll
 * handles the state update, but can be useful for specific cases.
 */
export function markLocalAuthChange(): void {
	// This would be used if we needed to coordinate with initAuthSync
	// Currently, the form-based logout handles this via use:enhance
}
