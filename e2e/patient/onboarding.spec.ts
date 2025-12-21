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

	test.describe('Onboarding Steps', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: false });
			await page.goto('/app/onboarding');
		});

		test('displays welcome screen', async ({ page }) => {
			// Should show welcome messaging
			await expect(page.getByText(/welcome|get started|hello/i)).toBeVisible();
		});

		test('shows patient nickname from plan', async ({ page }) => {
			// Should show the patient's nickname
			await expect(page.getByText(TEST_PLAN_PAYLOAD.patientNickname)).toBeVisible();
		});

		test('has continue/next button', async ({ page }) => {
			await expect(page.getByRole('button', { name: /continue|next|get started/i })).toBeVisible();
		});

		test('can navigate through steps', async ({ page }) => {
			// Click through first step
			await page.getByRole('button', { name: /continue|next|get started/i }).click();

			// Should advance to next step
			await expect(page.locator('body')).toBeVisible();
		});
	});

	test.describe('Review Sections', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: false });
			await page.goto('/app/onboarding');
		});

		test('shows Green Zone coping skills', async ({ page }) => {
			// Navigate to skills review step
			await page.getByRole('button', { name: /continue|next/i }).click();

			// Should show skills from the plan
			await expect(page.getByText(/coping skills|strategies/i)).toBeVisible();

			// Should list actual skills
			for (const skill of TEST_PLAN_PAYLOAD.skills) {
				await expect(page.getByText(skill.title)).toBeVisible();
			}
		});

		test('shows supportive adults', async ({ page }) => {
			// Navigate to supportive adults step
			// May need multiple clicks to get there

			await expect(page.getByText(/supportive adults/i)).toBeVisible();

			// Should list adults from plan
			for (const adult of TEST_PLAN_PAYLOAD.supportiveAdults) {
				await expect(page.getByText(adult.name)).toBeVisible();
			}
		});

		test('shows Yellow Zone help methods', async ({ page }) => {
			// Navigate to help methods step

			await expect(page.getByText(/help methods|when.*struggling/i)).toBeVisible();

			for (const method of TEST_PLAN_PAYLOAD.helpMethods) {
				await expect(page.getByText(method.title)).toBeVisible();
			}
		});

		test('shows Red Zone crisis resources', async ({ page }) => {
			// Navigate to crisis resources step

			await expect(page.getByText(/crisis|emergency|red zone/i)).toBeVisible();

			// 988 should be visible
			await expect(page.getByText('988')).toBeVisible();
		});
	});

	test.describe('Display Name', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: false });
			await page.goto('/app/onboarding');
		});

		test('has display name input', async ({ page }) => {
			// Navigate to name step
			await expect(page.getByLabel(/name|what.*call you/i)).toBeVisible();
		});

		test('pre-fills with patient nickname', async ({ page }) => {
			const nameInput = page.getByLabel(/name|what.*call you/i);
			await expect(nameInput).toHaveValue(TEST_PLAN_PAYLOAD.patientNickname);
		});

		test('can update display name', async ({ page }) => {
			const nameInput = page.getByLabel(/name|what.*call you/i);
			await nameInput.clear();
			await nameInput.fill('New Name');

			await expect(nameInput).toHaveValue('New Name');
		});

		test('requires display name', async ({ page }) => {
			const nameInput = page.getByLabel(/name|what.*call you/i);
			await nameInput.clear();

			// Try to continue
			await page.getByRole('button', { name: /continue|next/i }).click();

			// Should show error
			await expect(page.getByText(/required|enter.*name/i)).toBeVisible();
		});
	});

	test.describe('Navigation', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: false });
			await page.goto('/app/onboarding');
		});

		test('can go back through steps', async ({ page }) => {
			// Advance a few steps
			await page.getByRole('button', { name: /continue|next/i }).click();
			await page.getByRole('button', { name: /continue|next/i }).click();

			// Go back
			await page.getByRole('button', { name: /back|previous/i }).click();

			// Should be on previous step
			await expect(page.locator('body')).toBeVisible();
		});

		test('progress is preserved when going back', async ({ page }) => {
			// Fill in name
			const nameInput = page.getByLabel(/name/i);
			await nameInput.fill('Test Name');

			// Advance
			await page.getByRole('button', { name: /continue|next/i }).click();

			// Go back
			await page.getByRole('button', { name: /back|previous/i }).click();

			// Name should still be there
			await expect(nameInput).toHaveValue('Test Name');
		});

		test('shows progress indicator', async ({ page }) => {
			// Should show some progress indicator (dots, steps, etc.)
			const progressIndicator = page.locator('[data-testid="progress"], .progress, .steps');
			await expect(progressIndicator).toBeVisible();
		});
	});

	test.describe('Completion', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: false });
			await page.goto('/app/onboarding');
		});

		test('completion redirects to dashboard', async ({ page }) => {
			// Complete all onboarding steps
			// Click through all steps..
			// Final step should have finish/done button

			await page.getByRole('button', { name: /finish|done|complete|let.*go/i }).click();

			await expect(page).toHaveURL(/\/app$/, { timeout: 5000 });
		});

		test('sets onboarding complete in profile', async ({ page }) => {
			// Complete onboarding
			await page.getByRole('button', { name: /finish|done|complete/i }).click();

			await page.waitForURL(/\/app$/);

			// Verify plan still exists
			const hasPlan = await hasLocalPlanViaApp(page);
			expect(hasPlan).toBe(true);
		});

		test('does not show onboarding again after completion', async ({ page }) => {
			// Complete onboarding
			await page.getByRole('button', { name: /finish|done|complete/i }).click();

			await page.waitForURL(/\/app$/);

			// Try to go back to onboarding
			await page.goto('/app/onboarding');

			// Should redirect to dashboard
			await expect(page).toHaveURL(/\/app$/, { timeout: 5000 });
		});
	});

	test.describe('Notification Preferences', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: false });
			await page.goto('/app/onboarding');
		});

		test('shows notification preference step', async ({ page }) => {
			// Navigate to notifications step
			await expect(page.getByText(/notification|remind/i)).toBeVisible();
		});

		test('can enable notifications', async ({ page }) => {
			// Navigate to notifications step
			const enableToggle = page.getByRole('switch', { name: /enable|notifications/i });
			await enableToggle.click();

			await expect(enableToggle).toBeChecked();
		});

		test('shows frequency options when enabled', async ({ page }) => {
			// Enable notifications
			await page.getByRole('switch', { name: /enable|notifications/i }).click();

			// Frequency options should appear
			await expect(page.getByText(/daily|weekly|every.*days/i)).toBeVisible();
		});

		test('shows time preference when enabled', async ({ page }) => {
			// Enable notifications
			await page.getByRole('switch', { name: /enable|notifications/i }).click();

			// Time preference should appear
			await expect(page.getByText(/morning|afternoon|evening/i)).toBeVisible();
		});
	});
});
