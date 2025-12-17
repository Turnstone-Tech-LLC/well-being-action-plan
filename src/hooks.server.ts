import { createSupabaseServerClient } from '$lib/server/supabase';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Create Supabase client with cookie handling
	event.locals.supabase = createSupabaseServerClient(event.cookies);

	/**
	 * Safely get session data without throwing on invalid JWT.
	 * Unlike getSession(), this won't cause errors for expired/invalid tokens.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		// Verify the user exists - this validates the JWT
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !user) {
			// Invalid session - clear it
			return { session: null, user: null };
		}

		return { session, user };
	};

	// Get session for use in routes
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			// Allow Supabase auth cookies to be set
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
