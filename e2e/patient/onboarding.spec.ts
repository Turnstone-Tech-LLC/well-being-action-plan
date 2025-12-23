import { expect, test } from '@playwright/test';
import {
	seedPlanViaApp,
	clearDataViaApp,
	waitForTestHelpers,
	hasLocalPlanViaApp
} from '../utils/test-helpers';
import { TEST_PLAN_PAYLOAD } from '../fixtures/test-plan';

/**
 * Patient Onboarding Tests
 *
 * Tests the patient onboarding flow after they first load their action plan.
 * The onboarding has 3 steps: Welcome, Profile Setup, Notifications.
 *
 * Uses the app's Dexie instance via test helpers to properly seed data.
 */

const TEST_MODE_URL = '/?__test_mode=true';

test.describe('Patient Onboarding', () => {
	test.beforeEach(async ({ page }) => {
		// Initialize test mode
		await page.goto(TEST_MODE_URL);
		await waitForTestHelpers(page, 10000);
		await clearDataViaApp(page);
	});

	test.describe('Access Control', () => {
		test('redirects to landing if no local plan', async ({ page }) => {
			await page.goto('/app/onboarding');

			// Should redirect to home when no plan exists
			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});

		test('accessible when local plan exists without onboarding', async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: false });

			await page.goto('/app/onboarding');

			// Should show onboarding content
			await expect(page).toHaveURL(/\/app\/onboarding/);
		});

		test('redirects to dashboard if already onboarded', async ({ page }) => {
			// Seed with completed onboarding
			await seedPlanViaApp(page, { completeOnboarding: true });

			await page.goto('/app/onboarding');

			// Should redirect to main app
			await expect(page).toHaveURL(/\/app$/, { timeout: 5000 });
		});
	});

	test.describe('Welcome Step', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: false });
			await page.goto('/app/onboarding');
		});

		test('displays welcome screen', async ({ page }) => {
			// Should show welcome heading
			await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
		});

		test('shows patient nickname from plan', async ({ page }) => {
			// Should show the patient's nickname
			await expect(page.getByText(TEST_PLAN_PAYLOAD.patientNickname)).toBeVisible();
		});

		test('has continue/next button', async ({ page }) => {
			await expect(page.getByRole('button', { name: /continue|next|get started/i })).toBeVisible();
		});

		test('shows step indicator', async ({ page }) => {
			await expect(page.getByText(/step 1 of 3/i)).toBeVisible();
		});
	});

	test.describe('Profile Setup Step', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: false });
			await page.goto('/app/onboarding');
			// Click through welcome to get to profile
			await page.getByRole('button', { name: /continue|next|get started/i }).click();
		});

		test('shows profile setup step', async ({ page }) => {
			await expect(page.getByText(/step 2/i)).toBeVisible();
		});

		test('has display name input', async ({ page }) => {
			await expect(page.getByLabel(/what should we call you/i)).toBeVisible();
		});

		test('can go back to welcome', async ({ page }) => {
			await page.getByRole('button', { name: /back/i }).click();
			await expect(page.getByText(/step 1/i)).toBeVisible();
		});
	});

	test.describe('Notifications Step', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: false });
			await page.goto('/app/onboarding');
			// Navigate to notifications step
			await page.getByRole('button', { name: /continue|next|get started/i }).click();
			await page.getByLabel(/what should we call you/i).fill('Test User');
			await page.getByRole('button', { name: /continue|next/i }).click();
		});

		test('shows notifications step', async ({ page }) => {
			await expect(page.getByText('Step 3 of 3')).toBeVisible();
		});

		test('can go back to profile', async ({ page }) => {
			await page.getByRole('button', { name: /back/i }).click();
			await expect(page.getByText(/step 2/i)).toBeVisible();
		});
	});

	test.describe('Completion', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: false });
			await page.goto('/app/onboarding');
		});

		test('completing onboarding redirects to dashboard', async ({ page }) => {
			// Step 1: Welcome
			await page.getByRole('button', { name: /continue|next|get started/i }).click();

			// Step 2: Profile - fill name and continue
			await page.getByLabel(/what should we call you/i).fill('Test User');
			await page.getByRole('button', { name: /continue|next/i }).click();

			// Step 3: Notifications - skip or finish
			await page.getByRole('button', { name: /finish|done|complete|skip|continue/i }).click();

			await expect(page).toHaveURL(/\/app$/, { timeout: 5000 });
		});

		test('does not show onboarding again after completion', async ({ page }) => {
			// Complete onboarding
			await page.getByRole('button', { name: /continue|next|get started/i }).click();
			await page.getByLabel(/what should we call you/i).fill('Test User');
			await page.getByRole('button', { name: /continue|next/i }).click();
			await page.getByRole('button', { name: /finish|done|complete|skip|continue/i }).click();

			await page.waitForURL(/\/app$/);

			// Try to go back to onboarding
			await page.goto('/app/onboarding');

			// Should redirect to dashboard
			await expect(page).toHaveURL(/\/app$/, { timeout: 5000 });
		});

		test('sets onboarding complete in profile', async ({ page }) => {
			// Complete onboarding
			await page.getByRole('button', { name: /continue|next|get started/i }).click();
			await page.getByLabel(/what should we call you/i).fill('Test User');
			await page.getByRole('button', { name: /continue|next/i }).click();
			await page.getByRole('button', { name: /finish|done|complete|skip|continue/i }).click();

			await page.waitForURL(/\/app$/);

			// Verify plan still exists
			const hasPlan = await hasLocalPlanViaApp(page);
			expect(hasPlan).toBe(true);
		});
	});
});
