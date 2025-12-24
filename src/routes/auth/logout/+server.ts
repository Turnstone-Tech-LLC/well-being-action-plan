import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Handle direct GET requests (e.g., typing URL directly in browser)
export const GET: RequestHandler = async ({ locals }) => {
	await locals.supabase.auth.signOut({ scope: 'local' });
	redirect(303, '/');
};
