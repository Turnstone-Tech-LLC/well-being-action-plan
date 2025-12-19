import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import ProfileSection from './ProfileSection.svelte';

// Mock the stores
vi.mock('$lib/stores/patientProfile', () => ({
	patientProfileStore: {
		updateDisplayName: vi.fn().mockResolvedValue(undefined)
	}
}));

vi.mock('$lib/stores/toast', () => ({
	toastStore: {
		success: vi.fn(),
		error: vi.fn()
	}
}));

describe('ProfileSection', () => {
	it('renders section heading', async () => {
		render(ProfileSection, {
			displayName: 'Test User',
			actionPlanId: 'test-plan-123'
		});

		const heading = page.getByRole('heading', { name: 'Profile' });
		await expect.element(heading).toBeInTheDocument();
	});

	it('displays the current display name', async () => {
		render(ProfileSection, {
			displayName: 'Test User',
			actionPlanId: 'test-plan-123'
		});

		const valueElement = page.getByText('Test User');
		await expect.element(valueElement).toBeInTheDocument();
	});

	it('shows "Not set" when displayName is empty', async () => {
		render(ProfileSection, {
			displayName: '',
			actionPlanId: 'test-plan-123'
		});

		const notSetText = page.getByText('Not set');
		await expect.element(notSetText).toBeInTheDocument();
	});

	it('renders Edit button', async () => {
		render(ProfileSection, {
			displayName: 'Test User',
			actionPlanId: 'test-plan-123'
		});

		const editButton = page.getByRole('button', { name: 'Edit' });
		await expect.element(editButton).toBeInTheDocument();
	});

	it('enters edit mode when Edit button is clicked', async () => {
		render(ProfileSection, {
			displayName: 'Test User',
			actionPlanId: 'test-plan-123'
		});

		const editButton = page.getByRole('button', { name: 'Edit' });
		await userEvent.click(editButton);

		// Should now show Cancel and Save buttons
		const cancelButton = page.getByRole('button', { name: 'Cancel' });
		const saveButton = page.getByRole('button', { name: 'Save' });

		await expect.element(cancelButton).toBeInTheDocument();
		await expect.element(saveButton).toBeInTheDocument();
	});

	it('shows input field in edit mode with current name', async () => {
		render(ProfileSection, {
			displayName: 'Test User',
			actionPlanId: 'test-plan-123'
		});

		const editButton = page.getByRole('button', { name: 'Edit' });
		await userEvent.click(editButton);

		const input = page.getByRole('textbox');
		await expect.element(input).toBeInTheDocument();
		await expect.element(input).toHaveValue('Test User');
	});

	it('exits edit mode when Cancel is clicked', async () => {
		render(ProfileSection, {
			displayName: 'Test User',
			actionPlanId: 'test-plan-123'
		});

		const editButton = page.getByRole('button', { name: 'Edit' });
		await userEvent.click(editButton);

		const cancelButton = page.getByRole('button', { name: 'Cancel' });
		await userEvent.click(cancelButton);

		// Should show Edit button again
		const editButtonAgain = page.getByRole('button', { name: 'Edit' });
		await expect.element(editButtonAgain).toBeInTheDocument();
	});

	it('shows error when trying to save empty name', async () => {
		render(ProfileSection, {
			displayName: 'Test User',
			actionPlanId: 'test-plan-123'
		});

		const editButton = page.getByRole('button', { name: 'Edit' });
		await userEvent.click(editButton);

		const input = page.getByRole('textbox');
		await userEvent.clear(input);

		const saveButton = page.getByRole('button', { name: 'Save' });
		await userEvent.click(saveButton);

		// Should show error message
		const errorMessage = page.getByText('Please enter a display name');
		await expect.element(errorMessage).toBeInTheDocument();
	});

	it('shows error when name is too short', async () => {
		render(ProfileSection, {
			displayName: 'Test User',
			actionPlanId: 'test-plan-123'
		});

		const editButton = page.getByRole('button', { name: 'Edit' });
		await userEvent.click(editButton);

		const input = page.getByRole('textbox');
		await userEvent.clear(input);
		await userEvent.type(input, 'A');

		const saveButton = page.getByRole('button', { name: 'Save' });
		await userEvent.click(saveButton);

		// Should show error message
		const errorMessage = page.getByText('Name must be at least 2 characters');
		await expect.element(errorMessage).toBeInTheDocument();
	});

	it('has proper accessibility attributes on input', async () => {
		render(ProfileSection, {
			displayName: 'Test User',
			actionPlanId: 'test-plan-123'
		});

		const editButton = page.getByRole('button', { name: 'Edit' });
		await userEvent.click(editButton);

		const input = page.getByRole('textbox');
		const label = page.getByText('Display Name');

		await expect.element(input).toBeInTheDocument();
		await expect.element(label).toBeInTheDocument();
	});

	it('has aria-labelledby on section', async () => {
		const { container } = render(ProfileSection, {
			displayName: 'Test User',
			actionPlanId: 'test-plan-123'
		});

		const section = container.querySelector('section[aria-labelledby="profile-heading"]');
		expect(section).not.toBeNull();
	});
});
