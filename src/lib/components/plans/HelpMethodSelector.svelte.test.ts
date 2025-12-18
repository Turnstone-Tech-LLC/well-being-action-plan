import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import HelpMethodSelector from './HelpMethodSelector.svelte';
import type { HelpMethod } from '$lib/types/database';

const mockHelpMethod: HelpMethod = {
	id: 'method-1',
	organization_id: null,
	title: 'Help identifying and managing my emotions',
	description: 'Get support understanding your feelings',
	display_order: 1,
	is_active: true,
	created_at: '2024-01-01T00:00:00Z'
};

describe('HelpMethodSelector', () => {
	it('renders the help method title', async () => {
		render(HelpMethodSelector, {
			helpMethod: mockHelpMethod,
			isSelected: false,
			onToggle: vi.fn()
		});

		const title = page.getByText('Help identifying and managing my emotions');
		await expect.element(title).toBeInTheDocument();
	});

	it('renders the help method description', async () => {
		render(HelpMethodSelector, {
			helpMethod: mockHelpMethod,
			isSelected: false,
			onToggle: vi.fn()
		});

		const description = page.getByText('Get support understanding your feelings');
		await expect.element(description).toBeInTheDocument();
	});

	it('shows checkbox as unchecked when not selected', async () => {
		render(HelpMethodSelector, {
			helpMethod: mockHelpMethod,
			isSelected: false,
			onToggle: vi.fn()
		});

		const checkbox = page.getByRole('checkbox', { name: /Select Help identifying/i });
		await expect.element(checkbox).not.toBeChecked();
	});

	it('shows checkbox as checked when selected', async () => {
		render(HelpMethodSelector, {
			helpMethod: mockHelpMethod,
			isSelected: true,
			onToggle: vi.fn()
		});

		const checkbox = page.getByRole('checkbox', { name: /Select Help identifying/i });
		await expect.element(checkbox).toBeChecked();
	});

	it('calls onToggle when checkbox is clicked', async () => {
		const onToggle = vi.fn();

		render(HelpMethodSelector, {
			helpMethod: mockHelpMethod,
			isSelected: false,
			onToggle
		});

		const checkbox = page.getByRole('checkbox', { name: /Select Help identifying/i });
		await userEvent.click(checkbox);

		expect(onToggle).toHaveBeenCalledOnce();
	});

	it('shows additional info input when selected', async () => {
		render(HelpMethodSelector, {
			helpMethod: mockHelpMethod,
			isSelected: true,
			onToggle: vi.fn()
		});

		const additionalInfoInput = page.getByPlaceholder('Add specific details...');
		await expect.element(additionalInfoInput).toBeInTheDocument();
	});

	it('does not show additional info input when not selected', async () => {
		const { container } = render(HelpMethodSelector, {
			helpMethod: mockHelpMethod,
			isSelected: false,
			onToggle: vi.fn()
		});

		const additionalInfoInput = container.querySelector(
			'input[placeholder="Add specific details..."]'
		);
		expect(additionalInfoInput).toBeNull();
	});

	it('calls onAdditionalInfoChange when additional info is entered', async () => {
		const onAdditionalInfoChange = vi.fn();

		render(HelpMethodSelector, {
			helpMethod: mockHelpMethod,
			isSelected: true,
			onToggle: vi.fn(),
			onAdditionalInfoChange
		});

		const additionalInfoInput = page.getByPlaceholder('Add specific details...');
		await userEvent.type(additionalInfoInput, 'Need help with anxiety');

		expect(onAdditionalInfoChange).toHaveBeenCalled();
	});

	it('shows custom badge when isCustom is true', async () => {
		const customMethod = {
			id: 'custom-help-1',
			title: 'Help with school work'
		};

		const { container } = render(HelpMethodSelector, {
			helpMethod: customMethod,
			isSelected: true,
			isCustom: true,
			onToggle: vi.fn()
		});

		const customBadge = container.querySelector('.custom-badge');
		expect(customBadge).not.toBeNull();
		expect(customBadge?.textContent?.trim()).toBe('Custom');
	});

	it('shows remove button for custom methods', async () => {
		const customMethod = {
			id: 'custom-help-1',
			title: 'Help with school work'
		};

		const { container } = render(HelpMethodSelector, {
			helpMethod: customMethod,
			isSelected: true,
			isCustom: true,
			onToggle: vi.fn(),
			onRemoveCustom: vi.fn()
		});

		const removeBtn = container.querySelector('.remove-btn');
		expect(removeBtn).not.toBeNull();
		expect(removeBtn?.getAttribute('aria-label')).toContain('Remove custom help method');
	});

	it('calls onRemoveCustom when remove button is clicked', async () => {
		const customMethod = {
			id: 'custom-help-1',
			title: 'Help with school work'
		};
		const onRemoveCustom = vi.fn();

		const { container } = render(HelpMethodSelector, {
			helpMethod: customMethod,
			isSelected: true,
			isCustom: true,
			onToggle: vi.fn(),
			onRemoveCustom
		});

		const removeBtn = container.querySelector('button.remove-btn') as HTMLButtonElement;
		expect(removeBtn).not.toBeNull();
		removeBtn.click();

		expect(onRemoveCustom).toHaveBeenCalledOnce();
	});

	it('applies selected styling when selected', async () => {
		const { container } = render(HelpMethodSelector, {
			helpMethod: mockHelpMethod,
			isSelected: true,
			onToggle: vi.fn()
		});

		const selector = container.querySelector('.help-method-selector.selected');
		expect(selector).not.toBeNull();
	});

	it('applies custom styling when custom', async () => {
		const customMethod = {
			id: 'custom-help-1',
			title: 'Help with school work'
		};

		const { container } = render(HelpMethodSelector, {
			helpMethod: customMethod,
			isSelected: true,
			isCustom: true,
			onToggle: vi.fn()
		});

		const selector = container.querySelector('.help-method-selector.custom.selected');
		expect(selector).not.toBeNull();
	});
});
