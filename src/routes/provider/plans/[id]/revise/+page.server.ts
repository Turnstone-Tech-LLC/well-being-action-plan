import { error, fail, redirect, isRedirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type {
	Skill,
	SkillCategory,
	SupportiveAdultType,
	HelpMethod,
	CrisisResource
} from '$lib/types/database';
import type { PlanPayload } from '$lib/db/index';
import type { CheckInSummary } from '$lib/server/types';
import { createInstallToken } from '$lib/server/utils/token';
import {
	buildPlanPayload,
	buildJoinRecords,
	type ActionPlanDraftData
} from '$lib/server/utils/planPayload';

export interface RevisePlanPageData {
	planId: string;
	currentVersion: number;
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
}

export const load: PageServerLoad = async ({
	params,
	locals,
	parent
}): Promise<RevisePlanPageData> => {
	const { provider } = await parent();

	if (!provider?.organization_id) {
		error(403, 'You must be associated with an organization to revise action plans');
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
		error(403, 'You can only revise action plans from your organization');
	}

	// Cannot revise archived plans
	if (actionPlan.archived_at) {
		error(400, 'Cannot revise an archived action plan');
	}

	// Get current version
	const { data: latestRevision } = await locals.supabase
		.from('action_plan_revisions')
		.select('version, plan_payload')
		.eq('action_plan_id', params.id)
		.order('version', { ascending: false })
		.limit(1)
		.single();

	const currentVersion = latestRevision?.version || 1;

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

	const [skillsResult, adultTypesResult, helpMethodsResult, crisisResourcesResult] =
		await Promise.all([skillsQuery, adultTypesQuery, helpMethodsQuery, crisisResourcesQuery]);

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
			customSkills.push({
				id: `custom-${planSkill.id}`,
				title: planSkill.additional_info || '',
				category: 'mindfulness'
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
			customSupportiveAdults.push({
				id: `custom-adult-${planAdult.id}`,
				label: 'Other',
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
			customHelpMethods.push({
				id: `custom-help-${planMethod.id}`,
				title: 'Custom Method',
				additionalInfo: planMethod.additional_info || undefined
			});
		} else if (planMethod.help_method_id) {
			selectedHelpMethods.push({
				helpMethodId: planMethod.help_method_id,
				additionalInfo: planMethod.additional_info || undefined
			});
		}
	}

	// Enhance custom data from revision payload
	if (latestRevision?.plan_payload) {
		const payload = latestRevision.plan_payload as PlanPayload;

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

		for (const customAdult of customSupportiveAdults) {
			const payloadAdult = payload.supportiveAdults.find(
				(a) => a.name === customAdult.name && a.isPrimary === customAdult.isPrimary
			);
			if (payloadAdult) {
				customAdult.label = payloadAdult.type;
			}
		}

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
		currentVersion,
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
		}
	};
};

export const actions: Actions = {
	createRevision: async ({ params, request, locals }) => {
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
			.select('id, organization_id, archived_at')
			.eq('id', params.id)
			.single();

		if (planError || !existingPlan) {
			return fail(404, { error: 'Action plan not found' });
		}

		if (existingPlan.organization_id !== orgId) {
			return fail(403, { error: 'You can only revise plans from your organization' });
		}

		if (existingPlan.archived_at) {
			return fail(400, { error: 'Cannot revise an archived action plan' });
		}

		// Parse form data
		const formData = await request.formData();
		const draftJson = formData.get('draft');
		const revisionNotes = formData.get('revisionNotes') as string;
		const whatWorkedNotes = formData.get('whatWorkedNotes') as string;
		const whatDidntWorkNotes = formData.get('whatDidntWorkNotes') as string;
		const checkInSummaryJson = formData.get('checkInSummary');

		if (!draftJson || typeof draftJson !== 'string') {
			return fail(400, { error: 'Missing action plan data' });
		}

		let draft: ActionPlanDraftData;
		try {
			draft = JSON.parse(draftJson);
		} catch {
			return fail(400, { error: 'Invalid action plan data' });
		}

		let checkInSummary: CheckInSummary | null = null;
		if (checkInSummaryJson && typeof checkInSummaryJson === 'string') {
			try {
				checkInSummary = JSON.parse(checkInSummaryJson);
			} catch {
				// Ignore invalid check-in summary
			}
		}

		// Fetch reference data for building the plan payload
		let refSkillsQuery = locals.supabase.from('skills').select('*').eq('is_active', true);
		let refAdultTypesQuery = locals.supabase
			.from('supportive_adult_types')
			.select('*')
			.eq('is_active', true);
		let refHelpMethodsQuery = locals.supabase
			.from('help_methods')
			.select('*')
			.eq('is_active', true);
		let refCrisisResourcesQuery = locals.supabase
			.from('crisis_resources')
			.select('*')
			.eq('is_active', true)
			.order('display_order', { ascending: true });

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

		// Build the plan payload
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
					revision_type: 'revision',
					revision_notes: revisionNotes || null,
					what_worked_notes: whatWorkedNotes || null,
					what_didnt_work_notes: whatDidntWorkNotes || null,
					check_in_summary: checkInSummary,
					created_by: userId
				})
				.select('id')
				.single();

			if (revisionError || !revision) {
				console.error('Error creating action plan revision:', revisionError);
				return fail(500, { error: 'Failed to create action plan revision' });
			}

			// 3. Delete existing join records
			await Promise.all([
				locals.supabase.from('action_plan_skills').delete().eq('action_plan_id', params.id),
				locals.supabase
					.from('action_plan_supportive_adults')
					.delete()
					.eq('action_plan_id', params.id),
				locals.supabase.from('action_plan_help_methods').delete().eq('action_plan_id', params.id)
			]);

			// 4. Insert new join records
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

			// 5. Generate new token for the updated plan
			const token = createInstallToken();
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + 7);

			// Revoke existing active tokens
			await locals.supabase
				.from('action_plan_install_tokens')
				.update({ revoked_at: new Date().toISOString() })
				.eq('action_plan_id', params.id)
				.is('revoked_at', null);

			// Create new token
			await locals.supabase.from('action_plan_install_tokens').insert({
				action_plan_id: params.id,
				revision_id: revision.id,
				token,
				purpose: 'update',
				expires_at: expiresAt.toISOString()
			});

			redirect(303, `/provider/plans/${params.id}?revised=true`);
		} catch (err) {
			// Re-throw redirects - they're not errors
			if (isRedirect(err)) {
				throw err;
			}
			console.error('Error creating revision:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};
