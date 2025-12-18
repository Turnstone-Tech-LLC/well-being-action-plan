/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { buildPlanPayload, buildJoinRecords, type ActionPlanDraftData } from './planPayload';
import type { Skill, SupportiveAdultType, HelpMethod, CrisisResource } from '$lib/types/database';

describe('planPayload utility', () => {
	// Sample reference data for tests
	const mockSkills: Skill[] = [
		{
			id: 'skill-1',
			organization_id: null,
			title: 'Deep Breathing',
			category: 'mindfulness',
			has_fill_in: false,
			fill_in_prompt: 'How many breaths?',
			display_order: 1,
			is_active: true,
			created_at: '2024-01-01'
		},
		{
			id: 'skill-2',
			organization_id: null,
			title: 'Go for a Walk',
			category: 'physical',
			has_fill_in: false,
			fill_in_prompt: null,
			display_order: 2,
			is_active: true,
			created_at: '2024-01-01'
		}
	];

	const mockAdultTypes: SupportiveAdultType[] = [
		{
			id: 'adult-type-1',
			organization_id: null,
			label: 'Parent',
			has_fill_in: false,
			display_order: 1,
			is_active: true,
			created_at: '2024-01-01'
		},
		{
			id: 'adult-type-2',
			organization_id: null,
			label: 'Teacher',
			has_fill_in: false,
			display_order: 2,
			is_active: true,
			created_at: '2024-01-01'
		}
	];

	const mockHelpMethods: HelpMethod[] = [
		{
			id: 'help-1',
			organization_id: null,
			title: 'Talk to Someone',
			description: 'Find a trusted adult to talk to',
			display_order: 1,
			is_active: true,
			created_at: '2024-01-01'
		}
	];

	const mockCrisisResources: CrisisResource[] = [
		{
			id: 'crisis-1',
			organization_id: null,
			name: '988 Suicide & Crisis Lifeline',
			contact: '988',
			contact_type: 'phone',
			description: '24/7 crisis support',
			display_order: 1,
			is_active: true,
			created_at: '2024-01-01'
		}
	];

	const baseDraft: ActionPlanDraftData = {
		patientNickname: 'Test Patient',
		happyWhen: 'Playing with friends',
		happyBecause: 'It makes me feel connected',
		selectedSkills: [],
		customSkills: [],
		selectedSupportiveAdults: [],
		customSupportiveAdults: [],
		selectedHelpMethods: [],
		customHelpMethods: []
	};

	describe('buildPlanPayload', () => {
		it('builds payload with basic info', () => {
			const payload = buildPlanPayload(baseDraft, {
				skills: mockSkills,
				supportiveAdultTypes: mockAdultTypes,
				helpMethods: mockHelpMethods,
				crisisResources: mockCrisisResources
			});

			expect(payload.patientNickname).toBe('Test Patient');
			expect(payload.happyWhen).toBe('Playing with friends');
			expect(payload.happyBecause).toBe('It makes me feel connected');
		});

		it('includes selected skills with correct data', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				selectedSkills: [{ skillId: 'skill-1', fillInValue: '5 breaths' }, { skillId: 'skill-2' }]
			};

			const payload = buildPlanPayload(draft, {
				skills: mockSkills,
				supportiveAdultTypes: mockAdultTypes,
				helpMethods: mockHelpMethods,
				crisisResources: mockCrisisResources
			});

			expect(payload.skills).toHaveLength(2);
			expect(payload.skills[0]).toEqual({
				id: 'skill-1',
				title: 'Deep Breathing',
				description: 'How many breaths?',
				category: 'mindfulness',
				additionalInfo: '5 breaths',
				displayOrder: 0
			});
			expect(payload.skills[1]).toEqual({
				id: 'skill-2',
				title: 'Go for a Walk',
				description: '',
				category: 'physical',
				additionalInfo: undefined,
				displayOrder: 1
			});
		});

		it('includes custom skills', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				customSkills: [{ id: 'custom-1', title: 'My Special Skill', category: 'creative' }]
			};

			const payload = buildPlanPayload(draft, {
				skills: mockSkills,
				supportiveAdultTypes: mockAdultTypes,
				helpMethods: mockHelpMethods,
				crisisResources: mockCrisisResources
			});

			expect(payload.skills).toHaveLength(1);
			expect(payload.skills[0]).toEqual({
				id: 'custom-1',
				title: 'My Special Skill',
				description: '',
				category: 'creative',
				displayOrder: 0
			});
		});

		it('includes selected supportive adults with correct data', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				selectedSupportiveAdults: [
					{ typeId: 'adult-type-1', name: 'Mom', contactInfo: '555-1234', isPrimary: true }
				]
			};

			const payload = buildPlanPayload(draft, {
				skills: mockSkills,
				supportiveAdultTypes: mockAdultTypes,
				helpMethods: mockHelpMethods,
				crisisResources: mockCrisisResources
			});

			expect(payload.supportiveAdults).toHaveLength(1);
			expect(payload.supportiveAdults[0]).toEqual({
				id: 'adult-type-1',
				type: 'Parent',
				name: 'Mom',
				contactInfo: '555-1234',
				isPrimary: true,
				displayOrder: 0
			});
		});

		it('includes custom supportive adults', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				customSupportiveAdults: [
					{
						id: 'custom-adult-1',
						label: 'Coach',
						name: 'Coach Smith',
						contactInfo: '555-5678',
						isPrimary: false
					}
				]
			};

			const payload = buildPlanPayload(draft, {
				skills: mockSkills,
				supportiveAdultTypes: mockAdultTypes,
				helpMethods: mockHelpMethods,
				crisisResources: mockCrisisResources
			});

			expect(payload.supportiveAdults).toHaveLength(1);
			expect(payload.supportiveAdults[0]).toEqual({
				id: 'custom-adult-1',
				type: 'Coach',
				name: 'Coach Smith',
				contactInfo: '555-5678',
				isPrimary: false,
				displayOrder: 0
			});
		});

		it('includes selected help methods', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				selectedHelpMethods: [{ helpMethodId: 'help-1', additionalInfo: 'Talk to Mom first' }]
			};

			const payload = buildPlanPayload(draft, {
				skills: mockSkills,
				supportiveAdultTypes: mockAdultTypes,
				helpMethods: mockHelpMethods,
				crisisResources: mockCrisisResources
			});

			expect(payload.helpMethods).toHaveLength(1);
			expect(payload.helpMethods[0]).toEqual({
				id: 'help-1',
				title: 'Talk to Someone',
				description: 'Find a trusted adult to talk to',
				additionalInfo: 'Talk to Mom first',
				displayOrder: 0
			});
		});

		it('includes all crisis resources', () => {
			const payload = buildPlanPayload(baseDraft, {
				skills: mockSkills,
				supportiveAdultTypes: mockAdultTypes,
				helpMethods: mockHelpMethods,
				crisisResources: mockCrisisResources
			});

			expect(payload.crisisResources).toHaveLength(1);
			expect(payload.crisisResources[0]).toEqual({
				id: 'crisis-1',
				name: '988 Suicide & Crisis Lifeline',
				contact: '988',
				contactType: 'phone',
				description: '24/7 crisis support',
				displayOrder: 0
			});
		});

		it('handles missing reference data gracefully', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				selectedSkills: [{ skillId: 'non-existent-skill' }]
			};

			const payload = buildPlanPayload(draft, {
				skills: mockSkills,
				supportiveAdultTypes: mockAdultTypes,
				helpMethods: mockHelpMethods,
				crisisResources: mockCrisisResources
			});

			// Non-existent skill should be skipped
			expect(payload.skills).toHaveLength(0);
		});
	});

	describe('buildJoinRecords', () => {
		const actionPlanId = 'plan-123';

		it('builds skill records for selected skills', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				selectedSkills: [{ skillId: 'skill-1', fillInValue: '5 breaths' }, { skillId: 'skill-2' }]
			};

			const { skillRecords } = buildJoinRecords(actionPlanId, draft);

			expect(skillRecords).toHaveLength(2);
			expect(skillRecords[0]).toEqual({
				action_plan_id: 'plan-123',
				skill_id: 'skill-1',
				additional_info: '5 breaths',
				is_custom: false,
				display_order: 0
			});
			expect(skillRecords[1]).toEqual({
				action_plan_id: 'plan-123',
				skill_id: 'skill-2',
				additional_info: null,
				is_custom: false,
				display_order: 1
			});
		});

		it('builds skill records for custom skills', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				customSkills: [{ id: 'custom-1', title: 'My Skill', category: 'creative' }]
			};

			const { skillRecords } = buildJoinRecords(actionPlanId, draft);

			expect(skillRecords).toHaveLength(1);
			expect(skillRecords[0]).toEqual({
				action_plan_id: 'plan-123',
				skill_id: null,
				additional_info: 'My Skill',
				is_custom: true,
				display_order: 0
			});
		});

		it('builds adult records for selected supportive adults', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				selectedSupportiveAdults: [
					{ typeId: 'adult-type-1', name: 'Mom', contactInfo: '555-1234', isPrimary: true }
				]
			};

			const { adultRecords } = buildJoinRecords(actionPlanId, draft);

			expect(adultRecords).toHaveLength(1);
			expect(adultRecords[0]).toEqual({
				action_plan_id: 'plan-123',
				supportive_adult_type_id: 'adult-type-1',
				name: 'Mom',
				contact_info: '555-1234',
				is_primary: true,
				is_custom: false,
				display_order: 0
			});
		});

		it('builds adult records for custom supportive adults', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				customSupportiveAdults: [
					{
						id: 'custom-1',
						label: 'Coach',
						name: 'Coach Smith',
						contactInfo: '555-5678',
						isPrimary: false
					}
				]
			};

			const { adultRecords } = buildJoinRecords(actionPlanId, draft);

			expect(adultRecords).toHaveLength(1);
			expect(adultRecords[0]).toEqual({
				action_plan_id: 'plan-123',
				supportive_adult_type_id: null,
				name: 'Coach Smith',
				contact_info: '555-5678',
				is_primary: false,
				is_custom: true,
				display_order: 0
			});
		});

		it('builds method records for selected help methods', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				selectedHelpMethods: [{ helpMethodId: 'help-1', additionalInfo: 'Talk to Mom' }]
			};

			const { methodRecords } = buildJoinRecords(actionPlanId, draft);

			expect(methodRecords).toHaveLength(1);
			expect(methodRecords[0]).toEqual({
				action_plan_id: 'plan-123',
				help_method_id: 'help-1',
				additional_info: 'Talk to Mom',
				is_custom: false,
				display_order: 0
			});
		});

		it('builds method records for custom help methods', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				customHelpMethods: [{ id: 'custom-1', title: 'Custom Method', additionalInfo: 'Details' }]
			};

			const { methodRecords } = buildJoinRecords(actionPlanId, draft);

			expect(methodRecords).toHaveLength(1);
			expect(methodRecords[0]).toEqual({
				action_plan_id: 'plan-123',
				help_method_id: null,
				additional_info: 'Details',
				is_custom: true,
				display_order: 0
			});
		});

		it('maintains correct display order across selected and custom items', () => {
			const draft: ActionPlanDraftData = {
				...baseDraft,
				selectedSkills: [{ skillId: 'skill-1' }, { skillId: 'skill-2' }],
				customSkills: [
					{ id: 'custom-1', title: 'Custom 1', category: 'mindfulness' },
					{ id: 'custom-2', title: 'Custom 2', category: 'physical' }
				]
			};

			const { skillRecords } = buildJoinRecords(actionPlanId, draft);

			expect(skillRecords).toHaveLength(4);
			expect(skillRecords.map((r) => r.display_order)).toEqual([0, 1, 2, 3]);
		});

		it('returns empty arrays for empty draft', () => {
			const { skillRecords, adultRecords, methodRecords } = buildJoinRecords(
				actionPlanId,
				baseDraft
			);

			expect(skillRecords).toHaveLength(0);
			expect(adultRecords).toHaveLength(0);
			expect(methodRecords).toHaveLength(0);
		});
	});
});
