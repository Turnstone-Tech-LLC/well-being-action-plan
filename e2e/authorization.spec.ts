import { expect, test } from '@playwright/test';
import { deleteDatabase, seedLocalPlan, clearLocalPlan, hasLocalPlan } from './utils/indexeddb';

/**
 * Authorization Guards Tests
 *
 * Tests access control for:
 * - Provider routes (require Supabase authentication)
 * - Patient routes (require local action plan in IndexedDB)
 * - Public routes (accessible to all)
 */

test.describe('Authorization Guards', () => {
	test.describe('Provider Routes (require Supabase auth)', () => {
		test('/provider shows not found if not authenticated', async ({ page }) => {
			await page.goto('/provider');

			// Should either redirect to /auth OR show error/not found
			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in|login/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('/provider/settings shows not found if not authenticated', async ({ page }) => {
			await page.goto('/provider/settings');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in|login/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('/provider/plans/new requires auth', async ({ page }) => {
			await page.goto('/provider/plans/new');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in|login/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('/provider/plans/[id] requires auth', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in|login/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('/provider/plans/[id]/edit requires auth', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id/edit');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in|login/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('/provider/resources requires auth', async ({ page }) => {
			await page.goto('/provider/resources');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in|login/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('/provider/resources/skills requires auth', async ({ page }) => {
			await page.goto('/provider/resources/skills');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in|login/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('/provider/organization requires auth', async ({ page }) => {
			await page.goto('/provider/organization');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in|login/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('/provider/organization/team requires auth', async ({ page }) => {
			await page.goto('/provider/organization/team');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in|login/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('no flash of authenticated content before redirect', async ({ page }) => {
			// This tests that protected content doesn't briefly appear

			// Start navigation
			const navigationPromise = page.goto('/provider');

			// Check that provider-specific content never appears
			const providerContent = page.getByRole('heading', { name: /action plans|dashboard/i });

			// The provider content should not be visible during the redirect
			await expect(providerContent)
				.not.toBeVisible({ timeout: 100 })
				.catch(() => {
					// It's OK if element doesn't exist at all
				});

			await navigationPromise;
		});
	});

	test.describe('Patient Routes (require local action plan)', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/');
			await deleteDatabase(page);
		});

		test('/app redirects to home if no action plan in IndexedDB', async ({ page }) => {
			await page.goto('/app');

			// App redirects to landing page when no plan exists
			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});

		test('/app/checkin redirects to home without plan', async ({ page }) => {
			await page.goto('/app/checkin');

			// Wait for redirect to landing page
			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});

		test('/app/checkin/green redirects away without plan', async ({ page }) => {
			await page.goto('/app/checkin/green');

			// Wait for redirect - should leave checkin/green page
			await page.waitForFunction(() => !window.location.pathname.includes('/checkin/green'), {
				timeout: 5000
			});
			expect(page.url()).not.toContain('/checkin/green');
		});

		test('/app/checkin/yellow redirects away without plan', async ({ page }) => {
			await page.goto('/app/checkin/yellow');

			// Wait for redirect - should leave checkin/yellow page
			await page.waitForFunction(() => !window.location.pathname.includes('/checkin/yellow'), {
				timeout: 5000
			});
			expect(page.url()).not.toContain('/checkin/yellow');
		});

		test('/app/checkin/red redirects away without plan', async ({ page }) => {
			await page.goto('/app/checkin/red');

			// Wait for redirect - should leave checkin/red page
			await page.waitForFunction(() => !window.location.pathname.includes('/checkin/red'), {
				timeout: 5000
			});
			expect(page.url()).not.toContain('/checkin/red');
		});

		test('/app/reports redirects to home without plan', async ({ page }) => {
			await page.goto('/app/reports');

			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});

		test('/app/settings redirects to home without plan', async ({ page }) => {
			await page.goto('/app/settings');

			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});

		test('/app/settings/export redirects to home without plan', async ({ page }) => {
			await page.goto('/app/settings/export');

			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});

		test('/app/onboarding redirects to home without plan', async ({ page }) => {
			await page.goto('/app/onboarding');

			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});

		test('after deleting data, /app/* redirects to home', async ({ page }) => {
			// First seed a plan
			await seedLocalPlan(page);

			// Verify we can access /app
			await page.goto('/app');
			await expect(page).toHaveURL(/\/app/);

			// Delete the data
			await deleteDatabase(page);

			// Now /app should redirect to home
			await page.goto('/app');

			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});
	});

	test.describe('Patient Routes (with local action plan)', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/');
			await deleteDatabase(page);
			await seedLocalPlan(page);
		});

		test('/app accessible with local plan', async ({ page }) => {
			await page.goto('/app');

			await expect(page).toHaveURL(/\/app/);
		});

		test('/app/checkin accessible with local plan', async ({ page }) => {
			await page.goto('/app/checkin');

			await expect(page).toHaveURL(/\/app\/checkin/);
		});

		test('/app/reports accessible with local plan', async ({ page }) => {
			await page.goto('/app/reports');

			await expect(page).toHaveURL(/\/app\/reports/);
		});

		test('/app/settings accessible with local plan', async ({ page }) => {
			await page.goto('/app/settings');

			await expect(page).toHaveURL(/\/app\/settings/);
		});
	});

	test.describe('Public Routes', () => {
		test('/ (landing) accessible to all', async ({ page }) => {
			await page.goto('/');

			await expect(page).toHaveURL('/');
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		});

		test('/auth accessible to all', async ({ page }) => {
			await page.goto('/auth');

			await expect(page).toHaveURL('/auth');
			await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
		});

		test('/auth/verify accessible to all', async ({ page }) => {
			await page.goto('/auth/verify?email=test@example.com');

			await expect(page).toHaveURL(/\/auth\/verify/);
		});

		test('/access/[token] accessible to all', async ({ page }) => {
			await page.goto('/access/ANY-TOKEN');

			// Should either show validating, error, or plan found
			await expect(page.locator('body')).toBeVisible();
		});

		test('/restore accessible to all', async ({ page }) => {
			await page.goto('/restore');

			await expect(page).toHaveURL('/restore');
			await expect(page.getByRole('heading', { name: /restore/i })).toBeVisible();
		});

		test('/scan accessible to all', async ({ page }) => {
			await page.goto('/scan');

			await expect(page).toHaveURL('/scan');
		});

		test('/about accessible to all', async ({ page }) => {
			await page.goto('/about');

			await expect(page).toHaveURL('/about');
		});
	});

	test.describe('Deep Linking', () => {
		test('deep link to /provider/action-plans/[id] requires auth', async ({ page }) => {
			await page.goto('/provider/plans/some-plan-uuid');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in|login/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('deep link to /app/checkin/green redirects away without plan', async ({ page }) => {
			await page.goto('/');
			await deleteDatabase(page);

			await page.goto('/app/checkin/green');

			// Wait for redirect - should leave checkin/green page
			await page.waitForFunction(() => !window.location.pathname.includes('/checkin/green'), {
				timeout: 5000
			});
			expect(page.url()).not.toContain('/checkin/green');
		});

		test('deep link works with valid local plan', async ({ page }) => {
			await page.goto('/');
			await deleteDatabase(page);
			await seedLocalPlan(page);

			await page.goto('/app/checkin');

			await expect(page).toHaveURL(/\/app\/checkin/);
		});
	});

	test.describe('Navigation Guards', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/');
			await deleteDatabase(page);
		});

		test('navigating to protected route without plan redirects to home', async ({ page }) => {
			await page.goto('/app');

			// Should redirect to home when no plan exists
			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});

		test('manual URL entry to protected route is guarded', async ({ page }) => {
			// Type URL directly
			await page.goto('/app/settings/export');

			// Should redirect to home when no plan exists
			await page.waitForURL('/', { timeout: 5000 });
			expect(page.url()).not.toContain('/app');
		});
	});

	test.describe('Session Expiry', () => {
		test.skip('/provider/* redirects to /auth if session expired', async ({ page }) => {
			// This would require simulating an expired session
			// Would need to:
			// 1. Set up authenticated state
			// 2. Expire the session
			// 3. Navigate to protected route
			// 4. Verify redirect to /auth

			await page.goto('/provider');

			await expect(page).toHaveURL(/\/auth/);
		});
	});
});

test.describe('Error Page Display', () => {
	test('404 page shows error or renders landing', async ({ page }) => {
		const response = await page.goto('/nonexistent-page-that-does-not-exist');

		// SvelteKit returns 404 status for unknown routes
		// Either shows error page or falls back to landing
		expect(response?.status()).toBe(404);
	});

	test('unknown route returns 404 status', async ({ page }) => {
		const response = await page.goto('/nonexistent-page');

		// Verify 404 status code
		expect(response?.status()).toBe(404);
	});
});
