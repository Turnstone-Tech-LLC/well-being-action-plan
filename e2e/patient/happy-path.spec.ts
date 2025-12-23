import { expect, test } from '@playwright/test';
import {
	seedPlanViaApp,
	clearDataViaApp,
	waitForTestHelpers,
	getCheckInCountViaApp
} from '../utils/test-helpers';

/**
 * Happy Path Tests
 *
 * These tests verify the complete user journey through the app:
 * - Landing on dashboard
 * - Completing a check-in
 * - Seeing the check-in saved
 *
 * These are the core flows that must always work.
 */

const TEST_MODE_URL = '/?__test_mode=true';

test.describe('Happy Path', () => {
	test.beforeEach(async ({ page }) => {
		// Initialize test mode
		await page.goto(TEST_MODE_URL);
		await waitForTestHelpers(page, 10000);
		await clearDataViaApp(page);
	});

	test('complete green zone check-in flow', async ({ page }) => {
		// Setup: Seed a plan with completed onboarding
		await seedPlanViaApp(page, { completeOnboarding: true });

		// Navigate to dashboard
		await page.goto('/app');
		await page.waitForTimeout(300);

		// Verify we're on the dashboard
		expect(page.url()).toContain('/app');
		expect(page.url()).not.toContain('/onboarding');

		// Verify patient name is displayed (using 'Alex' from TEST_PLAN_PAYLOAD)
		await expect(page.getByText('Alex')).toBeVisible();

		// Get initial check-in count
		const initialCount = await getCheckInCountViaApp(page);

		// Click Check In button
		const checkInButton = page.getByRole('link', { name: /check in/i });
		await expect(checkInButton).toBeVisible();
		await checkInButton.click();

		// Should be on check-in zone selection page
		await expect(page).toHaveURL(/\/app\/checkin$/);

		// Verify zone selection options are visible
		await expect(page.getByText(/feeling good/i)).toBeVisible();
		await expect(page.getByText(/struggling/i)).toBeVisible();
		await expect(page.getByText(/need help/i)).toBeVisible();

		// Select green zone (feeling good)
		await page.getByText(/feeling good/i).click();

		// Should navigate to green zone page
		await expect(page).toHaveURL(/\/app\/checkin\/green/);

		// Verify coping skills are displayed
		await expect(page.getByText('Deep Breathing')).toBeVisible();

		// Select a coping skill (buttons with aria-pressed, not checkboxes)
		const skillButton = page.getByRole('button', { name: /Deep Breathing/i });
		await skillButton.click();
		await expect(skillButton).toHaveAttribute('aria-pressed', 'true');

		// Click Done to submit
		const doneButton = page.getByRole('button', { name: /done/i });
		await expect(doneButton).toBeVisible();
		await doneButton.click();

		// Should see success message or redirect to dashboard
		// Wait for navigation
		await page.waitForURL(/\/app/, { timeout: 5000 });

		// Verify check-in was saved
		const newCount = await getCheckInCountViaApp(page);
		expect(newCount).toBe(initialCount + 1);
	});

	test('complete yellow zone check-in flow', async ({ page }) => {
		// Setup: Seed a plan with completed onboarding
		await seedPlanViaApp(page, { completeOnboarding: true });

		// Navigate to check-in
		await page.goto('/app/checkin');

		// Select yellow zone
		await page.getByText(/struggling/i).click();

		// Should navigate to yellow zone page
		await expect(page).toHaveURL(/\/app\/checkin\/yellow/);

		// Verify supportive adults are displayed
		await expect(page.getByText('Mom')).toBeVisible();

		// Get initial count
		const initialCount = await getCheckInCountViaApp(page);

		// Click "I've reached out" button to complete yellow zone
		const doneButton = page.getByRole('button', { name: /reached out/i });
		await doneButton.click();

		// Should redirect to dashboard
		await page.waitForURL(/\/app/, { timeout: 5000 });

		// Verify check-in was saved
		const newCount = await getCheckInCountViaApp(page);
		expect(newCount).toBe(initialCount + 1);
	});

	test('complete red zone check-in flow', async ({ page }) => {
		// Setup: Seed a plan with completed onboarding
		await seedPlanViaApp(page, { completeOnboarding: true });

		// Navigate to check-in
		await page.goto('/app/checkin');

		// Select red zone
		await page.getByText(/need help/i).click();

		// Should navigate to red zone page
		await expect(page).toHaveURL(/\/app\/checkin\/red/);

		// Verify crisis resources are displayed (looking for 988 in crisis button)
		await expect(page.getByText('988')).toBeVisible();

		// Get initial count
		const initialCount = await getCheckInCountViaApp(page);

		// Click the "I've reached out" button
		const completeButton = page.getByRole('button', { name: /I've reached out/i });
		await completeButton.click();

		// Should redirect to dashboard
		await page.waitForURL(/\/app/, { timeout: 5000 });

		// Verify check-in was saved
		const newCount = await getCheckInCountViaApp(page);
		expect(newCount).toBe(initialCount + 1);
	});

	test('onboarding flow for new patient', async ({ page }) => {
		// Seed a plan WITHOUT completed onboarding
		await seedPlanViaApp(page, { completeOnboarding: false });

		// Navigate to app
		await page.goto('/app');

		// Should redirect to onboarding
		await page.waitForURL(/\/app\/onboarding/, { timeout: 5000 });

		// Verify we're on onboarding
		expect(page.url()).toContain('/onboarding');

		// Verify patient name is shown (using 'Alex' from TEST_PLAN_PAYLOAD)
		await expect(page.getByText('Alex')).toBeVisible();
	});

	test('check-in count increases after multiple check-ins', async ({ page }) => {
		// Setup
		await seedPlanViaApp(page, { completeOnboarding: true });

		// Get initial count
		const initialCount = await getCheckInCountViaApp(page);
		expect(initialCount).toBe(0);

		// Do first check-in
		await page.goto('/app/checkin/green');
		await page.getByRole('button', { name: /done/i }).click();
		await page.waitForURL(/\/app/, { timeout: 5000 });

		// Verify count is 1
		const countAfterFirst = await getCheckInCountViaApp(page);
		expect(countAfterFirst).toBe(1);

		// Do second check-in
		await page.goto('/app/checkin/green');
		await page.getByRole('button', { name: /done/i }).click();
		await page.waitForURL(/\/app/, { timeout: 5000 });

		// Verify count is 2
		const countAfterSecond = await getCheckInCountViaApp(page);
		expect(countAfterSecond).toBe(2);
	});
});
