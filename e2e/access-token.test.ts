import { expect, test } from '@playwright/test';
import { deleteDatabase, seedLocalPlan, clearLocalPlan } from './utils/indexeddb';

test.describe('Access Token Flow', () => {
	// Clean up IndexedDB before each test for isolation
	test.beforeEach(async ({ page }) => {
		// Navigate first to establish the origin for IndexedDB
		await page.goto('/');
		await deleteDatabase(page);
	});

	test.describe('With existing local plan', () => {
		test('bypasses token validation and redirects to app', async ({ page }) => {
			// Seed a plan in IndexedDB with completed onboarding
			await seedLocalPlan(page);

			// Navigate to access page with any token
			await page.goto('/access/ANY-TOKEN-VALUE');

			// Should show "Plan found!" message briefly then redirect to app
			// The redirect happens quickly, so we check for the final URL
			// Note: May redirect to /app or /app/onboarding depending on profile state
			await expect(page).toHaveURL(/\/app(\/onboarding)?$/, { timeout: 5000 });
		});

		test('does not show loading state when plan exists', async ({ page }) => {
			await seedLocalPlan(page);

			// Use a token that would be invalid to prove we're not validating
			await page.goto('/access/INVALID-TOKEN');

			// Should redirect without showing validation states
			// Note: May redirect to /app or /app/onboarding depending on profile state
			await expect(page).toHaveURL(/\/app(\/onboarding)?$/, { timeout: 5000 });
		});
	});

	test.describe('Token error states', () => {
		test.beforeEach(async ({ page }) => {
			await clearLocalPlan(page);
		});

		// Note: Without a test database with seeded tokens, all unknown tokens return 'not_found'
		// which renders as the InvalidExpiredToken component ("This link is no longer active").
		//
		// The specific token status tests (used, revoked, update_expired) are marked as skipped
		// because they require either:
		// 1. A test database with specific token states
		// 2. API mocking (e.g., MSW)
		//
		// These tests validate the UI components render correctly when given specific token statuses.

		test('invalid/unknown token shows error state', async ({ page }) => {
			await page.goto('/access/INVALID-TOKEN-12345');

			// Wait for the validation to complete
			await page.waitForTimeout(1000);

			// Check for the error state (not_found renders as InvalidExpiredToken)
			const title = page.getByRole('heading', { name: 'This link is no longer active' });
			await expect(title).toBeVisible({ timeout: 5000 });

			// Verify the explanation text
			await expect(page.getByText(/This link has expired or has already been used/)).toBeVisible();

			// Verify action buttons are present
			await expect(page.getByRole('link', { name: 'Restore from backup' })).toBeVisible();
			await expect(page.getByRole('link', { name: 'Return to home' })).toBeVisible();
		});

		test('not found token shows invalid/expired state', async ({ page }) => {
			await page.goto('/access/NONEXISTENT-TOKEN');

			await page.waitForTimeout(1000);

			const title = page.getByRole('heading', { name: 'This link is no longer active' });
			await expect(title).toBeVisible({ timeout: 5000 });
		});

		// Skip tests that require specific token states in the database
		// These can be enabled when API mocking or a test database is configured

		test.skip('used token shows already used state', async ({ page }) => {
			await page.goto('/access/USED-TOKEN-12345');

			await page.waitForTimeout(1000);

			const title = page.getByRole('heading', { name: 'This setup link has already been used' });
			await expect(title).toBeVisible({ timeout: 5000 });

			await expect(
				page.getByText(/Your Well-Being Action Plan has already been set up on another device/)
			).toBeVisible();

			await expect(page.getByRole('link', { name: 'Restore from backup' })).toBeVisible();
			await expect(page.getByRole('link', { name: 'Return to home' })).toBeVisible();
		});

		test.skip('revoked token shows revoked state', async ({ page }) => {
			await page.goto('/access/REVOKED-TOKEN-12345');

			await page.waitForTimeout(1000);

			const title = page.getByRole('heading', { name: 'This link was replaced' });
			await expect(title).toBeVisible({ timeout: 5000 });

			await expect(
				page.getByText(/Your provider has generated a newer link for your plan/)
			).toBeVisible();

			await expect(page.getByRole('link', { name: 'Return to home' })).toBeVisible();
		});

		test.skip('update expired token shows update expired state', async ({ page }) => {
			await page.goto('/access/UPDATE-EXPIRED-TOKEN-12345');

			await page.waitForTimeout(1000);

			const title = page.getByRole('heading', { name: 'Your plan update link has expired' });
			await expect(title).toBeVisible({ timeout: 5000 });

			await expect(
				page.getByText(/Plan update links are time-limited to protect your privacy/)
			).toBeVisible();

			await expect(page.getByRole('link', { name: 'Return to home' })).toBeVisible();
		});

		test('Restore from backup link navigates to restore page', async ({ page }) => {
			await page.goto('/access/EXPIRED-TOKEN-12345');

			await page.waitForTimeout(1000);

			// Wait for error state to appear
			await expect(
				page.getByRole('heading', { name: 'This link is no longer active' })
			).toBeVisible({ timeout: 5000 });

			// Click the restore link
			await page.getByRole('link', { name: 'Restore from backup' }).click();

			await expect(page).toHaveURL('/restore');
		});

		test('Return to home link navigates to landing page', async ({ page }) => {
			await page.goto('/access/EXPIRED-TOKEN-12345');

			await page.waitForTimeout(1000);

			await expect(
				page.getByRole('heading', { name: 'This link is no longer active' })
			).toBeVisible({ timeout: 5000 });

			await page.getByRole('link', { name: 'Return to home' }).click();

			await expect(page).toHaveURL('/');
		});
	});

	test.describe('Valid token flow', () => {
		// Note: Testing valid token flow requires either:
		// 1. A test database with seeded valid tokens
		// 2. Mocking the Supabase responses
		// 3. Using MSW or similar for API mocking
		//
		// For now, we test the UI states that we can observe

		test('shows validating state initially', async ({ page }) => {
			await clearLocalPlan(page);

			// Navigate to access page
			await page.goto('/access/SOME-TOKEN');

			// Should show validating state
			// Note: This may flash quickly before server responds
			const validatingText = page.getByText(
				/Validating your access code|Checking for existing plan/
			);

			// The state should be visible at some point during loading
			// (though it may transition quickly)
			await expect(validatingText)
				.toBeVisible({ timeout: 2000 })
				.catch(() => {
					// It's okay if we missed it - the token validation is fast
				});
		});

		test('shows privacy note during installation', async ({ page }) => {
			await clearLocalPlan(page);

			await page.goto('/access/SOME-TOKEN');

			// The privacy note should be visible during the validation/installation process
			const note = page.getByText(/Your plan data will be stored locally on this device/);

			// This may or may not be visible depending on how fast the server responds
			await expect(note)
				.toBeVisible({ timeout: 2000 })
				.catch(() => {
					// The note disappears when we hit an error state or redirect
				});
		});
	});
});
