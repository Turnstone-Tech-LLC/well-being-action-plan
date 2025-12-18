import type { PageServerLoad } from './$types';
import type {
	Skill,
	SkillCategory,
	SupportiveAdultType,
	HelpMethod,
	CrisisResource
} from '$lib/types/database';

export interface NewPlanPageData {
	skills: Skill[];
	categories: SkillCategory[];
	supportiveAdultTypes: SupportiveAdultType[];
	helpMethods: HelpMethod[];
	crisisResources: CrisisResource[];
}

export const load: PageServerLoad = async ({ locals, parent }): Promise<NewPlanPageData> => {
	// Get provider from parent layout
	const { provider } = await parent();

	const orgId = provider.organization_id;

	// Fetch skills: global (org_id is null) OR org-specific
	let skillsQuery = locals.supabase
		.from('skills')
		.select('*')
		.eq('is_active', true)
		.order('category', { ascending: true })
		.order('display_order', { ascending: true });

	// Fetch supportive adult types: global (org_id is null) OR org-specific
	let adultTypesQuery = locals.supabase
		.from('supportive_adult_types')
		.select('*')
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	// Fetch help methods: global (org_id is null) OR org-specific (Yellow Zone)
	let helpMethodsQuery = locals.supabase
		.from('help_methods')
		.select('*')
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	// Fetch crisis resources: global (org_id is null) OR org-specific (Red Zone)
	let crisisResourcesQuery = locals.supabase
		.from('crisis_resources')
		.select('*')
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	// Filter by organization - show global and org-specific
	if (orgId) {
		skillsQuery = skillsQuery.or(`organization_id.is.null,organization_id.eq.${orgId}`);
		adultTypesQuery = adultTypesQuery.or(`organization_id.is.null,organization_id.eq.${orgId}`);
		helpMethodsQuery = helpMethodsQuery.or(`organization_id.is.null,organization_id.eq.${orgId}`);
		crisisResourcesQuery = crisisResourcesQuery.or(
			`organization_id.is.null,organization_id.eq.${orgId}`
		);
	} else {
		// If no org, show only global
		skillsQuery = skillsQuery.is('organization_id', null);
		adultTypesQuery = adultTypesQuery.is('organization_id', null);
		helpMethodsQuery = helpMethodsQuery.is('organization_id', null);
		crisisResourcesQuery = crisisResourcesQuery.is('organization_id', null);
	}

	const [skillsResult, adultTypesResult, helpMethodsResult, crisisResourcesResult] =
		await Promise.all([skillsQuery, adultTypesQuery, helpMethodsQuery, crisisResourcesQuery]);

	if (skillsResult.error) {
		console.error('Error fetching skills:', skillsResult.error);
	}

	if (adultTypesResult.error) {
		console.error('Error fetching supportive adult types:', adultTypesResult.error);
	}

	if (helpMethodsResult.error) {
		console.error('Error fetching help methods:', helpMethodsResult.error);
	}

	if (crisisResourcesResult.error) {
		console.error('Error fetching crisis resources:', crisisResourcesResult.error);
	}

	// Standard category order
	const categories: SkillCategory[] = ['physical', 'creative', 'social', 'mindfulness'];

	return {
		skills: skillsResult.data || [],
		categories,
		supportiveAdultTypes: adultTypesResult.data || [],
		helpMethods: helpMethodsResult.data || [],
		crisisResources: crisisResourcesResult.data || []
	};
};
