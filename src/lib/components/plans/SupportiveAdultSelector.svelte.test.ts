import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import SupportiveAdultSelector from './SupportiveAdultSelector.svelte';
import type { SupportiveAdultType } from '$lib/types/database';

const mockAdultType: SupportiveAdultType = {
	id: 'type-1',
	organization_id: null,
	label: 'Parent/guardian',
	has_fill_in: true,
	display_order: 1,
	is_active: true,
	created_at: '2024-01-01T00:00:00Z'
};

describe('SupportiveAdultSelector', () => {
	it('renders the adult type label', async () => {
		render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: false,
			name: '',
			isPrimary: false,
			onToggle: vi.fn()
		});

		const label = page.getByText('Parent/guardian');
		await expect.element(label).toBeInTheDocument();
	});

	it('shows checkbox as unchecked when not selected', async () => {
		render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: false,
			name: '',
			isPrimary: false,
			onToggle: vi.fn()
		});

		const checkbox = page.getByRole('checkbox', { name: /Select Parent\/guardian/i });
		await expect.element(checkbox).not.toBeChecked();
	});

	it('shows checkbox as checked when selected', async () => {
		render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: true,
			name: 'John Doe',
			isPrimary: false,
			onToggle: vi.fn()
		});

		const checkbox = page.getByRole('checkbox', { name: /Select Parent\/guardian/i });
		await expect.element(checkbox).toBeChecked();
	});

	it('calls onToggle when checkbox is clicked', async () => {
		const onToggle = vi.fn();

		render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: false,
			name: '',
			isPrimary: false,
			onToggle
		});

		const checkbox = page.getByRole('checkbox', { name: /Select Parent\/guardian/i });
		await userEvent.click(checkbox);

		expect(onToggle).toHaveBeenCalledOnce();
	});

	it('shows name input when selected', async () => {
		render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: true,
			name: '',
			isPrimary: false,
			onToggle: vi.fn()
		});

		const nameInput = page.getByPlaceholder('Enter name...');
		await expect.element(nameInput).toBeInTheDocument();
	});

	it('does not show name input when not selected', async () => {
		const { container } = render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: false,
			name: '',
			isPrimary: false,
			onToggle: vi.fn()
		});

		const nameInput = container.querySelector('input[placeholder="Enter name..."]');
		expect(nameInput).toBeNull();
	});

	it('calls onNameChange when name is entered', async () => {
		const onNameChange = vi.fn();

		render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: true,
			name: '',
			isPrimary: false,
			onToggle: vi.fn(),
			onNameChange
		});

		const nameInput = page.getByPlaceholder('Enter name...');
		await userEvent.type(nameInput, 'John Doe');

		expect(onNameChange).toHaveBeenCalled();
	});

	it('shows contact info input when selected', async () => {
		render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: true,
			name: '',
			isPrimary: false,
			onToggle: vi.fn()
		});

		const contactInput = page.getByPlaceholder('Phone or email...');
		await expect.element(contactInput).toBeInTheDocument();
	});

	it('shows primary toggle when selected', async () => {
		render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: true,
			name: 'John Doe',
			isPrimary: false,
			onToggle: vi.fn()
		});

		const primaryLabel = page.getByText('Mark as primary supportive adult');
		await expect.element(primaryLabel).toBeInTheDocument();
	});

	it('shows primary badge when isPrimary is true', async () => {
		const { container } = render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: true,
			name: 'John Doe',
			isPrimary: true,
			onToggle: vi.fn()
		});

		const primaryBadge = container.querySelector('.primary-badge');
		expect(primaryBadge).not.toBeNull();
		expect(primaryBadge?.textContent?.trim()).toBe('Primary');
	});

	it('calls onPrimaryChange when primary checkbox is clicked', async () => {
		const onPrimaryChange = vi.fn();

		render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: true,
			name: 'John Doe',
			isPrimary: false,
			onToggle: vi.fn(),
			onPrimaryChange
		});

		const primaryCheckbox = page.getByRole('checkbox', { name: /Mark as primary/i });
		await userEvent.click(primaryCheckbox);

		expect(onPrimaryChange).toHaveBeenCalledOnce();
	});

	it('shows custom badge when isCustom is true', async () => {
		const customAdult = {
			id: 'custom-adult-1',
			label: 'Aunt',
			name: 'Jane',
			isPrimary: false
		};

		const { container } = render(SupportiveAdultSelector, {
			adultType: customAdult,
			isSelected: true,
			name: 'Jane',
			isPrimary: false,
			isCustom: true,
			onToggle: vi.fn()
		});

		const customBadge = container.querySelector('.custom-badge');
		expect(customBadge).not.toBeNull();
		expect(customBadge?.textContent?.trim()).toBe('Custom');
	});

	it('shows remove button for custom adults', async () => {
		const customAdult = {
			id: 'custom-adult-1',
			label: 'Aunt',
			name: 'Jane',
			isPrimary: false
		};

		const { container } = render(SupportiveAdultSelector, {
			adultType: customAdult,
			isSelected: true,
			name: 'Jane',
			isPrimary: false,
			isCustom: true,
			onToggle: vi.fn(),
			onRemoveCustom: vi.fn()
		});

		const removeBtn = container.querySelector('.remove-btn');
		expect(removeBtn).not.toBeNull();
		expect(removeBtn?.getAttribute('aria-label')).toContain('Remove custom adult');
	});

	it('calls onRemoveCustom when remove button is clicked', async () => {
		const customAdult = {
			id: 'custom-adult-1',
			label: 'Aunt',
			name: 'Jane',
			isPrimary: false
		};
		const onRemoveCustom = vi.fn();

		const { container } = render(SupportiveAdultSelector, {
			adultType: customAdult,
			isSelected: true,
			name: 'Jane',
			isPrimary: false,
			isCustom: true,
			onToggle: vi.fn(),
			onRemoveCustom
		});

		// Use container query to find the specific button element
		const removeBtn = container.querySelector('button.remove-btn') as HTMLButtonElement;
		expect(removeBtn).not.toBeNull();
		removeBtn.click();

		expect(onRemoveCustom).toHaveBeenCalledOnce();
	});

	it('applies selected styling when selected', async () => {
		const { container } = render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: true,
			name: 'John Doe',
			isPrimary: false,
			onToggle: vi.fn()
		});

		const selector = container.querySelector('.adult-selector.selected');
		expect(selector).not.toBeNull();
	});

	it('applies primary styling when primary', async () => {
		const { container } = render(SupportiveAdultSelector, {
			adultType: mockAdultType,
			isSelected: true,
			name: 'John Doe',
			isPrimary: true,
			onToggle: vi.fn()
		});

		const selector = container.querySelector('.adult-selector.primary.selected');
		expect(selector).not.toBeNull();
	});
});
