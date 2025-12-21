import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type {
	Skill,
	SkillCategory,
	SupportiveAdultType,
	HelpMethod,
	CrisisResource
} from '$lib/types/database';
import type { PlanPayload } from '$lib/db/index';
import { createInstallToken } from '$lib/server/utils/token';
import {
	buildPlanPayload,
	buildJoinRecords,
	type ActionPlanDraftData
} from '$lib/server/utils/planPayload';

export interface EditPlanPageData {
	planId: string;
	status: 'draft' | 'active' | 'archived';
	updatedAt: string;
	skills: Skill[];
	categories: SkillCategory[];
	supportiveAdultTypes: SupportiveAdultType[];
	helpMethods: HelpMethod[];
	crisisResources: CrisisResource[];
	existingData: {
		patientNickname: string;
		happyWhen: string;
		happyBecause: string;
		selectedSkills: Array<{ skillId: string; fillInValue?: string }>;
		customSkills: Array<{ id: string; title: string; category: SkillCategory }>;
		selectedSupportiveAdults: Array<{
			typeId: string;
			name: string;
			contactInfo?: string;
			isPrimary: boolean;
		}>;
		customSupportiveAdults: Array<{
			id: string;
			label: string;
			name: string;
			contactInfo?: string;
			isPrimary: boolean;
		}>;
		selectedHelpMethods: Array<{ helpMethodId: string; additionalInfo?: string }>;
		customHelpMethods: Array<{ id: string; title: string; additionalInfo?: string }>;
	};
	activeToken: {
		token: string;
		expiresAt: string;
	} | null;
}

