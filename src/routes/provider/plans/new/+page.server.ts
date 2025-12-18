import type { PageServerLoad } from './$types';
import type { Skill, SkillCategory } from '$lib/types/database';

export interface NewPlanPageData {
	skills: Skill[];
	categories: SkillCategory[];
}

export const load: PageServerLoad = async ({ locals, parent }): Promise<NewPlanPageData> => {
	// Get provider from parent layout
	const { provider } = await parent();

	const orgId = provider.organization_id;

	// Fetch skills: global (org_id is null) OR org-specific
	let query = locals.supabase
		.from('skills')
		.select('*')
		.eq('is_active', true)
		.order('category', { ascending: true })
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

	// Standard category order
	const categories: SkillCategory[] = ['physical', 'creative', 'social', 'mindfulness'];

	return {
		skills: skills || [],
		categories
	};
};
