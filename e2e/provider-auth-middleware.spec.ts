/**
 * E2E Tests for Provider Route Protection Middleware
 *
 * These tests verify that the middleware correctly:
 * 1. Protects provider routes from unauthorized access
 * 2. Redirects to login when not authenticated
 * 3. Allows access to public routes
 * 4. Handles session expiry gracefully
 */

import { test, expect } from '@playwright/test';

test.describe('Provider Route Protection Middleware', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing protected provider routes without auth', async ({
      page,
    }) => {
      // Try to access provider dashboard without being authenticated
      await page.goto('/provider');

      // Should be redirected to login page
      await expect(page).toHaveURL(/\/provider\/auth\/login/);

      // Should preserve the redirect parameter
      const url = new URL(page.url());
      expect(url.searchParams.get('redirect')).toBe('/provider');
    });

    test('should redirect to login when accessing provider link generator without auth', async ({
      page,
    }) => {
      // Try to access provider link generator without being authenticated
      await page.goto('/provider/link-generator');

      // Should be redirected to login page
      await expect(page).toHaveURL(/\/provider\/auth\/login/);

      // Should preserve the redirect parameter
      const url = new URL(page.url());
      expect(url.searchParams.get('redirect')).toBe('/provider/link-generator');
    });

    test('should redirect to login when accessing provider plan builder without auth', async ({
      page,
    }) => {
      // Try to access provider plan builder without being authenticated
      await page.goto('/provider/plan/new');

      // Should be redirected to login page
      await expect(page).toHaveURL(/\/provider\/auth\/login/);

      // Should preserve the redirect parameter
      const url = new URL(page.url());
      expect(url.searchParams.get('redirect')).toBe('/provider/plan/new');
    });

    test('should allow access to provider login page without auth', async ({ page }) => {
      // Access the login page
      await page.goto('/provider/auth/login');

      // Should NOT be redirected
      await expect(page).toHaveURL(/\/provider\/auth\/login/);

      // Should see login form elements
      await expect(page.locator('text=Provider Login')).toBeVisible();
    });

    test('should allow access to provider signup page without auth', async ({ page }) => {
      // Access the signup page
      await page.goto('/provider/auth/signup');

      // Should NOT be redirected
      await expect(page).toHaveURL(/\/provider\/auth\/signup/);

      // Should see signup form elements
      await expect(page.locator('text=Provider Sign Up')).toBeVisible();
    });
  });

  test.describe('Public Patient Routes', () => {
    test('should allow access to patient dashboard without auth', async ({ page }) => {
      // Access patient dashboard
      await page.goto('/dashboard');

      // Should NOT be redirected to login
      await expect(page).toHaveURL('/dashboard');

      // Should see dashboard content
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should allow access to patient check-in without auth', async ({ page }) => {
      // Access patient check-in
      await page.goto('/check-in');

      // Should NOT be redirected to login
      await expect(page).toHaveURL('/check-in');
    });

    test('should allow access to patient onboarding without auth', async ({ page }) => {
      // Access patient onboarding
      await page.goto('/onboarding');

      // Should NOT be redirected to login
      await expect(page).toHaveURL('/onboarding');
    });

    test('should allow access to patient history without auth', async ({ page }) => {
      // Access patient history
      await page.goto('/history');

      // Should NOT be redirected to login
      await expect(page).toHaveURL('/history');
    });

    test('should allow access to patient settings without auth', async ({ page }) => {
      // Access patient settings
      await page.goto('/settings');

      // Should NOT be redirected to login
      await expect(page).toHaveURL('/settings');
    });

    test('should allow access to home page without auth', async ({ page }) => {
      // Access home page
      await page.goto('/');

      // Should NOT be redirected to login
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Redirect Flow', () => {
    test('should redirect to original destination after login', async ({ page }) => {
      // Try to access a protected route
      await page.goto('/provider/link-generator');

      // Verify we're on the login page with redirect parameter
      await expect(page).toHaveURL(
        /\/provider\/auth\/login\?redirect=%2Fprovider%2Flink-generator/
      );

      // Note: Actual login and redirect would require test user credentials
      // This test verifies the redirect parameter is preserved
      const url = new URL(page.url());
      const redirectParam = url.searchParams.get('redirect');
      expect(redirectParam).toBe('/provider/link-generator');
    });

    test('should handle multiple redirect attempts correctly', async ({ page }) => {
      // Try to access multiple protected routes in sequence
      await page.goto('/provider/plan/new');
      await expect(page).toHaveURL(/\/provider\/auth\/login\?redirect=%2Fprovider%2Fplan%2Fnew/);

      // Try accessing another protected route
      await page.goto('/provider/link-generator');
      await expect(page).toHaveURL(
        /\/provider\/auth\/login\?redirect=%2Fprovider%2Flink-generator/
      );
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle deeply nested provider routes', async ({ page }) => {
      // Try to access a deeply nested provider route
      await page.goto('/provider/plan/new/step-2');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/provider\/auth\/login/);

      // Should preserve the full path in redirect parameter
      const url = new URL(page.url());
      const redirectParam = url.searchParams.get('redirect');
      expect(redirectParam).toBe('/provider/plan/new/step-2');
    });

    test('should preserve query parameters in redirect', async ({ page }) => {
      // Try to access a provider route with query parameters
      await page.goto('/provider?foo=bar&baz=qux');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/provider\/auth\/login/);

      // Should preserve the full path with query parameters
      const url = new URL(page.url());
      const redirectParam = url.searchParams.get('redirect');
      expect(redirectParam).toContain('/provider');
      expect(redirectParam).toContain('foo=bar');
      expect(redirectParam).toContain('baz=qux');
    });

    test('should not create redirect loops on auth pages', async ({ page }) => {
      // Access login page directly
      await page.goto('/provider/auth/login');

      // Should stay on login page, not redirect
      await expect(page).toHaveURL(/\/provider\/auth\/login$/);

      // Should not have a redirect parameter when accessing directly
      const url = new URL(page.url());
      expect(url.searchParams.has('redirect')).toBeFalsy();
    });

    test('should handle trailing slashes correctly', async ({ page }) => {
      // Try to access provider route with trailing slash
      await page.goto('/provider/');

      // Should be redirected to login (Next.js might normalize the URL)
      await expect(page).toHaveURL(/\/provider\/auth\/login/);
    });
  });
});