export const load: PageServerLoad = async ({
	params,
	locals,
	parent
}): Promise<EditPlanPageData> => {
	const { provider } = await parent();

	if (!provider?.organization_id) {
		error(403, 'You must be associated with an organization to edit action plans');
	}

	const orgId = provider.organization_id;

	// Fetch the action plan with all related data
	const { data: actionPlan, error: planError } = await locals.supabase
		.from('action_plans')
		.select(
			`
			id,
			organization_id,
			patient_nickname,
			status,
			happy_when,
			happy_because,
			updated_at,
			archived_at,
			action_plan_skills (
				id,
				skill_id,
				additional_info,
				is_custom,
				display_order
			),
			action_plan_supportive_adults (
				id,
				supportive_adult_type_id,
				name,
				contact_info,
				is_primary,
				is_custom,
				display_order
			),
			action_plan_help_methods (
				id,
				help_method_id,
				additional_info,
				is_custom,
				display_order
			)
		`
		)
		.eq('id', params.id)
		.single();

	if (planError || !actionPlan) {
		error(404, 'Action plan not found');
	}

	// Verify the plan belongs to the provider's organization
	if (actionPlan.organization_id !== provider.organization_id) {
		error(403, 'You can only edit action plans from your organization');
	}

	// Fetch reference data
	let skillsQuery = locals.supabase
		.from('skills')
		.select('*')
		.eq('is_active', true)
		.order('category', { ascending: true })
		.order('display_order', { ascending: true });

	let adultTypesQuery = locals.supabase
		.from('supportive_adult_types')
		.select('*')
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	let helpMethodsQuery = locals.supabase
		.from('help_methods')
		.select('*')
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	let crisisResourcesQuery = locals.supabase
		.from('crisis_resources')
		.select('*')
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	// Filter by organization
	if (orgId) {
		skillsQuery = skillsQuery.or(`organization_id.is.null,organization_id.eq.${orgId}`);
		adultTypesQuery = adultTypesQuery.or(`organization_id.is.null,organization_id.eq.${orgId}`);
		helpMethodsQuery = helpMethodsQuery.or(`organization_id.is.null,organization_id.eq.${orgId}`);
		crisisResourcesQuery = crisisResourcesQuery.or(
			`organization_id.is.null,organization_id.eq.${orgId}`
		);
	} else {
		skillsQuery = skillsQuery.is('organization_id', null);
		adultTypesQuery = adultTypesQuery.is('organization_id', null);
		helpMethodsQuery = helpMethodsQuery.is('organization_id', null);
		crisisResourcesQuery = crisisResourcesQuery.is('organization_id', null);
	}

	// Fetch active token
	const tokenQuery = locals.supabase
		.from('action_plan_install_tokens')
		.select('token, expires_at')
		.eq('action_plan_id', params.id)
		.is('revoked_at', null)
		.gt('expires_at', new Date().toISOString())
		.order('created_at', { ascending: false })
		.limit(1)
		.single();

	const [skillsResult, adultTypesResult, helpMethodsResult, crisisResourcesResult, tokenResult] =
		await Promise.all([
			skillsQuery,
			adultTypesQuery,
			helpMethodsQuery,
			crisisResourcesQuery,
			tokenQuery
		]);

	const skills = skillsResult.data || [];
	const adultTypes = adultTypesResult.data || [];
	const helpMethods = helpMethodsResult.data || [];

	// Transform existing plan data into wizard format
	const planSkills = actionPlan.action_plan_skills || [];
	const planAdults = actionPlan.action_plan_supportive_adults || [];
	const planMethods = actionPlan.action_plan_help_methods || [];

	// Separate selected skills from custom skills
	const selectedSkills: Array<{ skillId: string; fillInValue?: string }> = [];
	const customSkills: Array<{ id: string; title: string; category: SkillCategory }> = [];

	for (const planSkill of planSkills.sort(
		(a: { display_order: number }, b: { display_order: number }) =>
			a.display_order - b.display_order
	)) {
		if (planSkill.is_custom) {
			// Custom skill - generate a unique id and get title from additional_info
			customSkills.push({
				id: `custom-${planSkill.id}`,
				title: planSkill.additional_info || '',
				category: 'mindfulness' // Default category for custom skills
			});
		} else if (planSkill.skill_id) {
			selectedSkills.push({
				skillId: planSkill.skill_id,
				fillInValue: planSkill.additional_info || undefined
			});
		}
	}

	// Separate selected supportive adults from custom
	const selectedSupportiveAdults: Array<{
		typeId: string;
		name: string;
		contactInfo?: string;
		isPrimary: boolean;
	}> = [];
	const customSupportiveAdults: Array<{
		id: string;
		label: string;
		name: string;
		contactInfo?: string;
		isPrimary: boolean;
	}> = [];

	for (const planAdult of planAdults.sort(
		(a: { display_order: number }, b: { display_order: number }) =>
			a.display_order - b.display_order
	)) {
		if (planAdult.is_custom) {
			// Custom adult - we need to get the label from somewhere
			// For custom adults, we stored the type label, so we'll get it from the plan revision
			customSupportiveAdults.push({
				id: `custom-adult-${planAdult.id}`,
				label: 'Other', // Default label for custom adults
				name: planAdult.name || '',
				contactInfo: planAdult.contact_info || undefined,
				isPrimary: planAdult.is_primary
			});
		} else if (planAdult.supportive_adult_type_id) {
			selectedSupportiveAdults.push({
				typeId: planAdult.supportive_adult_type_id,
				name: planAdult.name || '',
				contactInfo: planAdult.contact_info || undefined,
				isPrimary: planAdult.is_primary
			});
		}
	}

	// Separate selected help methods from custom
	const selectedHelpMethods: Array<{ helpMethodId: string; additionalInfo?: string }> = [];
	const customHelpMethods: Array<{ id: string; title: string; additionalInfo?: string }> = [];

	for (const planMethod of planMethods.sort(
		(a: { display_order: number }, b: { display_order: number }) =>
			a.display_order - b.display_order
	)) {
		if (planMethod.is_custom) {
			// For custom help methods, the title was stored in additional_info during create
			// We need to look it up from the revision payload
			customHelpMethods.push({
				id: `custom-help-${planMethod.id}`,
				title: 'Custom Method', // Will be enhanced from revision data
				additionalInfo: planMethod.additional_info || undefined
			});
		} else if (planMethod.help_method_id) {
			selectedHelpMethods.push({
				helpMethodId: planMethod.help_method_id,
				additionalInfo: planMethod.additional_info || undefined
			});
		}
	}

	// Try to get more accurate custom data from the latest revision
	const { data: latestRevision } = await locals.supabase
		.from('action_plan_revisions')
		.select('plan_payload')
		.eq('action_plan_id', params.id)
		.order('version', { ascending: false })
		.limit(1)
		.single();

	if (latestRevision?.plan_payload) {
		const payload = latestRevision.plan_payload as PlanPayload;

		// Update custom skills with correct data from revision
		for (let i = 0; i < customSkills.length && i < payload.skills.length; i++) {
			const payloadSkill = payload.skills.find(
				(s) =>
					s.title === customSkills[i].title || s.id === customSkills[i].id.replace('custom-', '')
			);
			if (payloadSkill) {
				customSkills[i].title = payloadSkill.title;
				customSkills[i].category = payloadSkill.category as SkillCategory;
			}
		}

		// Update custom supportive adults with correct label
		for (const customAdult of customSupportiveAdults) {
			const payloadAdult = payload.supportiveAdults.find(
				(a) => a.name === customAdult.name && a.isPrimary === customAdult.isPrimary
			);
			if (payloadAdult) {
				customAdult.label = payloadAdult.type;
			}
		}

		// Update custom help methods with correct title
		for (const customMethod of customHelpMethods) {
			const payloadMethod = payload.helpMethods.find(
				(m) => m.additionalInfo === customMethod.additionalInfo
			);
			if (payloadMethod) {
				customMethod.title = payloadMethod.title;
			}
		}
	}

	const categories: SkillCategory[] = ['physical', 'creative', 'social', 'mindfulness'];

	return {
		planId: actionPlan.id,
		status: actionPlan.archived_at ? 'archived' : (actionPlan.status as 'draft' | 'active'),
		updatedAt: actionPlan.updated_at,
		skills,
		categories,
		supportiveAdultTypes: adultTypes,
		helpMethods,
		crisisResources: crisisResourcesResult.data || [],
		existingData: {
			patientNickname: actionPlan.patient_nickname || '',
			happyWhen: actionPlan.happy_when || '',
			happyBecause: actionPlan.happy_because || '',
			selectedSkills,
			customSkills,
			selectedSupportiveAdults,
			customSupportiveAdults,
			selectedHelpMethods,
			customHelpMethods
		},
		activeToken: tokenResult.data
			? {
					token: tokenResult.data.token,
					expiresAt: tokenResult.data.expires_at
				}
			: null
	};
};

