import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import DataManagement from './DataManagement.svelte';

// Mock the modules
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$lib/db', () => ({
	clearAllData: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$lib/stores/localPlan', () => ({
	localPlanStore: {
		reset: vi.fn()
	}
}));

vi.mock('$lib/stores/patientProfile', () => ({
	patientProfileStore: {
		reset: vi.fn()
	}
}));

vi.mock('$lib/stores/toast', () => ({
	toastStore: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn()
	}
}));

describe('DataManagement', () => {
	it('renders section heading', async () => {
		render(DataManagement);

		const heading = page.getByRole('heading', { name: 'Data Management' });
		await expect.element(heading).toBeInTheDocument();
	});

	it('renders Export My Data option', async () => {
		render(DataManagement);

		const exportLabel = page.getByText('Export My Data');
		await expect.element(exportLabel).toBeInTheDocument();
	});

	it('renders Export button', async () => {
		render(DataManagement);

		const exportButton = page.getByRole('button', { name: /Export/i });
		await expect.element(exportButton).toBeInTheDocument();
	});

	it('renders Clear All Data option', async () => {
		render(DataManagement);

		const clearLabel = page.getByText('Clear All Data');
		await expect.element(clearLabel).toBeInTheDocument();
	});

	it('renders Clear button', async () => {
		render(DataManagement);

		const clearButton = page.getByRole('button', { name: /Clear/i });
		await expect.element(clearButton).toBeInTheDocument();
	});

	it('renders privacy note', async () => {
		render(DataManagement);

		const note = page.getByText(
			'Your data is stored only on this device and is never sent to any server.'
		);
		await expect.element(note).toBeInTheDocument();
	});

	it('shows export description', async () => {
		render(DataManagement);

		const description = page.getByText('Download a copy of all your check-ins and settings');
		await expect.element(description).toBeInTheDocument();
	});

	it('shows clear description', async () => {
		render(DataManagement);

		const description = page.getByText('Remove your action plan from this device');
		await expect.element(description).toBeInTheDocument();
	});

	it('has aria-labelledby on section', async () => {
		const { container } = render(DataManagement);

		const section = container.querySelector('section[aria-labelledby="data-heading"]');
		expect(section).not.toBeNull();
	});
});
