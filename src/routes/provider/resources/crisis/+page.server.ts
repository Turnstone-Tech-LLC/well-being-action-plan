import type { PageServerLoad } from './$types';
import type { CrisisResource, ProviderProfile } from '$lib/types/database';

export interface CrisisResourcesPageData {
	crisisResources: CrisisResource[];
	providerProfile: ProviderProfile | null;
}

export const load: PageServerLoad = async ({ locals }): Promise<CrisisResourcesPageData> => {
	// User is guaranteed by parent layout auth guard
	const userId = locals.user!.id;

	// Fetch provider profile to get organization_id and role
	const { data: providerProfile } = await locals.supabase
		.from('provider_profiles')
		.select('*')
		.eq('id', userId)
		.single();

	const orgId = providerProfile?.organization_id;

	// Fetch crisis resources: global (org_id is null) OR org-specific
	let query = locals.supabase
		.from('crisis_resources')
		.select('*')
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	// Filter by organization - show global crisis resources and org-specific ones
	if (orgId) {
		query = query.or(`organization_id.is.null,organization_id.eq.${orgId}`);
	} else {
		// If no org, show only global crisis resources
		query = query.is('organization_id', null);
	}

	const { data: crisisResources, error } = await query;

	if (error) {
		console.error('Error fetching crisis resources:', error);
	}

	return {
		crisisResources: crisisResources || [],
		providerProfile
	};
};

// Note: No delete action for crisis resources in v1
// Deletion is disabled to protect critical safety information
