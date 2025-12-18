import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import ReviewStep from './ReviewStep.svelte';
import type { Skill, SupportiveAdultType, HelpMethod, CrisisResource } from '$lib/types/database';

// Mock data
const mockSkills: Skill[] = [
	{
		id: 'skill-1',
		organization_id: null,
		title: 'Deep Breathing',
		category: 'mindfulness',
		has_fill_in: false,
		fill_in_prompt: null,
		display_order: 1,
		is_active: true,
		created_at: '2024-01-01'
	},
	{
		id: 'skill-2',
		organization_id: null,
		title: 'Listening to Music',
		category: 'creative',
		has_fill_in: true,
		fill_in_prompt: 'What kind?',
		display_order: 2,
		is_active: true,
		created_at: '2024-01-01'
	}
];

const mockSupportiveAdultTypes: SupportiveAdultType[] = [
	{
		id: 'adult-type-1',
		organization_id: null,
		label: 'Parent',
		has_fill_in: true,
		display_order: 1,
		is_active: true,
		created_at: '2024-01-01'
	}
];

const mockHelpMethods: HelpMethod[] = [
	{
		id: 'help-1',
		organization_id: null,
		title: 'Talk to someone',
		description: 'Have a conversation',
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
		description: '24/7 support',
		display_order: 1,
		is_active: true,
		created_at: '2024-01-01'
	}
];

const defaultProps = {
	patientNickname: 'John',
	skills: mockSkills,
	selectedSkills: [],
	customSkills: [],
	happyWhen: '',
	happyBecause: '',
	supportiveAdultTypes: mockSupportiveAdultTypes,
	selectedSupportiveAdults: [],
	customSupportiveAdults: [],
	helpMethods: mockHelpMethods,
	selectedHelpMethods: [],
	customHelpMethods: [],
	crisisResources: mockCrisisResources,
	isSubmitting: false,
	onBack: vi.fn(),
	onEditStep: vi.fn(),
	onCreatePlan: vi.fn()
};

