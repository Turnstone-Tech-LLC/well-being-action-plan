import { expect, test } from '@playwright/test';
import {
	seedPlanViaApp,
	clearDataViaApp,
	waitForTestHelpers,
	seedCheckInsViaApp
} from '../utils/test-helpers';

/**
 * Patient Reports Tests
 *
 * Tests the patient reports page including:
 * - Viewing check-in history
 * - Three-view architecture (Journey, Summary, History)
 * - Statistics and filtering
 *
 * Uses the app's Dexie instance via test helpers to properly seed data.
 */

const TEST_MODE_URL = '/?__test_mode=true';

test.describe('Patient Reports', () => {
	test.beforeEach(async ({ page }) => {
		// Initialize test mode
		await page.goto(TEST_MODE_URL);
		await waitForTestHelpers(page, 10000);
		await clearDataViaApp(page);
	});

	test.describe('Access Control', () => {
		test('reports page redirects to home without local plan', async ({ page }) => {
			await page.goto('/app/reports');

			// Should redirect to home when no plan exists
			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});

		test('reports page accessible with local plan', async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });

			// Navigate through dashboard to reports
			await page.goto('/app');
			await page.waitForTimeout(300);
			await page.getByRole('link', { name: /reports/i }).click();
			await page.waitForURL(/\/app\/reports/);

			await expect(page).toHaveURL(/\/app\/reports/);
		});
	});

	test.describe('Page Structure', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			// Navigate through dashboard to reports
			await page.goto('/app');
			await page.waitForTimeout(300);
			await page.getByRole('link', { name: /reports/i }).click();
			await page.waitForURL(/\/app\/reports/);
		});

		test('displays reports page heading', async ({ page }) => {
			await expect(page.getByRole('heading', { name: /my reports/i })).toBeVisible();
		});

		test('has breadcrumb navigation', async ({ page }) => {
			await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
		});

		test('has view tabs', async ({ page }) => {
			await expect(page.getByRole('tab', { name: /my journey/i })).toBeVisible();
			await expect(page.getByRole('tab', { name: /summary/i })).toBeVisible();
			await expect(page.getByRole('tab', { name: /history/i })).toBeVisible();
		});
	});

	test.describe('Empty State', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			// Navigate through dashboard to reports
			await page.goto('/app');
			await page.waitForTimeout(300);
			await page.getByRole('link', { name: /reports/i }).click();
			await page.waitForURL(/\/app\/reports/);
		});

		test('shows empty state when no check-ins in summary view', async ({ page }) => {
			// Click on Summary tab
			await page.getByRole('tab', { name: /summary/i }).click();
			// Should show the empty state message
			await expect(page.getByText(/start tracking/i)).toBeVisible();
		});
	});

	test.describe('With Check-in Data', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			// Seed several check-ins
			const now = Date.now();
			await seedCheckInsViaApp(page, [
				{ zone: 'green', createdAt: new Date(now) },
				{ zone: 'green', createdAt: new Date(now - 24 * 60 * 60 * 1000) },
				{ zone: 'yellow', createdAt: new Date(now - 48 * 60 * 60 * 1000) },
				{ zone: 'green', createdAt: new Date(now - 72 * 60 * 60 * 1000) },
				{ zone: 'red', createdAt: new Date(now - 96 * 60 * 60 * 1000) }
			]);
			// Navigate through dashboard to reports
			await page.goto('/app');
			await page.waitForTimeout(300);
			await page.getByRole('link', { name: /reports/i }).click();
			await page.waitForURL(/\/app\/reports/);
		});

		test('displays reports page heading', async ({ page }) => {
			await expect(page.getByRole('heading', { name: /my reports/i })).toBeVisible();
		});

		test('shows history view with check-ins', async ({ page }) => {
			// Click on History tab
			await page.getByRole('tab', { name: /history/i }).click();
			// Should have heading for check-in history
			await expect(page.getByRole('heading', { name: /check-in history/i })).toBeVisible();
		});
	});

	test.describe('View Tabs', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			const now = Date.now();
			await seedCheckInsViaApp(page, [
				{ zone: 'green', createdAt: new Date(now) },
				{ zone: 'yellow', createdAt: new Date(now - 24 * 60 * 60 * 1000) }
			]);
			// Navigate through dashboard to reports
			await page.goto('/app');
			await page.waitForTimeout(300);
			await page.getByRole('link', { name: /reports/i }).click();
			await page.waitForURL(/\/app\/reports/);
		});

		test('journey tab is default active', async ({ page }) => {
			const journeyTab = page.getByRole('tab', { name: /my journey/i });
			await expect(journeyTab).toHaveAttribute('aria-selected', 'true');
		});

		test('can switch to summary tab', async ({ page }) => {
			await page.getByRole('tab', { name: /summary/i }).click();
			const summaryTab = page.getByRole('tab', { name: /summary/i });
			await expect(summaryTab).toHaveAttribute('aria-selected', 'true');
		});

		test('can switch to history tab', async ({ page }) => {
			await page.getByRole('tab', { name: /history/i }).click();
			const historyTab = page.getByRole('tab', { name: /history/i });
			await expect(historyTab).toHaveAttribute('aria-selected', 'true');
		});
	});

	test.describe('Navigation', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			// Navigate through dashboard to reports
			await page.goto('/app');
			await page.waitForTimeout(300);
			await page.getByRole('link', { name: /reports/i }).click();
			await page.waitForURL(/\/app\/reports/);
		});

		test('breadcrumb links to dashboard', async ({ page }) => {
			await page.getByRole('link', { name: /dashboard/i }).click();

			await expect(page).toHaveURL(/\/app$/);
		});
	});

	test.describe('Export Options', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			const now = Date.now();
			await seedCheckInsViaApp(page, [{ zone: 'green', createdAt: new Date(now) }]);
			// Navigate through dashboard to reports
			await page.goto('/app');
			await page.waitForTimeout(300);
			await page.getByRole('link', { name: /reports/i }).click();
			await page.waitForURL(/\/app\/reports/);
		});

		test('shows share with provider section', async ({ page }) => {
			await expect(page.getByText(/share with your provider/i)).toBeVisible();
		});

		test('has create provider report button', async ({ page }) => {
			await expect(page.getByRole('button', { name: /create provider report/i })).toBeVisible();
		});

		test('shows personal records section', async ({ page }) => {
			await expect(page.getByText(/personal records/i)).toBeVisible();
		});
	});
});
