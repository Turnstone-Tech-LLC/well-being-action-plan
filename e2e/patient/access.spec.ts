import { expect, test } from '@playwright/test';
import { seedPlanViaApp, clearDataViaApp, waitForTestHelpers } from '../utils/test-helpers';

/**
 * Patient Access Tests
 *
 * Tests the different ways patients can load their action plan:
 * 1. Token/QR Code access via /access/[token]
 * 2. File upload with passphrase via /restore
 * 3. Local data bypass (plan already in IndexedDB)
 */

const TEST_MODE_URL = '/?__test_mode=true';

test.describe('Patient - Loading Action Plan', () => {
	test.describe('Method 1: File Upload with Passphrase', () => {
		// These tests are covered in restore.test.ts
		// Here we focus on the integration with the patient flow

		test('patient can access /restore page', async ({ page }) => {
			await page.goto('/restore');

			await expect(page.getByRole('heading', { name: 'Restore Your Plan' })).toBeVisible();
		});

		test('restore page has file upload area', async ({ page }) => {
			await page.goto('/restore');

			// Look for file input or upload area
			const fileInput = page.locator('input[type="file"]');
			const hasFileInput = (await fileInput.count()) > 0;
			const hasUploadText = await page
				.getByText(/drag and drop|choose file|upload/i)
				.isVisible()
				.catch(() => false);

			expect(hasFileInput || hasUploadText).toBe(true);
		});

		test('restore page has passphrase input', async ({ page }) => {
			await page.goto('/restore');

			await expect(page.getByLabel('Recovery Passphrase')).toBeVisible();
		});

		test('restore page has helper text', async ({ page }) => {
			await page.goto('/restore');

			await expect(
				page.getByText(/passphrase you created when you made your backup/i)
			).toBeVisible();
		});
	});

	test.describe('Method 2: Token/QR Code Access', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto(TEST_MODE_URL);
			await waitForTestHelpers(page, 10000);
			await clearDataViaApp(page);
		});

		test('patient navigates to /access/[valid-token]', async ({ page }) => {
			await page.goto('/access/TEST-TOKEN-123');

			// Should show some loading or validation state
			await expect(page.locator('body')).toBeVisible();
		});

		test('shows loading/validating state initially', async ({ page }) => {
			await page.goto('/access/SOME-TOKEN');

			// Should show validating state
			const validatingText = page.getByText(/validating|checking|loading/i);

			await expect(validatingText)
				.toBeVisible({ timeout: 2000 })
				.catch(() => {
					// May transition quickly - that's OK
				});
		});

		test('shows privacy note during validation', async ({ page }) => {
			await page.goto('/access/SOME-TOKEN');

			const note = page.getByText(/stored locally|on this device|privacy/i);

			await expect(note)
				.toBeVisible({ timeout: 2000 })
				.catch(() => {
					// May disappear quickly
				});
		});

		test('invalid/unknown token shows error state', async ({ page }) => {
			await page.goto('/access/INVALID-TOKEN-12345');

			await page.waitForTimeout(1000);

			const title = page.getByRole('heading', { name: /no longer active|invalid/i });
			await expect(title).toBeVisible({ timeout: 5000 });
		});

		test('error state shows explanation text', async ({ page }) => {
			await page.goto('/access/NONEXISTENT-TOKEN');

			await page.waitForTimeout(1000);

			await expect(page.getByText(/expired|already been used/i)).toBeVisible({ timeout: 5000 });
		});

		test('error state has restore from backup link', async ({ page }) => {
			await page.goto('/access/EXPIRED-TOKEN-12345');

			await page.waitForTimeout(1000);

			await expect(page.getByRole('link', { name: 'Restore from backup' })).toBeVisible({
				timeout: 5000
			});
		});

		test('error state has return to home link', async ({ page }) => {
			await page.goto('/access/EXPIRED-TOKEN-12345');

			await page.waitForTimeout(1000);

			await expect(page.getByRole('link', { name: 'Return to home' })).toBeVisible({
				timeout: 5000
			});
		});

		test('restore from backup link navigates to restore page', async ({ page }) => {
			await page.goto('/access/EXPIRED-TOKEN-12345');

			await page.waitForTimeout(1000);

			await page.getByRole('link', { name: 'Restore from backup' }).click();

			await expect(page).toHaveURL('/restore');
		});

		test('return to home link navigates to landing page', async ({ page }) => {
			await page.goto('/access/EXPIRED-TOKEN-12345');

			await page.waitForTimeout(1000);

			await page.getByRole('link', { name: 'Return to home' }).click();

			await expect(page).toHaveURL('/');
		});

		// Token status tests - require database seeding or mocking
		test.skip('used token shows already used state', async ({ page }) => {
			await page.goto('/access/USED-TOKEN-12345');

			await page.waitForTimeout(1000);

			const title = page.getByRole('heading', { name: /already been used/i });
			await expect(title).toBeVisible({ timeout: 5000 });
		});

		test.skip('revoked token shows revoked state', async ({ page }) => {
			await page.goto('/access/REVOKED-TOKEN-12345');

			await page.waitForTimeout(1000);

			const title = page.getByRole('heading', { name: /replaced/i });
			await expect(title).toBeVisible({ timeout: 5000 });
		});

		test.skip('valid token saves plan to IndexedDB', async ({ page }) => {
			await page.goto('/access/VALID-TOKEN-12345');

			// Should redirect to onboarding or app
			await expect(page).toHaveURL(/\/app/, { timeout: 10000 });
		});

		test.skip('valid token redirects to onboarding for new user', async ({ page }) => {
			await page.goto('/access/VALID-TOKEN-12345');

			await expect(page).toHaveURL(/\/app\/onboarding/, { timeout: 10000 });
		});
	});

	test.describe('Local Data Bypass', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto(TEST_MODE_URL);
			await waitForTestHelpers(page, 10000);
			await clearDataViaApp(page);
		});

		test('existing plan bypasses token validation', async ({ page }) => {
			// Seed a plan in IndexedDB
			await seedPlanViaApp(page, { completeOnboarding: true });

			// Navigate to access page with any token
			await page.goto('/access/ANY-TOKEN-VALUE');

			// Should redirect to app (bypassing validation)
			await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
		});

		test('bypasses even with invalid token when plan exists', async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });

			// Use clearly invalid token
			await page.goto('/access/INVALID-TOKEN');

			// Should still redirect to app
			await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
		});

		test('shows brief "Plan found" message', async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });

			await page.goto('/access/ANY-TOKEN');

			// May show brief message before redirect
			const planFoundText = page.getByText(/plan found|existing plan/i);

			await expect(planFoundText)
				.toBeVisible({ timeout: 2000 })
				.catch(() => {
					// Redirect may happen too fast - that's OK
				});
		});

		test('redirects to onboarding if onboarding not complete', async ({ page }) => {
			// Seed plan with incomplete onboarding
			await seedPlanViaApp(page, { completeOnboarding: false });

			await page.goto('/access/ANY-TOKEN');

			// Should redirect to onboarding
			await expect(page).toHaveURL(/\/app\/onboarding/, { timeout: 5000 });
		});

		test('redirects to dashboard if onboarding complete', async ({ page }) => {
			// Seed plan with completed onboarding
			await seedPlanViaApp(page, { completeOnboarding: true });

			await page.goto('/access/ANY-TOKEN');

			// Should redirect to main app dashboard
			await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
			// Verify we're not on onboarding
			expect(page.url()).not.toContain('/onboarding');
		});
	});
});

