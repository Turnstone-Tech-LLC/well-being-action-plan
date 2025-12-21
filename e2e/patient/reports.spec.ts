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
 * - Calendar view
 * - Statistics
 * - Filtering and details
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

			await page.goto('/app/reports');

			await expect(page).toHaveURL(/\/app\/reports/);
		});
	});

	test.describe('Empty State', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app/reports');
		});

		test('shows empty state when no check-ins', async ({ page }) => {
			await expect(page.getByText(/no check-ins|get started|first check-in/i)).toBeVisible();
		});

		test('empty state has link to check in', async ({ page }) => {
			await expect(page.getByRole('link', { name: /check in/i })).toBeVisible();
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
			await page.goto('/app/reports');
		});

		test('displays reports page heading', async ({ page }) => {
			await expect(page.getByRole('heading', { name: /report|history/i })).toBeVisible();
		});

		test('shows calendar view', async ({ page }) => {
			const calendar = page.locator('[data-testid="calendar"], .calendar, [class*="calendar"]');
			await expect(calendar).toBeVisible();
		});

		test('calendar shows color-coded dates', async ({ page }) => {
			// Days with check-ins should have zone colors
			const coloredDays = page.locator(
				'[class*="green"], [class*="yellow"], [class*="red"], [data-zone]'
			);
			const count = await coloredDays.count();
			expect(count).toBeGreaterThan(0);
		});

		test('shows list view of check-ins', async ({ page }) => {
			// Should have a list of check-ins
			const listItems = page.locator(
				'[data-testid="check-in-item"], .check-in-item, [class*="history-item"]'
			);
			const count = await listItems.count();
			expect(count).toBeGreaterThan(0);
		});
	});

	test.describe('Calendar View', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			const now = Date.now();
			await seedCheckInsViaApp(page, [
				{ zone: 'green', createdAt: new Date(now) },
				{ zone: 'yellow', createdAt: new Date(now - 24 * 60 * 60 * 1000) }
			]);
			await page.goto('/app/reports');
		});

		test('displays current month', async ({ page }) => {
			const currentMonth = new Date().toLocaleString('default', { month: 'long' });
			await expect(page.getByText(new RegExp(currentMonth, 'i'))).toBeVisible();
		});

		test('can navigate to previous month', async ({ page }) => {
			await page.getByRole('button', { name: /previous|back|</i }).click();

			const previousMonth = new Date();
			previousMonth.setMonth(previousMonth.getMonth() - 1);
			const monthName = previousMonth.toLocaleString('default', { month: 'long' });

			await expect(page.getByText(new RegExp(monthName, 'i'))).toBeVisible();
		});

		test('can navigate to next month', async ({ page }) => {
			// First go back
			await page.getByRole('button', { name: /previous|back|</i }).click();

			// Then forward
			await page.getByRole('button', { name: /next|forward|>/i }).click();

			const currentMonth = new Date().toLocaleString('default', { month: 'long' });
			await expect(page.getByText(new RegExp(currentMonth, 'i'))).toBeVisible();
		});

		test('clicking date shows check-in details', async ({ page }) => {
			// Click on a day with a check-in
			const today = new Date().getDate().toString();
			await page.locator(`[data-date], .calendar-day`).filter({ hasText: today }).click();

			// Should show details
			await expect(page.getByText(/green|yellow|red/i)).toBeVisible();
		});
	});

	test.describe('Check-in Details', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await seedCheckInsViaApp(page, [
				{
					zone: 'green',
					strategiesUsed: ['skill-1'],
					notes: 'Felt great after a walk',
					createdAt: new Date()
				}
			]);
			await page.goto('/app/reports');
		});

		test('shows zone for check-in', async ({ page }) => {
			// Click on check-in to see details
			await page.locator('[data-testid="check-in-item"], .check-in-item').first().click();

			// Should show zone
			await expect(page.getByText(/green/i)).toBeVisible();
		});

		test('shows date and time', async ({ page }) => {
			await page.locator('[data-testid="check-in-item"], .check-in-item').first().click();

			// Should show date/time
			await expect(page.getByText(/today|yesterday|\d{1,2}:\d{2}/i)).toBeVisible();
		});

		test('shows selected coping skills', async ({ page }) => {
			await page.locator('[data-testid="check-in-item"], .check-in-item').first().click();

			// Should show skills used
			await expect(page.getByText(/deep breathing/i)).toBeVisible();
		});

		test('shows notes if entered', async ({ page }) => {
			await page.locator('[data-testid="check-in-item"], .check-in-item').first().click();

			// Should show notes
			await expect(page.getByText('Felt great after a walk')).toBeVisible();
		});
	});

	test.describe('Statistics', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			const now = Date.now();
			await seedCheckInsViaApp(page, [
				{ zone: 'green', createdAt: new Date(now) },
				{ zone: 'green', createdAt: new Date(now - 24 * 60 * 60 * 1000) },
				{ zone: 'yellow', createdAt: new Date(now - 48 * 60 * 60 * 1000) },
				{ zone: 'green', createdAt: new Date(now - 72 * 60 * 60 * 1000) },
				{ zone: 'green', createdAt: new Date(now - 96 * 60 * 60 * 1000) }
			]);
			await page.goto('/app/reports');
		});

		test('shows total check-ins', async ({ page }) => {
			await expect(page.getByText(/5|total.*check-in/i)).toBeVisible();
		});

		test('shows zone breakdown', async ({ page }) => {
			// Should show percentage or count per zone
			// 4 green, 1 yellow = 80% green, 20% yellow
			await expect(page.getByText(/80%|4.*green/i)).toBeVisible();
		});

		test('shows current streak', async ({ page }) => {
			await expect(page.getByText(/streak|days/i)).toBeVisible();
		});

		test('shows longest streak', async ({ page }) => {
			await expect(page.getByText(/longest|best.*streak/i)).toBeVisible();
		});
	});

	test.describe('Filtering', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			const now = Date.now();
			await seedCheckInsViaApp(page, [
				{ zone: 'green', createdAt: new Date(now) },
				{ zone: 'yellow', createdAt: new Date(now - 24 * 60 * 60 * 1000) },
				{ zone: 'red', createdAt: new Date(now - 48 * 60 * 60 * 1000) }
			]);
			await page.goto('/app/reports');
		});

		test('can filter by zone type', async ({ page }) => {
			// Select green zone filter
			await page.getByRole('button', { name: /green/i }).click();

			// Should only show green check-ins
			const items = page.locator('[data-testid="check-in-item"]');
			const greenItems = items.filter({
				has: page.locator('[class*="green"], [data-zone="green"]')
			});

			await expect(greenItems).toHaveCount(1);
		});

		test('can filter by date range', async ({ page }) => {
			// Select date range (e.g., last 7 days)
			await page.getByRole('button', { name: /7 days|week/i }).click();

			// All check-ins should be visible (all within 7 days)
		});

		test('can clear filters', async ({ page }) => {
			// Apply filter
			await page.getByRole('button', { name: /green/i }).click();

			// Clear filter
			await page.getByRole('button', { name: /clear|all|reset/i }).click();

			// All check-ins should be visible again
			const items = page.locator('[data-testid="check-in-item"]');
			await expect(items).toHaveCount(3);
		});
	});

	test.describe('Navigation', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app/reports');
		});

		test('has back to dashboard link', async ({ page }) => {
			await page.getByRole('link', { name: /back|dashboard|home/i }).click();

			await expect(page).toHaveURL(/\/app$/);
		});

		test('has check in shortcut', async ({ page }) => {
			await page.getByRole('link', { name: /check in/i }).click();

			await expect(page).toHaveURL(/\/app\/checkin/);
		});
	});

	test.describe('List View', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			const now = Date.now();
			await seedCheckInsViaApp(page, [
				{ zone: 'green', createdAt: new Date(now) },
				{ zone: 'yellow', createdAt: new Date(now - 24 * 60 * 60 * 1000) },
				{ zone: 'green', createdAt: new Date(now - 48 * 60 * 60 * 1000) }
			]);
			await page.goto('/app/reports');
		});

		test('shows check-ins in list format', async ({ page }) => {
			const listItems = page.locator(
				'[data-testid="check-in-item"], .check-in-item, [class*="history-item"]'
			);
			await expect(listItems.first()).toBeVisible();
		});

		test('list items have zone indicator', async ({ page }) => {
			// Each item should show zone color
			const zoneIndicators = page.locator('[class*="green"], [class*="yellow"], [data-zone]');
			const count = await zoneIndicators.count();
			expect(count).toBeGreaterThan(0);
		});

		test('list items show date', async ({ page }) => {
			// Each item should show when it was
			await expect(page.getByText(/today|yesterday|ago/i)).toBeVisible();
		});

		test('can click item to see details', async ({ page }) => {
			await page.locator('[data-testid="check-in-item"], .check-in-item').first().click();

			// Should show more details
			await expect(page.getByText(/zone|time|date/i)).toBeVisible();
		});
	});
});
