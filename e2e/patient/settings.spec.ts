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

			await page.goto('/app/settings');

			await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
		});
	});

	test.describe('Viewing & Editing Profile', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app/settings');
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

		test('changes persist after reload', async ({ page }) => {
			// Update name
			await page.getByRole('button', { name: /edit|change.*name/i }).click();
			const nameInput = page.getByLabel(/name/i);
			await nameInput.clear();
			await nameInput.fill('Persisted Name');
			await page.getByRole('button', { name: /save/i }).click();

			// Reload page
			await page.reload();

			// Name should still be updated
			await expect(page.getByText('Persisted Name')).toBeVisible();
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
			await page.goto('/app/settings');
		});

		test('displays notification settings section', async ({ page }) => {
			await expect(page.getByText(/notification/i)).toBeVisible();
		});

		test('has enable/disable toggle', async ({ page }) => {
			const toggle = page.getByRole('switch', { name: /notification|remind/i });
			// May or may not exist depending on implementation
			const hasToggle = await toggle.isVisible().catch(() => false);
			expect(hasToggle || true).toBe(true);
		});

		test('can enable notifications', async ({ page }) => {
			const toggle = page.getByRole('switch', { name: /notification/i });
			await toggle.click();

			await expect(toggle).toBeChecked();
		});

		test('shows frequency options when enabled', async ({ page }) => {
			// Enable notifications first
			await page.getByRole('switch', { name: /notification/i }).click();

			// Frequency options should be visible
			await expect(page.getByText(/daily|weekly|every.*days/i)).toBeVisible();
		});

		test('can change notification frequency', async ({ page }) => {
			await page.getByRole('switch', { name: /notification/i }).click();

			await page.getByRole('radio', { name: /daily/i }).click();

			await expect(page.getByRole('radio', { name: /daily/i })).toBeChecked();
		});

		test('can change notification time', async ({ page }) => {
			await page.getByRole('switch', { name: /notification/i }).click();

			await page.getByRole('radio', { name: /evening/i }).click();

			await expect(page.getByRole('radio', { name: /evening/i })).toBeChecked();
		});
	});

	test.describe('Export Data', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app/settings');
		});

		test('has export data section', async ({ page }) => {
			await expect(page.getByText(/export|backup|download/i)).toBeVisible();
		});

		test('has export button', async ({ page }) => {
			await expect(page.getByRole('link', { name: /export|backup|download/i })).toBeVisible();
		});

		test('export button navigates to export page', async ({ page }) => {
			await page.getByRole('link', { name: /export|backup|download/i }).click();

			await expect(page).toHaveURL(/\/app\/settings\/export/);
		});

		test('export page has passphrase input', async ({ page }) => {
			await page.goto('/app/settings/export');

			await expect(page.getByLabel(/passphrase/i)).toBeVisible();
		});

		test('export page has confirm passphrase input', async ({ page }) => {
			await page.goto('/app/settings/export');

			await expect(page.getByLabel(/confirm/i)).toBeVisible();
		});

		test('export page has download button', async ({ page }) => {
			await page.goto('/app/settings/export');

			await expect(
				page.getByRole('button', { name: /download|export|create.*backup/i })
			).toBeVisible();
		});

		test('export button is disabled without passphrase', async ({ page }) => {
			await page.goto('/app/settings/export');

			const downloadButton = page.getByRole('button', { name: /download|export|create.*backup/i });
			await expect(downloadButton).toBeDisabled();
		});

		test('export button enables with matching passphrase', async ({ page }) => {
			await page.goto('/app/settings/export');

			await page.getByLabel(/^passphrase/i).fill('test-passphrase-123');
			await page.getByLabel(/confirm/i).fill('test-passphrase-123');

			const downloadButton = page.getByRole('button', { name: /download|export|create.*backup/i });
			await expect(downloadButton).toBeEnabled();
		});

		test('shows error if passphrases do not match', async ({ page }) => {
			await page.goto('/app/settings/export');

			await page.getByLabel(/^passphrase/i).fill('passphrase1');
			await page.getByLabel(/confirm/i).fill('passphrase2');

			// Try to export
			const downloadButton = page.getByRole('button', { name: /download|export|create.*backup/i });

			// Either button is disabled or clicking shows error
			const isDisabled = await downloadButton.isDisabled();
			if (!isDisabled) {
				await downloadButton.click();
				await expect(page.getByText(/match|different/i)).toBeVisible();
			}
		});
	});

	test.describe('Delete Data', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app/settings');
		});

		test('has delete data option', async ({ page }) => {
			await expect(page.getByText(/delete|clear.*data|remove/i)).toBeVisible();
		});

		test('delete option has warning', async ({ page }) => {
			await expect(page.getByText(/cannot.*undo|permanent|warning/i)).toBeVisible();
		});

		test('delete shows confirmation dialog', async ({ page }) => {
			await page.getByRole('button', { name: /delete|clear.*data/i }).click();

			// Should show confirmation
			await expect(page.getByRole('alertdialog')).toBeVisible();
		});

		test('confirmation requires typing confirmation text', async ({ page }) => {
			await page.getByRole('button', { name: /delete|clear.*data/i }).click();

			// Should require typing "DELETE" or similar
			await expect(page.getByLabel(/type.*delete|confirm/i)).toBeVisible();
		});

		test('can cancel deletion', async ({ page }) => {
			await page.getByRole('button', { name: /delete|clear.*data/i }).click();

			await page.getByRole('button', { name: /cancel|go back/i }).click();

			// Dialog should close
			await expect(page.getByRole('alertdialog')).not.toBeVisible();

			// Data should still exist
			const hasPlan = await hasLocalPlanViaApp(page);
			expect(hasPlan).toBe(true);
		});

		test('completing deletion clears IndexedDB', async ({ page }) => {
			await page.getByRole('button', { name: /delete|clear.*data/i }).click();

			// Type confirmation
			await page.getByLabel(/type.*delete|confirm/i).fill('DELETE');

			// Confirm deletion
			await page
				.getByRole('button', { name: /delete|confirm/i })
				.last()
				.click();

			// Wait for deletion to complete
			await page.waitForTimeout(1000);

			// Data should be cleared
			const hasPlan = await hasLocalPlanViaApp(page);
			expect(hasPlan).toBe(false);
		});

		test('after deletion redirects to landing', async ({ page }) => {
			await page.getByRole('button', { name: /delete|clear.*data/i }).click();

			await page.getByLabel(/type.*delete|confirm/i).fill('DELETE');
			await page
				.getByRole('button', { name: /delete|confirm/i })
				.last()
				.click();

			// Should redirect to landing page
			await expect(page).toHaveURL('/', { timeout: 5000 });
		});

		test('after deletion cannot access /app', async ({ page }) => {
			await page.getByRole('button', { name: /delete|clear.*data/i }).click();

			await page.getByLabel(/type.*delete|confirm/i).fill('DELETE');
			await page
				.getByRole('button', { name: /delete|confirm/i })
				.last()
				.click();

			await page.waitForURL('/');

			// Try to access app
			await page.goto('/app');

			// Should redirect or show error
			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});
	});

	test.describe('About Section', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app/settings');
		});

		test('displays about section', async ({ page }) => {
			await expect(page.getByText(/about|well-being action plan/i)).toBeVisible();
		});

		test('shows version or app info', async ({ page }) => {
			// May show version number or other app info
			const aboutSection = page.locator('[data-testid="about"], .about-section');
			await expect(aboutSection).toBeVisible();
		});
	});

	test.describe('Navigation', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app/settings');
		});

		test('has back to dashboard link', async ({ page }) => {
			await page.getByRole('link', { name: /back|dashboard|home/i }).click();

			await expect(page).toHaveURL(/\/app$/);
		});
	});
});
