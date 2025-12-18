import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import ReviewSection from './ReviewSection.svelte';

// Helper to create props with children snippet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createProps = (props: Record<string, unknown>) => props as any;

describe('ReviewSection', () => {
	it('renders the title', async () => {
		render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				children: () => null
			})
		);

		const title = page.getByText('Test Section');
		await expect.element(title).toBeInTheDocument();
	});

	it('renders badge text when provided', async () => {
		render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				badgeText: 'Green Zone',
				badgeColor: 'green',
				children: () => null
			})
		);

		const badge = page.getByText('Green Zone');
		await expect.element(badge).toBeInTheDocument();
	});

	it('renders item count when provided', async () => {
		render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				itemCount: 5,
				children: () => null
			})
		);

		const count = page.getByText('5 items');
		await expect.element(count).toBeInTheDocument();
	});

	it('renders singular item text for count of 1', async () => {
		render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				itemCount: 1,
				children: () => null
			})
		);

		const count = page.getByText('1 item');
		await expect.element(count).toBeInTheDocument();
	});

	it('shows edit button when onEdit is provided', async () => {
		const onEdit = vi.fn();
		const { container } = render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				onEdit,
				children: () => null
			})
		);

		const editButton = container.querySelector('.edit-btn');
		expect(editButton).not.toBeNull();
	});

	it('calls onEdit when edit button is clicked', async () => {
		const onEdit = vi.fn();
		const { container } = render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				onEdit,
				children: () => null
			})
		);

		const editButton = container.querySelector('.edit-btn') as HTMLButtonElement;
		expect(editButton).not.toBeNull();
		editButton.click();
		expect(onEdit).toHaveBeenCalledOnce();
	});

	it('is expanded by default', async () => {
		const { container } = render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				children: () => null
			})
		);

		const header = container.querySelector('[aria-expanded]');
		expect(header?.getAttribute('aria-expanded')).toBe('true');
	});

	it('can be collapsed by default when defaultExpanded is false', async () => {
		const { container } = render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				defaultExpanded: false,
				children: () => null
			})
		);

		const header = container.querySelector('[aria-expanded]');
		expect(header?.getAttribute('aria-expanded')).toBe('false');
	});

	it('toggles expanded state on header click', async () => {
		const { container } = render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				defaultExpanded: true,
				children: () => null
			})
		);

		const header = container.querySelector('.section-header') as HTMLElement;
		expect(header?.getAttribute('aria-expanded')).toBe('true');

		await userEvent.click(header);
		expect(header?.getAttribute('aria-expanded')).toBe('false');

		await userEvent.click(header);
		expect(header?.getAttribute('aria-expanded')).toBe('true');
	});

	it('has correct aria-controls attribute', async () => {
		const { container } = render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				children: () => null
			})
		);

		const header = container.querySelector('[aria-controls]');
		const ariaControls = header?.getAttribute('aria-controls');
		expect(ariaControls).toBe('review-section-test-section-content');
	});

	it('renders yellow zone badge correctly', async () => {
		render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				badgeText: 'Yellow Zone',
				badgeColor: 'yellow',
				children: () => null
			})
		);

		const badge = page.getByText('Yellow Zone');
		await expect.element(badge).toBeInTheDocument();
	});

	it('renders red zone badge correctly', async () => {
		render(
			ReviewSection,
			createProps({
				title: 'Test Section',
				badgeText: 'Red Zone',
				badgeColor: 'red',
				children: () => null
			})
		);

		const badge = page.getByText('Red Zone');
		await expect.element(badge).toBeInTheDocument();
	});
});
