/**
 * Dexie Sync Test
 *
 * This test verifies that the test helpers properly sync with Dexie reactive stores.
 * If this test passes, it means the new approach works and we can enable more tests.
 *
 * The tests use ?__test_mode=true to enable test helpers in production builds.
 */

import { expect, test } from '@playwright/test';
import { seedPlanViaApp, clearDataViaApp, waitForTestHelpers } from './utils/test-helpers';

// Enable test mode by navigating with the test mode parameter
const TEST_MODE_URL = '/?__test_mode=true';

test.describe('Dexie Sync via Test Helpers', () => {
	test('test helpers are available with test mode param', async ({ page }) => {
		// Navigate with test mode enabled
		await page.goto(TEST_MODE_URL);

		const available = await waitForTestHelpers(page, 10000);
		expect(available).toBe(true);
	});

	test('can seed plan and access dashboard', async ({ page }) => {
		// Navigate with test mode to trigger initialization
		await page.goto(TEST_MODE_URL);

		// Wait for helpers to be ready
		const available = await waitForTestHelpers(page, 10000);
		expect(available).toBe(true);

		// Clear and seed via app's Dexie instance
		await clearDataViaApp(page);
		await seedPlanViaApp(page, { completeOnboarding: true });

		// Navigate to app - test mode is persisted in sessionStorage
		await page.goto('/app');

		// Wait a moment for routing to settle
		await page.waitForTimeout(500);

		// Should be on the dashboard, not redirected
		const url = page.url();
		expect(url).toContain('/app');
		expect(url).not.toContain('/onboarding');
	});

	test('can seed plan without onboarding and access onboarding page', async ({ page }) => {
		await page.goto(TEST_MODE_URL);

		const available = await waitForTestHelpers(page, 10000);
		expect(available).toBe(true);

		// Clear and seed WITHOUT completing onboarding
		await clearDataViaApp(page);
		await seedPlanViaApp(page, { completeOnboarding: false });

		// Navigate to app - should redirect to onboarding
		await page.goto('/app');

		// Should redirect to onboarding
		await page.waitForURL(/\/app\/onboarding/, { timeout: 5000 });
		expect(page.url()).toContain('/onboarding');
	});

	test('cleared data redirects to home', async ({ page }) => {
		await page.goto(TEST_MODE_URL);

		const available = await waitForTestHelpers(page, 10000);
		expect(available).toBe(true);

		// Clear all data
		await clearDataViaApp(page);

		// Navigate to app - should redirect to home
		await page.goto('/app');

		// Should redirect to landing page
		await page.waitForURL('/', { timeout: 5000 });
		expect(page.url()).not.toContain('/app');
	});
});