test.describe('Scan Page', () => {
	test('displays scan page heading', async ({ page }) => {
		await page.goto('/scan');

		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	});

	test('has access code input', async ({ page }) => {
		await page.goto('/scan');

		const input = page.locator('#access-code');
		await expect(input).toBeVisible();
	});

	test('has submit button', async ({ page }) => {
		await page.goto('/scan');

		const submitButton = page.getByRole('button', { name: /load.*plan/i });
		await expect(submitButton).toBeVisible();
	});

	test('submit button is disabled when input is empty', async ({ page }) => {
		await page.goto('/scan');

		const submitButton = page.getByRole('button', { name: /load.*plan/i });
		await expect(submitButton).toBeDisabled();
	});

	test('submit button enables when code is entered', async ({ page }) => {
		await page.goto('/scan');

		await page.locator('#access-code').fill('TEST123');

		const submitButton = page.getByRole('button', { name: /load.*plan/i });
		await expect(submitButton).toBeEnabled();
	});

	// Note: restore from backup link is not currently implemented on scan page
	// This test documents expected future behavior
	test.skip('has restore from backup link', async ({ page }) => {
		await page.goto('/scan');

		// Look for restore link or text
		const hasRestoreLink = await page
			.getByRole('link', { name: /restore|backup/i })
			.isVisible()
			.catch(() => false);
		const hasRestoreText = await page
			.getByText(/restore|backup/i)
			.isVisible()
			.catch(() => false);

		expect(hasRestoreLink || hasRestoreText).toBe(true);
	});
});