describe('ReviewStep', () => {
	it('renders the review title', async () => {
		render(ReviewStep, defaultProps);
		const title = page.getByText('Review Your Action Plan');
		await expect.element(title).toBeInTheDocument();
	});

	it('displays patient nickname in description', async () => {
		render(ReviewStep, defaultProps);
		const nickname = page.getByText(/John/);
		await expect.element(nickname).toBeInTheDocument();
	});

	it('shows selected skills', async () => {
		render(ReviewStep, {
			...defaultProps,
			selectedSkills: [{ skillId: 'skill-1' }]
		});
		const skill = page.getByText('Deep Breathing');
		await expect.element(skill).toBeInTheDocument();
	});

	it('shows skill fill-in value when provided', async () => {
		render(ReviewStep, {
			...defaultProps,
			selectedSkills: [{ skillId: 'skill-2', fillInValue: 'Classical music' }]
		});
		const fillIn = page.getByText('"Classical music"');
		await expect.element(fillIn).toBeInTheDocument();
	});

	it('shows custom skills', async () => {
		render(ReviewStep, {
			...defaultProps,
			customSkills: [{ id: 'custom-1', title: 'My Custom Skill', category: 'physical' }]
		});
		const customSkill = page.getByText('My Custom Skill');
		await expect.element(customSkill).toBeInTheDocument();
	});

	it('shows supportive adults', async () => {
		render(ReviewStep, {
			...defaultProps,
			selectedSupportiveAdults: [
				{ typeId: 'adult-type-1', name: 'Mom', contactInfo: '555-1234', isPrimary: true }
			]
		});
		const name = page.getByText('Mom');
		const contact = page.getByText('555-1234');
		await expect.element(name).toBeInTheDocument();
		await expect.element(contact).toBeInTheDocument();
	});

	it('shows primary badge for primary supportive adult', async () => {
		render(ReviewStep, {
			...defaultProps,
			selectedSupportiveAdults: [{ typeId: 'adult-type-1', name: 'Mom', isPrimary: true }]
		});
		const primaryBadge = page.getByText('Primary');
		await expect.element(primaryBadge).toBeInTheDocument();
	});

	it('shows selected help methods', async () => {
		render(ReviewStep, {
			...defaultProps,
			selectedHelpMethods: [{ helpMethodId: 'help-1' }]
		});
		const method = page.getByText('Talk to someone');
		await expect.element(method).toBeInTheDocument();
	});

	it('shows crisis resources', async () => {
		render(ReviewStep, defaultProps);
		const resourceName = page.getByText('988 Suicide & Crisis Lifeline');
		await expect.element(resourceName).toBeInTheDocument();
	});

	it('shows reflective questions when provided', async () => {
		render(ReviewStep, {
			...defaultProps,
			happyWhen: 'Playing with my dog',
			happyBecause: 'I feel calm and relaxed'
		});
		const happyWhen = page.getByText('Playing with my dog');
		const happyBecause = page.getByText('I feel calm and relaxed');
		await expect.element(happyWhen).toBeInTheDocument();
		await expect.element(happyBecause).toBeInTheDocument();
	});

	it('shows empty state when no skills selected', async () => {
		render(ReviewStep, defaultProps);
		const emptyState = page.getByText('No coping skills selected.');
		await expect.element(emptyState).toBeInTheDocument();
	});

	it('shows empty state when no supportive adults selected', async () => {
		render(ReviewStep, defaultProps);
		const emptyState = page.getByText('No supportive adults selected.');
		await expect.element(emptyState).toBeInTheDocument();
	});

	it('shows empty state when no help methods selected', async () => {
		render(ReviewStep, defaultProps);
		const emptyState = page.getByText('No help methods selected.');
		await expect.element(emptyState).toBeInTheDocument();
	});

	it('calls onBack when Back button is clicked', async () => {
		const onBack = vi.fn();
		render(ReviewStep, { ...defaultProps, onBack });

		const backButton = page.getByRole('button', { name: /back/i });
		await userEvent.click(backButton);
		expect(onBack).toHaveBeenCalledOnce();
	});

	it('calls onCreatePlan when Create Action Plan button is clicked', async () => {
		const onCreatePlan = vi.fn();
		render(ReviewStep, { ...defaultProps, onCreatePlan });

		const createButton = page.getByRole('button', { name: /create action plan/i });
		await userEvent.click(createButton);
		expect(onCreatePlan).toHaveBeenCalledOnce();
	});

	it('disables buttons when isSubmitting is true', async () => {
		const { container } = render(ReviewStep, { ...defaultProps, isSubmitting: true });

		const buttons = container.querySelectorAll('.step-actions button');
		const backButton = buttons[0] as HTMLButtonElement;
		const createButton = buttons[1] as HTMLButtonElement;

		expect(backButton?.disabled).toBe(true);
		expect(createButton?.disabled).toBe(true);
	});

	it('shows "Creating..." text when isSubmitting is true', async () => {
		render(ReviewStep, { ...defaultProps, isSubmitting: true });
		const creatingText = page.getByText('Creating...');
		await expect.element(creatingText).toBeInTheDocument();
	});

	it('shows item counts in section headers', async () => {
		render(ReviewStep, {
			...defaultProps,
			selectedSkills: [{ skillId: 'skill-1' }, { skillId: 'skill-2' }]
		});
		const count = page.getByText('2 items');
		await expect.element(count).toBeInTheDocument();
	});

	it('shows zone badges', async () => {
		const { container } = render(ReviewStep, defaultProps);
		// Check that zone badges exist (they appear as badges within sections)
		const greenBadge = container.querySelector('.zone-badge-green');
		const yellowBadge = container.querySelector('.zone-badge-yellow');
		const redBadge = container.querySelector('.zone-badge-red');

		expect(greenBadge).not.toBeNull();
		expect(yellowBadge).not.toBeNull();
		expect(redBadge).not.toBeNull();
	});
});