// ActionPlanDraftData type imported from shared utility

export const actions: Actions = {
	updatePlan: async ({ params, request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const userId = locals.user.id;

		// Get provider profile
		const { data: provider, error: providerError } = await locals.supabase
			.from('provider_profiles')
			.select('id, organization_id')
			.eq('id', userId)
			.single();

		if (providerError || !provider) {
			return fail(401, { error: 'Provider profile not found' });
		}

		const orgId = provider.organization_id;

		// Verify the plan exists and belongs to the organization
		const { data: existingPlan, error: planError } = await locals.supabase
			.from('action_plans')
			.select('id, organization_id, updated_at')
			.eq('id', params.id)
			.single();

		if (planError || !existingPlan) {
			return fail(404, { error: 'Action plan not found' });
		}

		if (existingPlan.organization_id !== orgId) {
			return fail(403, { error: 'You can only edit plans from your organization' });
		}

		// Parse form data
		const formData = await request.formData();
		const draftJson = formData.get('draft');
		const expectedUpdatedAt = formData.get('updatedAt');

		if (!draftJson || typeof draftJson !== 'string') {
			return fail(400, { error: 'Missing action plan data' });
		}

		// Optimistic locking - check if plan was modified by another user
		if (expectedUpdatedAt && existingPlan.updated_at !== expectedUpdatedAt) {
			return fail(409, {
				error: 'This plan has been modified by another user. Please refresh and try again.'
			});
		}

		let draft: ActionPlanDraftData;
		try {
			draft = JSON.parse(draftJson);
		} catch {
			return fail(400, { error: 'Invalid action plan data' });
		}

		// Fetch reference data for building the plan payload
		// Build queries that handle both org-specific and global resources
		let refSkillsQuery = locals.supabase.from('skills').select('*').eq('is_active', true);
		let refAdultTypesQuery = locals.supabase
			.from('supportive_adult_types')
			.select('*')
			.eq('is_active', true);
		let refHelpMethodsQuery = locals.supabase.from('help_methods').select('*').eq('is_active', true);
		let refCrisisResourcesQuery = locals.supabase
			.from('crisis_resources')
			.select('*')
			.eq('is_active', true)
			.order('display_order', { ascending: true });

		// Filter by organization - show global and org-specific
		if (orgId) {
			refSkillsQuery = refSkillsQuery.or(`organization_id.is.null,organization_id.eq.${orgId}`);
			refAdultTypesQuery = refAdultTypesQuery.or(
				`organization_id.is.null,organization_id.eq.${orgId}`
			);
			refHelpMethodsQuery = refHelpMethodsQuery.or(
				`organization_id.is.null,organization_id.eq.${orgId}`
			);
			refCrisisResourcesQuery = refCrisisResourcesQuery.or(
				`organization_id.is.null,organization_id.eq.${orgId}`
			);
		} else {
			// If no org, show only global
			refSkillsQuery = refSkillsQuery.is('organization_id', null);
			refAdultTypesQuery = refAdultTypesQuery.is('organization_id', null);
			refHelpMethodsQuery = refHelpMethodsQuery.is('organization_id', null);
			refCrisisResourcesQuery = refCrisisResourcesQuery.is('organization_id', null);
		}

		const [skillsResult, adultTypesResult, helpMethodsResult, crisisResourcesResult] =
			await Promise.all([
				refSkillsQuery,
				refAdultTypesQuery,
				refHelpMethodsQuery,
				refCrisisResourcesQuery
			]);

		// Build the plan payload using shared utility
		const planPayload = buildPlanPayload(draft, {
			skills: skillsResult.data || [],
			supportiveAdultTypes: adultTypesResult.data || [],
			helpMethods: helpMethodsResult.data || [],
			crisisResources: crisisResourcesResult.data || []
		});

		try {
			// 1. Update action_plans record
			const { error: updatePlanError } = await locals.supabase
				.from('action_plans')
				.update({
					patient_nickname: draft.patientNickname || null,
					happy_when: draft.happyWhen || null,
					happy_because: draft.happyBecause || null,
					updated_at: new Date().toISOString()
				})
				.eq('id', params.id);

			if (updatePlanError) {
				console.error('Error updating action plan:', updatePlanError);
				return fail(500, { error: 'Failed to update action plan' });
			}

			// 2. Get current version and create new revision
			const { data: currentRevision } = await locals.supabase
				.from('action_plan_revisions')
				.select('version')
				.eq('action_plan_id', params.id)
				.order('version', { ascending: false })
				.limit(1)
				.single();

			const newVersion = (currentRevision?.version || 0) + 1;

			const { data: revision, error: revisionError } = await locals.supabase
				.from('action_plan_revisions')
				.insert({
					action_plan_id: params.id,
					version: newVersion,
					plan_payload: planPayload,
					created_by: userId
				})
				.select('id')
				.single();

			if (revisionError || !revision) {
				console.error('Error creating action plan revision:', revisionError);
				return fail(500, { error: 'Failed to create action plan revision' });
			}

			// 3. Delete existing join records (simpler than diffing)
			await Promise.all([
				locals.supabase.from('action_plan_skills').delete().eq('action_plan_id', params.id),
				locals.supabase
					.from('action_plan_supportive_adults')
					.delete()
					.eq('action_plan_id', params.id),
				locals.supabase.from('action_plan_help_methods').delete().eq('action_plan_id', params.id)
			]);

			// 4. Insert new join records using shared utility
			const { skillRecords, adultRecords, methodRecords } = buildJoinRecords(params.id, draft);

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

			return { success: true };
		} catch (err) {
			console.error('Error updating action plan:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	regenerateToken: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		// Get provider profile
		const { data: provider } = await locals.supabase
			.from('provider_profiles')
			.select('id, organization_id')
			.eq('id', locals.user.id)
			.single();

		if (!provider?.organization_id) {
			return fail(403, { error: 'You must be associated with an organization' });
		}

		// Fetch the plan with latest revision
		const { data: plan } = await locals.supabase
			.from('action_plans')
			.select(
				`
				id,
				organization_id,
				action_plan_revisions (
					id,
					version
				)
			`
			)
			.eq('id', params.id)
			.single();

		if (!plan || plan.organization_id !== provider.organization_id) {
			return fail(403, { error: 'You can only generate tokens for plans from your organization' });
		}

		const revisions = plan.action_plan_revisions || [];
		const latestRevision = revisions.sort(
			(a: { version: number }, b: { version: number }) => b.version - a.version
		)[0];

		if (!latestRevision) {
			return fail(400, { error: 'No revision found for this plan' });
		}

		// Revoke existing active tokens
		await locals.supabase
			.from('action_plan_install_tokens')
			.update({ revoked_at: new Date().toISOString() })
			.eq('action_plan_id', params.id)
			.is('revoked_at', null);

		// Generate new token
		const token = createInstallToken();

		// Token expires in 7 days
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		// Create new token
		const { error: tokenError } = await locals.supabase.from('action_plan_install_tokens').insert({
			action_plan_id: params.id,
			revision_id: latestRevision.id,
			token,
			purpose: 'install',
			expires_at: expiresAt.toISOString()
		});

		if (tokenError) {
			console.error('Error creating token:', tokenError);
			return fail(500, { error: 'Failed to generate new token' });
		}

		return { success: true, token, expiresAt: expiresAt.toISOString() };
	},

	archive: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		const { data: provider } = await locals.supabase
			.from('provider_profiles')
			.select('id, organization_id')
			.eq('id', locals.user.id)
			.single();

		if (!provider?.organization_id) {
			return fail(403, { error: 'You must be associated with an organization' });
		}

		const { data: plan } = await locals.supabase
			.from('action_plans')
			.select('organization_id')
			.eq('id', params.id)
			.single();

		if (!plan || plan.organization_id !== provider.organization_id) {
			return fail(403, { error: 'You can only archive plans from your organization' });
		}

		const { error: updateError } = await locals.supabase
			.from('action_plans')
			.update({ archived_at: new Date().toISOString() })
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { error: 'Failed to archive action plan' });
		}

		redirect(303, `/provider/plans/${params.id}`);
	},

	unarchive: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		const { data: provider } = await locals.supabase
			.from('provider_profiles')
			.select('id, organization_id')
			.eq('id', locals.user.id)
			.single();

		if (!provider?.organization_id) {
			return fail(403, { error: 'You must be associated with an organization' });
		}

		const { data: plan } = await locals.supabase
			.from('action_plans')
			.select('organization_id')
			.eq('id', params.id)
			.single();

		if (!plan || plan.organization_id !== provider.organization_id) {
			return fail(403, { error: 'You can only unarchive plans from your organization' });
		}

		const { error: updateError } = await locals.supabase
			.from('action_plans')
			.update({ archived_at: null })
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { error: 'Failed to unarchive action plan' });
		}

		return { success: true };
	}
};
