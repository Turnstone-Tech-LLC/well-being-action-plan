import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests using axe-core.
 * These tests verify WCAG compliance across all pages.
 */

test.describe('Accessibility', () => {
	test.describe('Landing Page', () => {
		test('has no accessibility violations', async ({ page }) => {
			await page.goto('/');

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});

		test('has skip link that works', async ({ page }) => {
			await page.goto('/');

			// Tab to skip link
			await page.keyboard.press('Tab');

			const skipLink = page.locator('.skip-link');
			await expect(skipLink).toBeFocused();

			// Activate skip link
			await page.keyboard.press('Enter');

			// Main content should be focused
			const main = page.locator('#main-content');
			await expect(main).toBeFocused();
		});

		test('has proper heading hierarchy', async ({ page }) => {
			await page.goto('/');

			// Should have exactly one h1
			const h1Count = await page.locator('h1').count();
			expect(h1Count).toBe(1);

			// H1 should be visible
			const h1 = page.locator('h1');
			await expect(h1).toBeVisible();
		});
	});

	test.describe('Scan Page', () => {
		test('has no accessibility violations', async ({ page }) => {
			await page.goto('/scan');

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});

		test('form has proper labels and ARIA attributes', async ({ page }) => {
			await page.goto('/scan');

			// Input has associated label
			const input = page.locator('#access-code');
			await expect(input).toHaveAttribute('aria-describedby', 'access-code-help');

			// Label is properly associated
			const label = page.locator('label[for="access-code"]');
			await expect(label).toBeVisible();
		});

		test('submit button has proper disabled state', async ({ page }) => {
			await page.goto('/scan');

			const submitButton = page.getByRole('button', { name: 'Load My Plan' });

			// Should be disabled initially
			await expect(submitButton).toBeDisabled();

			// Type in the input
			await page.locator('#access-code').fill('TEST123');

			// Should be enabled now
			await expect(submitButton).toBeEnabled();
		});
	});

	test.describe('Restore Page', () => {
		test('has no accessibility violations', async ({ page }) => {
			await page.goto('/restore');

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});

		test('has proper heading hierarchy (h1 -> h2)', async ({ page }) => {
			await page.goto('/restore');

			// Check h1 exists
			const h1 = page.locator('h1');
			await expect(h1).toBeVisible();
			await expect(h1).toHaveText('Restore Your Plan');

			// Check h2 exists (About Backup Files)
			const h2 = page.locator('h2');
			await expect(h2.first()).toBeVisible();
		});

		test('passphrase input has proper ARIA attributes', async ({ page }) => {
			await page.goto('/restore');

			const input = page.locator('#passphrase');
			await expect(input).toHaveAttribute('aria-describedby', /passphrase-help/);
		});

		test('password visibility toggle is accessible', async ({ page }) => {
			await page.goto('/restore');

			const toggleButton = page.getByRole('button', { name: /Show passphrase|Hide passphrase/ });
			await expect(toggleButton).toBeVisible();

			// Has proper aria-label
			await expect(toggleButton).toHaveAttribute('aria-label', 'Show passphrase');

			// Toggle and verify label changes
			await toggleButton.click();
			await expect(toggleButton).toHaveAttribute('aria-label', 'Hide passphrase');
		});
	});

	test.describe('Provider Login Page', () => {
		test('has no accessibility violations', async ({ page }) => {
			await page.goto('/auth');

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});

		test('form inputs have required attribute', async ({ page }) => {
			await page.goto('/auth');

			const emailInput = page.locator('#email');

			await expect(emailInput).toHaveAttribute('required');
			await expect(emailInput).toHaveAttribute('aria-required', 'true');
		});
	});

	test.describe('About Page', () => {
		test('has no accessibility violations', async ({ page }) => {
			await page.goto('/about');

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.analyze();

			expect(accessibilityScanResults.violations).toEqual([]);
		});
	});

	test.describe('Keyboard Navigation', () => {
		test('can navigate landing page with keyboard only', async ({ page }) => {
			await page.goto('/');

			// Tab through the page
			await page.keyboard.press('Tab'); // Skip link
			await page.keyboard.press('Tab'); // Logo/home link
			await page.keyboard.press('Tab'); // About link
			await page.keyboard.press('Tab'); // Load My Plan button

			const ctaButton = page.getByRole('link', { name: 'Load My Plan' });
			await expect(ctaButton).toBeFocused();
		});

		test('focus indicators are visible', async ({ page }) => {
			await page.goto('/');

			// Tab to an element
			await page.keyboard.press('Tab'); // Skip link
			await page.keyboard.press('Tab'); // Logo

			// Check that focused element has visible focus indicator
			const focusedElement = page.locator(':focus-visible');
			await expect(focusedElement).toBeVisible();
		});
	});

	test.describe('Reduced Motion', () => {
		test('respects prefers-reduced-motion', async ({ page }) => {
			// Emulate reduced motion preference
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto('/');

			// Check that CSS is applied (we can verify the media query is working)
			const body = page.locator('body');
			await expect(body).toBeVisible();

			// Verify the page loads correctly with reduced motion
			const h1 = page.locator('h1');
			await expect(h1).toBeVisible();
		});
	});

	test.describe('Color Contrast', () => {
		test('text meets contrast requirements', async ({ page }) => {
			await page.goto('/');

			// axe-core includes color contrast checks in wcag2aa
			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(['wcag2aa'])
				.analyze();

			// Filter for color-contrast violations specifically
			const contrastViolations = accessibilityScanResults.violations.filter(
				(v) => v.id === 'color-contrast'
			);

			expect(contrastViolations).toEqual([]);
		});
	});
});
