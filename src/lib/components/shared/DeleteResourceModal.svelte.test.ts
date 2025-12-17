import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import DeleteResourceModal from './DeleteResourceModal.svelte';

describe('DeleteResourceModal', () => {
	it('does not render when closed', async () => {
		const { container } = render(DeleteResourceModal, {
			open: false,
			itemName: 'Test Item',
			onCancel: vi.fn()
		});

		const dialog = container.querySelector('[role="dialog"]');
		expect(dialog).toBeNull();
	});

	it('renders when open', async () => {
		render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			onCancel: vi.fn()
		});

		const dialog = page.getByRole('dialog');
		await expect.element(dialog).toBeInTheDocument();
	});

	it('displays item name in confirmation message', async () => {
		render(DeleteResourceModal, {
			open: true,
			itemName: 'My Skill',
			onCancel: vi.fn()
		});

		const message = page.getByText(/Are you sure you want to delete/);
		await expect.element(message).toBeInTheDocument();

		const itemName = page.getByText(/My Skill/);
		await expect.element(itemName).toBeInTheDocument();
	});

	it('displays custom title', async () => {
		render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			title: 'Delete this skill?',
			onCancel: vi.fn()
		});

		const title = page.getByRole('heading', { name: 'Delete this skill?' });
		await expect.element(title).toBeInTheDocument();
	});

	it('calls onCancel when Cancel button is clicked', async () => {
		const onCancel = vi.fn();

		render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			onCancel
		});

		const cancelBtn = page.getByRole('button', { name: 'Cancel' });
		await userEvent.click(cancelBtn);

		expect(onCancel).toHaveBeenCalledOnce();
	});

	it('calls onConfirm when Delete button is clicked', async () => {
		const onConfirm = vi.fn();

		render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			onCancel: vi.fn(),
			onConfirm
		});

		const deleteBtn = page.getByRole('button', { name: 'Delete' });
		await userEvent.click(deleteBtn);

		expect(onConfirm).toHaveBeenCalledOnce();
	});

	it('shows loading state when loading is true', async () => {
		render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			loading: true,
			onCancel: vi.fn()
		});

		const loadingText = page.getByText('Deleting...');
		await expect.element(loadingText).toBeInTheDocument();
	});

	it('disables buttons when loading', async () => {
		render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			loading: true,
			onCancel: vi.fn()
		});

		const cancelBtn = page.getByRole('button', { name: 'Cancel' });
		await expect.element(cancelBtn).toBeDisabled();
	});

	it('displays error message when error is provided', async () => {
		render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			error: 'Could not delete item',
			onCancel: vi.fn()
		});

		const errorMsg = page.getByRole('alert');
		await expect.element(errorMsg).toBeInTheDocument();
		await expect.element(errorMsg).toHaveTextContent('Could not delete item');
	});

	it('shows warning message when item is in use', async () => {
		render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			isInUse: true,
			usageMessage: 'This item is being used.',
			onCancel: vi.fn()
		});

		const warningMsg = page.getByRole('alert');
		await expect.element(warningMsg).toHaveTextContent('This item is being used.');
	});

	it('shows Close button instead of Cancel when item is in use', async () => {
		const { container } = render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			isInUse: true,
			onCancel: vi.fn()
		});

		const closeBtn = page.getByRole('button', { name: 'Close' });
		await expect.element(closeBtn).toBeInTheDocument();

		const cancelBtn = container.querySelector('button[name="Cancel"]');
		expect(cancelBtn).toBeNull();
	});

	it('hides Delete button when item is in use', async () => {
		const { container } = render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			isInUse: true,
			onCancel: vi.fn()
		});

		const btns = container.querySelectorAll('.btn-destructive');
		expect(btns.length).toBe(0);
	});

	it('has proper ARIA attributes for dialog', async () => {
		render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			onCancel: vi.fn()
		});

		const dialog = page.getByRole('dialog');
		await expect.element(dialog).toHaveAttribute('aria-modal', 'true');
		await expect.element(dialog).toHaveAttribute('aria-labelledby', 'delete-modal-title');
		await expect.element(dialog).toHaveAttribute('aria-describedby', 'delete-modal-description');
	});

	it('shows warning icon when showWarningIcon is true and not isInUse', async () => {
		const { container } = render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			showWarningIcon: true,
			onCancel: vi.fn()
		});

		const warningIcon = container.querySelector('.modal-icon');
		expect(warningIcon).not.toBeNull();
	});

	it('centers content when centered is true', async () => {
		const { container } = render(DeleteResourceModal, {
			open: true,
			itemName: 'Test Item',
			centered: true,
			onCancel: vi.fn()
		});

		const modal = container.querySelector('.modal.centered');
		expect(modal).not.toBeNull();
	});
});
