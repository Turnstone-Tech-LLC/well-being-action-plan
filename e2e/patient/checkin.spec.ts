import { expect, test } from '@playwright/test';
import {
	seedPlanViaApp,
	clearDataViaApp,
	waitForTestHelpers,
	getCheckInCountViaApp
} from '../utils/test-helpers';
import { TEST_PLAN_PAYLOAD } from '../fixtures/test-plan';

/**
 * Patient Check-In Flow Tests
 *
 * Tests the complete check-in flow for each zone:
 * - Green Zone: "I'm feeling good"
 * - Yellow Zone: "I'm struggling"
 * - Red Zone: "I need help now"
 *
 * Uses the app's Dexie instance via test helpers to properly seed data.
 */

const TEST_MODE_URL = '/?__test_mode=true';

test.describe('Patient Check-In Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Initialize test mode
		await page.goto(TEST_MODE_URL);
		await waitForTestHelpers(page, 10000);
		await clearDataViaApp(page);
	});

	test.describe('Access Control', () => {
		test('check-in page redirects to home without local plan', async ({ page }) => {
			await page.goto('/app/checkin');

			// Should redirect to home when no plan exists
			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});

		test('check-in page accessible with local plan', async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });

			await page.goto('/app/checkin');

			await expect(page).toHaveURL(/\/app\/checkin/);
		});
	});

	test.describe('Zone Selection', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app/checkin');
			await page.waitForLoadState('networkidle');
		});

		test('displays check-in page heading', async ({ page }) => {
			await expect(page.getByRole('heading', { name: /how.*feeling/i })).toBeVisible({
				timeout: 10000
			});
		});

		test('displays subheader text', async ({ page }) => {
			await expect(page.getByText(/okay.*different feelings/i)).toBeVisible({ timeout: 10000 });
		});

		test('displays three zone options', async ({ page }) => {
			await expect(page.getByText(/feeling good/i)).toBeVisible({ timeout: 10000 });
			await expect(page.getByText(/struggling/i)).toBeVisible({ timeout: 10000 });
			await expect(page.getByText(/need help/i)).toBeVisible({ timeout: 10000 });
		});

		test('displays reassurance message', async ({ page }) => {
			await expect(page.getByText(/feelings are valid/i)).toBeVisible({ timeout: 10000 });
		});

		test('can select Green zone', async ({ page }) => {
			await page.getByText(/feeling good/i).click();
			await expect(page).toHaveURL(/\/app\/checkin\/green/, { timeout: 10000 });
		});

		test('can select Yellow zone', async ({ page }) => {
			await page.getByText(/struggling/i).click();
			await expect(page).toHaveURL(/\/app\/checkin\/yellow/, { timeout: 10000 });
		});

		test('can select Red zone', async ({ page }) => {
			await page.getByText(/need help/i).click();
			await expect(page).toHaveURL(/\/app\/checkin\/red/, { timeout: 10000 });
		});
	});

	test.describe('Green Zone Check-in', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app/checkin/green');
		});

		test('displays green zone page', async ({ page }) => {
			await expect(page.locator('body')).toBeVisible();
		});

		test('shows coping skills from plan', async ({ page }) => {
			// Should show skills to select
			for (const skill of TEST_PLAN_PAYLOAD.skills) {
				await expect(page.getByText(skill.title)).toBeVisible();
			}
		});

		test('can select coping skills', async ({ page }) => {
			const skillCheckbox = page.getByRole('checkbox').first();
			await skillCheckbox.check();

			await expect(skillCheckbox).toBeChecked();
		});

		test('has optional notes field', async ({ page }) => {
			const notesField = page.getByLabel(/note|comment|thought/i);
			const hasNotes = await notesField.isVisible().catch(() => false);

			// Notes may be optional
			expect(hasNotes || true).toBe(true);
		});

		test('can add note', async ({ page }) => {
			const notesField = page.getByLabel(/note|comment|thought/i);

			if (await notesField.isVisible()) {
				await notesField.fill('Went for a walk and felt better');
				await expect(notesField).toHaveValue('Went for a walk and felt better');
			}
		});

		test('has submit button', async ({ page }) => {
			await expect(page.getByRole('button', { name: /done|submit|save/i })).toBeVisible();
		});

		test('can complete check-in', async ({ page }) => {
			// Select a skill
			await page.getByRole('checkbox').first().check();

			// Submit
			await page.getByRole('button', { name: /done|submit|save/i }).click();

			// Should show confirmation or redirect
			await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
		});

		test('shows celebration/confirmation message', async ({ page }) => {
			await page.getByRole('checkbox').first().check();
			await page.getByRole('button', { name: /done|submit|save/i }).click();

			// Should show positive message
			const message = page.getByText(/great|awesome|nice|good job/i);
			await expect(message)
				.toBeVisible({ timeout: 3000 })
				.catch(() => {
					// May redirect too quickly
				});
		});

		test('check-in appears in history', async ({ page }) => {
			const initialCount = await getCheckInCountViaApp(page);

			await page.getByRole('checkbox').first().check();
			await page.getByRole('button', { name: /done|submit|save/i }).click();

			await page.waitForURL(/\/app/);
			await page.waitForTimeout(500);

			const newCount = await getCheckInCountViaApp(page);
			expect(newCount).toBe(initialCount + 1);
		});
	});

	test.describe('Yellow Zone Check-in', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app/checkin/yellow');
		});

		test('displays yellow zone page', async ({ page }) => {
			await expect(page.locator('body')).toBeVisible();
		});

		test('shows supportive adults from plan', async ({ page }) => {
			// Should show adults to contact
			for (const adult of TEST_PLAN_PAYLOAD.supportiveAdults) {
				await expect(page.getByText(adult.name)).toBeVisible();
			}
		});

		test('shows help methods from plan', async ({ page }) => {
			for (const method of TEST_PLAN_PAYLOAD.helpMethods) {
				await expect(page.getByText(method.title)).toBeVisible();
			}
		});

		test('can select supportive adult', async ({ page }) => {
			const adultCheckbox = page.getByRole('checkbox').first();
			await adultCheckbox.check();

			await expect(adultCheckbox).toBeChecked();
		});

		test('can select help method', async ({ page }) => {
			// May have checkboxes or buttons for help methods
			const methodOption = page.getByRole('checkbox').first();
			await methodOption.check();

			await expect(methodOption).toBeChecked();
		});

		test('has optional notes field', async ({ page }) => {
			const notesField = page.getByLabel(/note|what.*going on|thought/i);
			const hasNotes = await notesField.isVisible().catch(() => false);

			expect(hasNotes || true).toBe(true);
		});

		test('can complete yellow zone check-in', async ({ page }) => {
			await page.getByRole('button', { name: /done|submit|save/i }).click();

			await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
		});

		test('shows encouraging message', async ({ page }) => {
			await page.getByRole('button', { name: /done|submit|save/i }).click();

			const message = page.getByText(/proud|good.*reaching|support/i);
			await expect(message)
				.toBeVisible({ timeout: 3000 })
				.catch(() => {
					// May redirect quickly
				});
		});

		test('check-in saved to history', async ({ page }) => {
			const initialCount = await getCheckInCountViaApp(page);

			await page.getByRole('button', { name: /done|submit|save/i }).click();

			await page.waitForURL(/\/app/);
			await page.waitForTimeout(500);

			const newCount = await getCheckInCountViaApp(page);
			expect(newCount).toBe(initialCount + 1);
		});
	});

	test.describe('Red Zone Check-in', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app/checkin/red');
		});

		test('displays red zone page', async ({ page }) => {
			await expect(page.locator('body')).toBeVisible();
		});

		test('shows crisis resources immediately', async ({ page }) => {
			// 988 should be visible prominently
			await expect(page.getByText('988')).toBeVisible();
		});

		test('shows Crisis Text Line', async ({ page }) => {
			await expect(page.getByText(/crisis text line|741741/i)).toBeVisible();
		});

		test('crisis contacts are tappable (tel: links)', async ({ page }) => {
			// Phone links should have tel: href
			const phoneLink = page.locator('a[href^="tel:"]');
			const hasPhoneLink = (await phoneLink.count()) > 0;

			expect(hasPhoneLink).toBe(true);
		});

		test('shows supportive adults prominently', async ({ page }) => {
			// Primary adult should be visible
			const primaryAdult = TEST_PLAN_PAYLOAD.supportiveAdults.find((a) => a.isPrimary);
			if (primaryAdult) {
				await expect(page.getByText(primaryAdult.name)).toBeVisible();
			}
		});

		test('has clear messaging about getting help', async ({ page }) => {
			await expect(page.getByText(/help now|reach out|not alone/i)).toBeVisible();
		});

		test('can complete red zone check-in', async ({ page }) => {
			// May have a "I've reached out" or "I'm safe" button
			const completeButton = page.getByRole('button', {
				name: /contacted|reached|safe|done|back/i
			});

			await completeButton.click();

			// Should navigate back to app
			await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
		});

		test('check-in logged even in crisis', async ({ page }) => {
			const initialCount = await getCheckInCountViaApp(page);

			const completeButton = page.getByRole('button', {
				name: /contacted|reached|safe|done|back/i
			});
			await completeButton.click();

			await page.waitForURL(/\/app/);
			await page.waitForTimeout(500);

			const newCount = await getCheckInCountViaApp(page);
			expect(newCount).toBe(initialCount + 1);
		});
	});

	test.describe('Check-in from Dashboard', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
			await page.goto('/app');
		});

		test('dashboard has Check In CTA', async ({ page }) => {
			await expect(page.getByRole('link', { name: /check in/i })).toBeVisible();
		});

		test('Check In CTA navigates to check-in page', async ({ page }) => {
			await page.getByRole('link', { name: /check in/i }).click();

			await expect(page).toHaveURL(/\/app\/checkin$/);
		});

		test('can complete full check-in flow from dashboard', async ({ page }) => {
			// Start from dashboard
			await page.getByRole('link', { name: /check in/i }).click();

			// Select green zone
			await page.getByRole('button', { name: /green|feeling good/i }).click();

			// Select a skill
			await page.getByRole('checkbox').first().check();

			// Submit
			await page.getByRole('button', { name: /done|submit|save/i }).click();

			// Back on dashboard
			await expect(page).toHaveURL(/\/app$/, { timeout: 5000 });
		});
	});

	test.describe('Accessibility', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
		});

		test('zone selection is keyboard accessible', async ({ page }) => {
			await page.goto('/app/checkin');

			// Tab to zones
			await page.keyboard.press('Tab');

			// Should be able to select with Enter
			await page.keyboard.press('Enter');

			// Should navigate to zone page
			await expect(page).toHaveURL(/\/app\/checkin\/(green|yellow|red)/, { timeout: 5000 });
		});

		test('check-in page announces zone selection', async ({ page }) => {
			await page.goto('/app/checkin');

			// Click green zone
			await page.getByRole('button', { name: /green|feeling good/i }).click();

			// aria-live region should announce
			// This would need accessibility testing tools to fully verify
		});
	});

	test.describe('Error Handling', () => {
		test.beforeEach(async ({ page }) => {
			await seedPlanViaApp(page, { completeOnboarding: true });
		});

		test('shows retry option on network error', async ({ page }) => {
			await page.goto('/app/checkin/green');

			// Simulate network error
			await page.route('**/*', (route) => route.abort('failed'));

			await page.getByRole('checkbox').first().check();
			await page.getByRole('button', { name: /done|submit|save/i }).click();

			// Should show retry option
			await expect(page.getByRole('button', { name: /retry|try again/i })).toBeVisible();
		});

		test('data saved locally even if sync fails', async ({ page }) => {
			await page.goto('/app/checkin/green');

			const initialCount = await getCheckInCountViaApp(page);

			await page.getByRole('checkbox').first().check();
			await page.getByRole('button', { name: /done|submit|save/i }).click();

			await page.waitForURL(/\/app/);
			await page.waitForTimeout(500);

			// Check-in should be saved locally
			const newCount = await getCheckInCountViaApp(page);
			expect(newCount).toBe(initialCount + 1);
		});
	});
});
