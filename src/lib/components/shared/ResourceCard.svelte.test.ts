import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import ResourceCard from './ResourceCard.svelte';

describe('ResourceCard', () => {
	it('renders title correctly', async () => {
		render(ResourceCard, {
			title: 'Test Resource',
			isCustom: false,
			canModify: false
		});

		const title = page.getByRole('heading', { name: 'Test Resource' });
		await expect.element(title).toBeInTheDocument();
	});

	it('shows Standard badge when not custom', async () => {
		const { container } = render(ResourceCard, {
			title: 'Test Item',
			isCustom: false,
			canModify: false
		});

		const badge = container.querySelector('.source-indicator.standard');
		expect(badge).not.toBeNull();
		expect(badge?.textContent?.trim()).toBe('Standard');
	});

	it('shows Custom badge when custom', async () => {
		const { container } = render(ResourceCard, {
			title: 'Test Item',
			isCustom: true,
			canModify: false
		});

		const badge = container.querySelector('.source-indicator.custom');
		expect(badge).not.toBeNull();
		expect(badge?.textContent?.trim()).toBe('Custom');
	});

	it('shows edit and delete buttons when canModify is true', async () => {
		render(ResourceCard, {
			title: 'Test Item',
			isCustom: true,
			canModify: true
		});

		const editBtn = page.getByRole('button', { name: 'Edit Test Item' });
		const deleteBtn = page.getByRole('button', { name: 'Delete Test Item' });

		await expect.element(editBtn).toBeInTheDocument();
		await expect.element(deleteBtn).toBeInTheDocument();
	});

	it('hides edit and delete buttons when canModify is false', async () => {
		const { container } = render(ResourceCard, {
			title: 'Non-editable Item',
			isCustom: false,
			canModify: false
		});

		const actionBtns = container.querySelectorAll('.action-btn');
		expect(actionBtns.length).toBe(0);
	});

	it('calls onEdit when edit button is clicked', async () => {
		const onEdit = vi.fn();

		render(ResourceCard, {
			title: 'Editable Item',
			isCustom: true,
			canModify: true,
			onEdit
		});

		const editBtn = page.getByRole('button', { name: /Edit Editable Item/i });
		await userEvent.click(editBtn);

		expect(onEdit).toHaveBeenCalledOnce();
	});

	it('calls onDelete when delete button is clicked', async () => {
		const onDelete = vi.fn();

		render(ResourceCard, {
			title: 'Deletable Item',
			isCustom: true,
			canModify: true,
			onDelete
		});

		const deleteBtn = page.getByRole('button', { name: /Delete Deletable Item/i });
		await userEvent.click(deleteBtn);

		expect(onDelete).toHaveBeenCalledOnce();
	});

	it('applies correct accent color for custom card', async () => {
		const { container } = render(ResourceCard, {
			title: 'Custom Item',
			isCustom: true,
			canModify: false,
			accentColor: 'var(--color-primary)'
		});

		const card = container.querySelector('.resource-card.custom');
		expect(card).not.toBeNull();
	});

	it('has proper accessibility attributes on buttons', async () => {
		render(ResourceCard, {
			title: 'Accessible Item',
			isCustom: true,
			canModify: true
		});

		const editBtn = page.getByRole('button', { name: 'Edit Accessible Item' });
		const deleteBtn = page.getByRole('button', { name: 'Delete Accessible Item' });

		await expect.element(editBtn).toHaveAttribute('aria-label', 'Edit Accessible Item');
		await expect.element(deleteBtn).toHaveAttribute('aria-label', 'Delete Accessible Item');
	});
});
