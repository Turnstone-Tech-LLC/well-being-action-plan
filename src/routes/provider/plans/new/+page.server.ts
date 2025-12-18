import { fail } from '@sveltejs/kit';
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

/**
 * Interface for the action plan draft data submitted from the client.
 */
interface ActionPlanDraftData {
	patientNickname: string;
	selectedSkills: Array<{ skillId: string; fillInValue?: string }>;
	customSkills: Array<{ id: string; title: string; category: string }>;
	happyWhen: string;
	happyBecause: string;
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
}

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

		const skills = skillsResult.data || [];
		const adultTypes = adultTypesResult.data || [];
		const helpMethods = helpMethodsResult.data || [];
		const crisisResources = crisisResourcesResult.data || [];

		// Build the plan payload for the revision
		const planPayload: PlanPayload = {
			patientNickname: draft.patientNickname,
			happyWhen: draft.happyWhen,
			happyBecause: draft.happyBecause,
			skills: [],
			supportiveAdults: [],
			helpMethods: [],
			crisisResources: []
		};

		// Add selected skills to payload
		let skillOrder = 0;
		for (const selected of draft.selectedSkills) {
			const skill = skills.find((s) => s.id === selected.skillId);
			if (skill) {
				planPayload.skills.push({
					id: skill.id,
					title: skill.title,
					description: skill.fill_in_prompt || '',
					category: skill.category || 'mindfulness',
					additionalInfo: selected.fillInValue,
					displayOrder: skillOrder++
				});
			}
		}

		// Add custom skills to payload
		for (const custom of draft.customSkills) {
			planPayload.skills.push({
				id: custom.id,
				title: custom.title,
				description: '',
				category: custom.category,
				displayOrder: skillOrder++
			});
		}

		// Add selected supportive adults to payload
		let adultOrder = 0;
		for (const selected of draft.selectedSupportiveAdults) {
			const adultType = adultTypes.find((t) => t.id === selected.typeId);
			if (adultType) {
				planPayload.supportiveAdults.push({
					id: adultType.id,
					type: adultType.label,
					name: selected.name,
					contactInfo: selected.contactInfo || '',
					isPrimary: selected.isPrimary,
					displayOrder: adultOrder++
				});
			}
		}

		// Add custom supportive adults to payload
		for (const custom of draft.customSupportiveAdults) {
			planPayload.supportiveAdults.push({
				id: custom.id,
				type: custom.label,
				name: custom.name,
				contactInfo: custom.contactInfo || '',
				isPrimary: custom.isPrimary,
				displayOrder: adultOrder++
			});
		}

		// Add selected help methods to payload
		let methodOrder = 0;
		for (const selected of draft.selectedHelpMethods) {
			const method = helpMethods.find((m) => m.id === selected.helpMethodId);
			if (method) {
				planPayload.helpMethods.push({
					id: method.id,
					title: method.title,
					description: method.description || '',
					additionalInfo: selected.additionalInfo,
					displayOrder: methodOrder++
				});
			}
		}

		// Add custom help methods to payload
		for (const custom of draft.customHelpMethods) {
			planPayload.helpMethods.push({
				id: custom.id,
				title: custom.title,
				description: '',
				additionalInfo: custom.additionalInfo,
				displayOrder: methodOrder++
			});
		}

		// Add crisis resources to payload
		let resourceOrder = 0;
		for (const resource of crisisResources) {
			planPayload.crisisResources.push({
				id: resource.id,
				name: resource.name,
				contact: resource.contact,
				contactType: resource.contact_type || 'phone',
				description: resource.description || '',
				displayOrder: resourceOrder++
			});
		}

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

			// 3. Create action_plan_skills records
			const skillRecords = [];
			let skillDisplayOrder = 0;
			for (const selected of draft.selectedSkills) {
				skillRecords.push({
					action_plan_id: actionPlanId,
					skill_id: selected.skillId,
					additional_info: selected.fillInValue || null,
					is_custom: false,
					display_order: skillDisplayOrder++
				});
			}
			for (const custom of draft.customSkills) {
				skillRecords.push({
					action_plan_id: actionPlanId,
					skill_id: null,
					additional_info: custom.title, // Store title in additional_info for custom skills
					is_custom: true,
					display_order: skillDisplayOrder++
				});
			}

			if (skillRecords.length > 0) {
				const { error: skillsError } = await locals.supabase
					.from('action_plan_skills')
					.insert(skillRecords);
				if (skillsError) {
					console.error('Error creating action plan skills:', skillsError);
				}
			}

			// 4. Create action_plan_supportive_adults records
			const adultRecords = [];
			let adultDisplayOrder = 0;
			for (const selected of draft.selectedSupportiveAdults) {
				adultRecords.push({
					action_plan_id: actionPlanId,
					supportive_adult_type_id: selected.typeId,
					name: selected.name || null,
					contact_info: selected.contactInfo || null,
					is_primary: selected.isPrimary,
					is_custom: false,
					display_order: adultDisplayOrder++
				});
			}
			for (const custom of draft.customSupportiveAdults) {
				adultRecords.push({
					action_plan_id: actionPlanId,
					supportive_adult_type_id: null,
					name: custom.name || null,
					contact_info: custom.contactInfo || null,
					is_primary: custom.isPrimary,
					is_custom: true,
					display_order: adultDisplayOrder++
				});
			}

			if (adultRecords.length > 0) {
				const { error: adultsError } = await locals.supabase
					.from('action_plan_supportive_adults')
					.insert(adultRecords);
				if (adultsError) {
					console.error('Error creating action plan supportive adults:', adultsError);
				}
			}

			// 5. Create action_plan_help_methods records
			const methodRecords = [];
			let methodDisplayOrder = 0;
			for (const selected of draft.selectedHelpMethods) {
				methodRecords.push({
					action_plan_id: actionPlanId,
					help_method_id: selected.helpMethodId,
					additional_info: selected.additionalInfo || null,
					is_custom: false,
					display_order: methodDisplayOrder++
				});
			}
			for (const custom of draft.customHelpMethods) {
				methodRecords.push({
					action_plan_id: actionPlanId,
					help_method_id: null,
					additional_info: custom.additionalInfo || null,
					is_custom: true,
					display_order: methodDisplayOrder++
				});
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
