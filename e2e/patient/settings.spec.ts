import { expect, test } from '@playwright/test';
import {
	seedPlanViaApp,
	clearDataViaApp,
	waitForTestHelpers,
	hasLocalPlanViaApp
} from '../utils/test-helpers';
import { TEST_PLAN_PAYLOAD } from '../fixtures/test-plan';

/**
 * Patient Settings Tests
 *
 * Tests the patient settings page including:
 * - Viewing and editing profile
 * - Notification preferences
 * - Data export
 * - Delete data functionality
 *
 * Uses the app's Dexie instance via test helpers to properly seed data.
 */

const TEST_MODE_URL = '/?__test_mode=true';

test.describe('Patient Settings', () => {
	test.beforeEach(async ({ page }) => {
		// Initialize test mode
		await page.goto(TEST_MODE_URL);
		await waitForTestHelpers(page, 10000);
		await clearDataViaApp(page);
	});

	test.describe('Access Control', () => {
		test('settings page requires local plan', async ({ page }) => {
			await page.goto('/app/settings');

			// Should redirect or show error
			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});

		test('settings page accessible with local plan', async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });

			// Navigate through dashboard
			await page.goto('/app');
			await page.waitForTimeout(300);
			await page.getByRole('link', { name: /settings/i }).click();
			await page.waitForURL(/\/app\/settings/);

			await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
		});
	});

	test.describe('Viewing & Editing Profile', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			// Navigate through dashboard (the intended user flow)
			await page.goto('/app');
			await page.waitForTimeout(300);
			// Click the Settings link
			await page.getByRole('link', { name: /settings/i }).click();
			await page.waitForURL(/\/app\/settings/);
		});

		test('displays settings page heading', async ({ page }) => {
			await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
		});

		test('displays current display name', async ({ page }) => {
			await expect(page.getByText(TEST_PLAN_PAYLOAD.patientNickname)).toBeVisible();
		});

		test('has edit name option', async ({ page }) => {
			const editButton = page.getByRole('button', { name: /edit|change.*name/i });
			await expect(editButton).toBeVisible();
		});

		test('can update display name', async ({ page }) => {
			// Click edit
			await page.getByRole('button', { name: /edit|change.*name/i }).click();

			// Enter new name
			const nameInput = page.getByLabel(/name/i);
			await nameInput.clear();
			await nameInput.fill('Updated Name');

			// Save
			await page.getByRole('button', { name: /save/i }).click();

			// Should show success or new name
			await expect(page.getByText('Updated Name')).toBeVisible();
		});

		test('validates display name is required', async ({ page }) => {
			await page.getByRole('button', { name: /edit|change.*name/i }).click();

			const nameInput = page.getByLabel(/name/i);
			await nameInput.clear();

			await page.getByRole('button', { name: /save/i }).click();

			// Should show error
			await expect(page.getByText(/required|enter.*name/i)).toBeVisible();
		});
	});

	test.describe('Notification Settings', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app');
			await page.waitForTimeout(300);
			await page.getByRole('link', { name: /settings/i }).click();
			await page.waitForURL(/\/app\/settings/);
		});

		test('displays notification settings section', async ({ page }) => {
			await expect(page.getByRole('heading', { name: /notification/i })).toBeVisible();
		});

		test('has enable/disable toggle', async ({ page }) => {
			const toggle = page.getByRole('switch');
			await expect(toggle).toBeVisible();
		});
	});

	test.describe('Export Data', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app');
			await page.waitForTimeout(300);
			await page.getByRole('link', { name: /settings/i }).click();
			await page.waitForURL(/\/app\/settings/);
		});

		test('has export data section', async ({ page }) => {
			await expect(page.getByText('Export My Data')).toBeVisible();
		});

		test('has export button', async ({ page }) => {
			await expect(page.getByRole('link', { name: /export/i })).toBeVisible();
		});

		test('export button navigates to export page', async ({ page }) => {
			await page.getByRole('link', { name: /export/i }).click();

			await expect(page).toHaveURL(/\/app\/settings\/export/);
		});

		test('export page has passphrase input', async ({ page }) => {
			await page.goto('/app/settings/export');

			await expect(page.getByLabel(/passphrase/i).first()).toBeVisible();
		});

		test('export page has confirm passphrase input', async ({ page }) => {
			await page.goto('/app/settings/export');

			await expect(page.getByLabel(/confirm passphrase/i)).toBeVisible();
		});

		test('export page has download button', async ({ page }) => {
			await page.goto('/app/settings/export');

			await expect(page.getByRole('button', { name: /create.*backup/i })).toBeVisible();
		});
	});

	test.describe('Delete Data', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			// Navigate through dashboard (the intended user flow)
			await page.goto('/app');
			await page.waitForTimeout(300);
			// Click the Settings link
			await page.getByRole('link', { name: /settings/i }).click();
			await page.waitForURL(/\/app\/settings/);
		});

		test('has clear data option', async ({ page }) => {
			await expect(page.getByText(/clear all data/i)).toBeVisible();
		});

		test('clear shows confirmation dialog', async ({ page }) => {
			await page.getByRole('button', { name: /clear/i }).click();

			// Should show confirmation dialog
			await expect(page.getByRole('dialog')).toBeVisible();
		});

		test('can cancel clearing', async ({ page }) => {
			await page.getByRole('button', { name: /clear/i }).click();

			await page.getByRole('button', { name: /cancel/i }).click();

			// Dialog should close
			await expect(page.getByRole('dialog')).not.toBeVisible();

			// Data should still exist
			const hasPlan = await hasLocalPlanViaApp(page);
			expect(hasPlan).toBe(true);
		});

		test('completing clear action removes data', async ({ page }) => {
			await page.getByRole('button', { name: /clear/i }).click();

			// Confirm by clicking "Clear Data" in the dialog
			await page.getByRole('button', { name: /clear data/i }).click();

			// Should redirect to landing page
			await expect(page).toHaveURL('/', { timeout: 5000 });
		});

		test('after clearing cannot access /app', async ({ page }) => {
			await page.getByRole('button', { name: /clear/i }).click();
			await page.getByRole('button', { name: /clear data/i }).click();

			await page.waitForURL('/');

			// Try to access app
			await page.goto('/app');

			// Should redirect to home
			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});
	});

	test.describe('About Section', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			// Navigate through dashboard (the intended user flow)
			await page.goto('/app');
			await page.waitForTimeout(300);
			// Click the Settings link
			await page.getByRole('link', { name: /settings/i }).click();
			await page.waitForURL(/\/app\/settings/);
		});

		test('displays about section heading', async ({ page }) => {
			await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
		});

		test('shows app version', async ({ page }) => {
			await expect(page.getByText(/app version/i)).toBeVisible();
		});

		test('has link to about page', async ({ page }) => {
			await expect(
				page.getByRole('link', { name: /about the well-being action plan/i })
			).toBeVisible();
		});
	});

	test.describe('Navigation', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			// Navigate through dashboard (the intended user flow)
			await page.goto('/app');
			await page.waitForTimeout(300);
			// Click the Settings link
			await page.getByRole('link', { name: /settings/i }).click();
			await page.waitForURL(/\/app\/settings/);
		});

		test('has back to dashboard link', async ({ page }) => {
			await page.getByRole('link', { name: /back|dashboard|home/i }).click();

			await expect(page).toHaveURL(/\/app$/);
		});
	});
});
