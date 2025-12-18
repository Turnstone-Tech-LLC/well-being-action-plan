import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type {
	Skill,
	SkillCategory,
	SupportiveAdultType,
	HelpMethod,
	CrisisResource
} from '$lib/types/database';
import { createInstallToken } from '$lib/server/utils/token';
import {
	buildPlanPayload,
	buildJoinRecords,
	type ActionPlanDraftData
} from '$lib/server/utils/planPayload';

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

// ActionPlanDraftData type imported from shared utility

export const actions: Actions = {
	createPlan: async ({ request, locals }) => {
		// Ensure user is authenticated
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const userId = locals.user.id;

		// Get provider profile to get org_id
		const { data: provider, error: providerError } = await locals.supabase
			.from('provider_profiles')
			.select('id, organization_id')
			.eq('id', userId)
			.single();

		if (providerError || !provider) {
			console.error('Error fetching provider profile:', providerError);
			return fail(401, { error: 'Provider profile not found' });
		}

		const orgId = provider.organization_id;

		// Parse form data
		const formData = await request.formData();
		const draftJson = formData.get('draft');

		if (!draftJson || typeof draftJson !== 'string') {
			return fail(400, { error: 'Missing action plan data' });
		}

		let draft: ActionPlanDraftData;
		try {
			draft = JSON.parse(draftJson);
		} catch {
			return fail(400, { error: 'Invalid action plan data' });
		}

		// Fetch reference data for building the plan payload
		const [skillsResult, adultTypesResult, helpMethodsResult, crisisResourcesResult] =
			await Promise.all([
				locals.supabase
					.from('skills')
					.select('*')
					.eq('is_active', true)
					.or(`organization_id.is.null,organization_id.eq.${orgId}`),
				locals.supabase
					.from('supportive_adult_types')
					.select('*')
					.eq('is_active', true)
					.or(`organization_id.is.null,organization_id.eq.${orgId}`),
				locals.supabase
					.from('help_methods')
					.select('*')
					.eq('is_active', true)
					.or(`organization_id.is.null,organization_id.eq.${orgId}`),
				locals.supabase
					.from('crisis_resources')
					.select('*')
					.eq('is_active', true)
					.or(`organization_id.is.null,organization_id.eq.${orgId}`)
					.order('display_order', { ascending: true })
			]);

		// Build the plan payload using shared utility
		const planPayload = buildPlanPayload(draft, {
			skills: skillsResult.data || [],
			supportiveAdultTypes: adultTypesResult.data || [],
			helpMethods: helpMethodsResult.data || [],
			crisisResources: crisisResourcesResult.data || []
		});

		// Start database transaction
		try {
			// 1. Create action_plans record
			const { data: actionPlan, error: planError } = await locals.supabase
				.from('action_plans')
				.insert({
					organization_id: orgId,
					provider_id: provider.id,
					patient_nickname: draft.patientNickname || null,
					status: 'active',
					happy_when: draft.happyWhen || null,
					happy_because: draft.happyBecause || null,
					created_by: userId
				})
				.select('id')
				.single();

			if (planError || !actionPlan) {
				console.error('Error creating action plan:', planError);
				return fail(500, { error: 'Failed to create action plan' });
			}

			const actionPlanId = actionPlan.id;

			// 2. Create action_plan_revisions record
			const { data: revision, error: revisionError } = await locals.supabase
				.from('action_plan_revisions')
				.insert({
					action_plan_id: actionPlanId,
					version: 1,
					plan_payload: planPayload,
					created_by: userId
				})
				.select('id')
				.single();

			if (revisionError || !revision) {
				console.error('Error creating action plan revision:', revisionError);
				// Clean up the action plan
				await locals.supabase.from('action_plans').delete().eq('id', actionPlanId);
				return fail(500, { error: 'Failed to create action plan revision' });
			}

			const revisionId = revision.id;

			// 3. Create join table records using shared utility
			const { skillRecords, adultRecords, methodRecords } = buildJoinRecords(actionPlanId, draft);

			if (skillRecords.length > 0) {
				const { error: skillsError } = await locals.supabase
					.from('action_plan_skills')
					.insert(skillRecords);
				if (skillsError) {
					console.error('Error creating action plan skills:', skillsError);
				}
			}

			if (adultRecords.length > 0) {
				const { error: adultsError } = await locals.supabase
					.from('action_plan_supportive_adults')
					.insert(adultRecords);
				if (adultsError) {
					console.error('Error creating action plan supportive adults:', adultsError);
				}
			}

			if (methodRecords.length > 0) {
				const { error: methodsError } = await locals.supabase
					.from('action_plan_help_methods')
					.insert(methodRecords);
				if (methodsError) {
					console.error('Error creating action plan help methods:', methodsError);
				}
			}

			// 6. Generate token and create action_plan_install_tokens record
			const token = createInstallToken();
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

			const { error: tokenError } = await locals.supabase
				.from('action_plan_install_tokens')
				.insert({
					action_plan_id: actionPlanId,
					revision_id: revisionId,
					token: token,
					purpose: 'install',
					expires_at: expiresAt.toISOString()
				});

			if (tokenError) {
				console.error('Error creating install token:', tokenError);
				return fail(500, { error: 'Failed to create access token' });
			}

			return {
				success: true,
				actionPlanId,
				token,
				patientNickname: draft.patientNickname
			};
		} catch (error) {
			console.error('Error creating action plan:', error);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};
