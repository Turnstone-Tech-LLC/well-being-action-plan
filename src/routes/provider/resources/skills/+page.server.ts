import type { PageServerLoad } from './$types';
import type { Skill, ProviderProfile } from '$lib/types/database';

export interface SkillsPageData {
	skills: Skill[];
	providerProfile: ProviderProfile | null;
	categories: string[];
}

export const load: PageServerLoad = async ({ locals, parent }): Promise<SkillsPageData> => {
	// Get user from parent layout
	const { user } = await parent();

	// Fetch provider profile to get organization_id
	const { data: providerProfile } = await locals.supabase
		.from('provider_profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	const orgId = providerProfile?.organization_id;

	// Fetch skills: global (org_id is null) OR org-specific
	let query = locals.supabase
		.from('skills')
		.select('*')
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	// Filter by organization - show global skills and org-specific skills
	if (orgId) {
		query = query.or(`organization_id.is.null,organization_id.eq.${orgId}`);
	} else {
		// If no org, show only global skills
		query = query.is('organization_id', null);
	}

	const { data: skills, error } = await query;

	if (error) {
		console.error('Error fetching skills:', error);
	}

	// Extract unique categories from skills
	const categories = [
		...new Set((skills || []).map((s) => s.category).filter((c): c is string => c !== null))
	].sort();

	return {
		skills: skills || [],
		providerProfile,
		categories
	};
};
