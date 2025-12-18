/**
 * Shared utilities for building action plan payloads.
 * Used by both create and edit routes to maintain consistency.
 */

import type { PlanPayload } from '$lib/db/index';
import type { Skill, SupportiveAdultType, HelpMethod, CrisisResource } from '$lib/types/database';

/**
 * Draft data structure submitted from the client form.
 */
export interface ActionPlanDraftData {
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

/**
 * Reference data needed to build a plan payload.
 */
export interface ReferenceData {
	skills: Skill[];
	supportiveAdultTypes: SupportiveAdultType[];
	helpMethods: HelpMethod[];
	crisisResources: CrisisResource[];
}

/**
 * Builds a PlanPayload from draft data and reference data.
 * This creates the immutable snapshot stored in action_plan_revisions.
 */
export function buildPlanPayload(draft: ActionPlanDraftData, refs: ReferenceData): PlanPayload {
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
		const skill = refs.skills.find((s) => s.id === selected.skillId);
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
		const adultType = refs.supportiveAdultTypes.find((t) => t.id === selected.typeId);
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
		const method = refs.helpMethods.find((m) => m.id === selected.helpMethodId);
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
	for (const resource of refs.crisisResources) {
		planPayload.crisisResources.push({
			id: resource.id,
			name: resource.name,
			contact: resource.contact,
			contactType: resource.contact_type || 'phone',
			description: resource.description || '',
			displayOrder: resourceOrder++
		});
	}

	return planPayload;
}

/**
 * Database record types for action plan join tables.
 */
export interface JoinRecords {
	skillRecords: Array<{
		action_plan_id: string;
		skill_id: string | null;
		additional_info: string | null;
		is_custom: boolean;
		display_order: number;
	}>;
	adultRecords: Array<{
		action_plan_id: string;
		supportive_adult_type_id: string | null;
		name: string | null;
		contact_info: string | null;
		is_primary: boolean;
		is_custom: boolean;
		display_order: number;
	}>;
	methodRecords: Array<{
		action_plan_id: string;
		help_method_id: string | null;
		additional_info: string | null;
		is_custom: boolean;
		display_order: number;
	}>;
}

/**
 * Builds join table records from draft data.
 * These records are inserted into action_plan_skills, action_plan_supportive_adults,
 * and action_plan_help_methods tables.
 */
export function buildJoinRecords(actionPlanId: string, draft: ActionPlanDraftData): JoinRecords {
	const skillRecords: JoinRecords['skillRecords'] = [];
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

	const adultRecords: JoinRecords['adultRecords'] = [];
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

	const methodRecords: JoinRecords['methodRecords'] = [];
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

	return { skillRecords, adultRecords, methodRecords };
}
