import type { LayoutServerLoad } from './$types';
import { patientGuard } from '$lib/guards/patientGuard.server';

export const load: LayoutServerLoad = async ({ cookies }) => {
	// Server-side guard: redirect to landing if no plan cookie
	// Client-side in +layout.svelte handles stale cookies (cookie exists but no IndexedDB data)
	patientGuard({ cookies });

	return {};
};
