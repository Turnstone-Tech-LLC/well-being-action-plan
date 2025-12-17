import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
	test('loads with hero section and headline', async ({ page }) => {
		await page.goto('/');

		// Verify h1 is visible
		const h1 = page.locator('h1');
		await expect(h1).toBeVisible();
		await expect(h1).toHaveText('My Well-Being Action Plan');
	});

	test('displays tagline', async ({ page }) => {
		await page.goto('/');

		const tagline = page.getByText('For feeling confident, resilient, and connected.');
		await expect(tagline).toBeVisible();
	});

	test('displays privacy message', async ({ page }) => {
		await page.goto('/');

		const privacyMessage = page.getByText(/Your action plan is private and stays on your device/);
		await expect(privacyMessage).toBeVisible();
	});

	test('has Load My Plan CTA button', async ({ page }) => {
		await page.goto('/');

		const ctaButton = page.getByRole('link', { name: 'Load My Plan' });
		await expect(ctaButton).toBeVisible();
		await expect(ctaButton).toHaveAttribute('href', '/scan');
	});

	test('has QR code supporting text', async ({ page }) => {
		await page.goto('/');

		const supportingText = page.getByText(/Have a QR code\? You can scan it with your camera/);
		await expect(supportingText).toBeVisible();
	});

	test('Load My Plan button navigates to scan page', async ({ page }) => {
		await page.goto('/');

		await page.getByRole('link', { name: 'Load My Plan' }).click();

		await expect(page).toHaveURL('/scan');
	});

	test('has proper meta title', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveTitle('Well-Being Action Plan');
	});
});
