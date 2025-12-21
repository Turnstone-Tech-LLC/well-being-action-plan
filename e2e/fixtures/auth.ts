/**
 * Authentication fixtures and helpers for E2E tests.
 *
 * Note: Since Supabase auth requires actual database state and magic links,
 * these tests are designed to work with the UI states rather than fully
 * authenticated sessions. For full auth testing, you would need:
 * 1. A test database with seeded provider profiles
 * 2. Mock email service or direct token generation
 * 3. API mocking with MSW or similar
 */

import type { Page } from '@playwright/test';

/**
 * Test provider credentials.
 * These are for demonstration - actual auth tests require database seeding.
 */
export const TEST_PROVIDER = {
	email: 'test-provider@example.com',
	name: 'Test Provider',
	role: 'provider' as const
};

export const TEST_ADMIN = {
	email: 'test-admin@example.com',
	name: 'Test Admin',
	role: 'admin' as const
};

/**
 * Navigate to the provider login page.
 */
export async function goToProviderLogin(page: Page): Promise<void> {
	await page.goto('/auth');
}

/**
 * Fill in the provider login form with an email.
 */
export async function fillLoginForm(page: Page, email: string): Promise<void> {
	await page.getByLabel(/email/i).fill(email);
}

/**
 * Submit the provider login form.
 */
export async function submitLoginForm(page: Page): Promise<void> {
	await page.getByRole('button', { name: /send.*link/i }).click();
}

/**
 * Attempt to login as a provider (form submission only).
 * Note: This does not complete actual authentication - it submits the form.
 */
export async function attemptProviderLogin(page: Page, email: string): Promise<void> {
	await goToProviderLogin(page);
	await fillLoginForm(page, email);
	await submitLoginForm(page);
}

/**
 * Check if the user is on the verify page (check email page).
 */
export async function isOnVerifyPage(page: Page): Promise<boolean> {
	try {
		await page.waitForURL(/\/auth\/verify/, { timeout: 5000 });
		return true;
	} catch {
		return false;
	}
}

/**
 * Check if the user is redirected to the provider dashboard.
 */
export async function isOnProviderDashboard(page: Page): Promise<boolean> {
	try {
		await page.waitForURL(/\/provider$/, { timeout: 5000 });
		return true;
	} catch {
		return false;
	}
}

/**
 * Wait for the page to show an error message.
 */
export async function waitForLoginError(page: Page): Promise<string | null> {
	try {
		const errorElement = page.locator('[role="alert"], .error-message');
		await errorElement.waitFor({ state: 'visible', timeout: 5000 });
		return await errorElement.textContent();
	} catch {
		return null;
	}
}

/**
 * Navigate to logout endpoint and verify logout.
 */
export async function logout(page: Page): Promise<void> {
	await page.goto('/auth/logout');
	await page.waitForURL('/auth', { timeout: 5000 });
}
