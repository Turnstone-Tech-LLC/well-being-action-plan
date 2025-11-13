import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Route Protection
 *
 * Tests the dual authentication system:
 * - Provider mode blocking patient routes
 * - Authenticated providers cannot access patient routes
 * - Patient routes protected by onboarding completion
 * - Public routes accessible to all
 */

test.describe('Route Protection', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies before each test
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('Provider Mode Protection', () => {
    test('should block /onboarding when in provider mode', async ({ page }) => {
      // Enable provider mode
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
      });

      // Try to access onboarding
      await page.goto('/onboarding');

      // Should redirect to provider portal with error
      await page.waitForURL('**/provider**');
      expect(page.url()).toContain('/provider');
      expect(page.url()).toContain('error');
    });

    test('should block /dashboard when in provider mode', async ({ page }) => {
      // Enable provider mode
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
      });

      // Try to access dashboard
      await page.goto('/dashboard');

      // Should redirect to provider portal
      await page.waitForURL('**/provider**');
      expect(page.url()).toContain('/provider');
    });

    test('should block /check-in routes when in provider mode', async ({ page }) => {
      // Enable provider mode
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
      });

      // Try to access check-in page
      await page.goto('/check-in');

      // Should redirect to provider portal
      await page.waitForURL('**/provider**');
      expect(page.url()).toContain('/provider');
    });

    test('should block /history when in provider mode', async ({ page }) => {
      // Enable provider mode
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
      });

      // Try to access history page
      await page.goto('/history');

      // Should redirect to provider portal
      await page.waitForURL('**/provider**');
      expect(page.url()).toContain('/provider');
    });

    test('should block /settings when in provider mode', async ({ page }) => {
      // Enable provider mode
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
      });

      // Try to access settings page
      await page.goto('/settings');

      // Should redirect to provider portal
      await page.waitForURL('**/provider**');
      expect(page.url()).toContain('/provider');
    });

    test('should allow access to /provider routes when in provider mode', async ({ page }) => {
      // Enable provider mode
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
      });

      // Try to access provider portal (will redirect to login without auth)
      await page.goto('/provider');

      // Should redirect to provider auth login (since not authenticated)
      await page.waitForURL('**/provider/auth/login**');
      expect(page.url()).toContain('/provider/auth/login');
    });

    test('should redirect to /provider when visiting home in provider mode', async ({ page }) => {
      // Enable provider mode
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
      });

      // Reload home page
      await page.goto('/');

      // Should redirect to provider portal
      await page.waitForURL('**/provider**');
      expect(page.url()).toContain('/provider');
    });
  });

  test.describe('Patient Route Protection', () => {
    test('should redirect to onboarding when accessing dashboard without completion', async ({
      page,
    }) => {
      // Try to access dashboard without completing onboarding
      await page.goto('/dashboard');

      // Should redirect to onboarding or home
      await page.waitForURL(/\/(onboarding|^$)/);
      expect(page.url()).toMatch(/\/(onboarding|localhost:3000\/?$)/);
    });

    test('should redirect to home when accessing dashboard without provider config', async ({
      page,
    }) => {
      // Clear any stored data
      await page.evaluate(() => localStorage.clear());

      // Try to access dashboard
      await page.goto('/dashboard');

      // Should eventually redirect to home (to get access code)
      await page.waitForURL('/');
      expect(page.url()).not.toContain('/dashboard');
    });

    test.skip('should allow dashboard access after onboarding completion', async ({
      page: _page,
    }) => {
      // This test requires setting up a completed onboarding state in IndexedDB
      // For now, we'll test the redirect behavior
      // Example flow:
      // 1. Mock IndexedDB with completed onboarding
      // 2. Navigate to dashboard
      // 3. Should NOT redirect
      // 4. Should show dashboard content
    });
  });

  test.describe('Public Routes', () => {
    test('should allow access to home page without authentication', async ({ page }) => {
      await page.goto('/');

      // Should load successfully
      await expect(page.locator('text=Welcome')).toBeVisible();
      expect(page.url()).toContain('localhost:3000');
    });

    test('should allow access to /link/[slug] without authentication', async ({ page }) => {
      // Try to access a link page
      await page.goto('/link/test-slug');

      // Should not redirect to login
      // (May show error if slug doesn't exist, but that's different from auth)
      expect(page.url()).toContain('/link/');
    });

    test('should allow access to provider auth pages without authentication', async ({ page }) => {
      // Try to access login page
      await page.goto('/provider/auth/login');

      // Should load successfully
      expect(page.url()).toContain('/provider/auth/login');
    });

    test('should allow access to provider signup page', async ({ page }) => {
      // Try to access signup page
      await page.goto('/provider/auth/signup');

      // Should load successfully
      expect(page.url()).toContain('/provider/auth/signup');
    });
  });

  test.describe('Provider Portal Protection', () => {
    test('should redirect to login when accessing /provider without authentication', async ({
      page,
    }) => {
      // Try to access provider portal without auth
      await page.goto('/provider');

      // Should redirect to login
      await page.waitForURL('**/provider/auth/login**');
      expect(page.url()).toContain('/provider/auth/login');
    });

    test('should redirect to login when accessing /provider/links without authentication', async ({
      page,
    }) => {
      // Try to access provider links page without auth
      await page.goto('/provider/links');

      // Should redirect to login
      await page.waitForURL('**/provider/auth/login**');
      expect(page.url()).toContain('/provider/auth/login');
    });

    test('should redirect to login when accessing /provider/link-generator without authentication', async ({
      page,
    }) => {
      // Try to access link generator without auth
      await page.goto('/provider/link-generator');

      // Should redirect to login
      await page.waitForURL('**/provider/auth/login**');
      expect(page.url()).toContain('/provider/auth/login');
    });
  });

  test.describe('Mixed Context Protection', () => {
    test('should prevent accessing patient routes with provider config stored', async ({
      page,
    }) => {
      // Set provider config in localStorage (as if entered access code)
      await page.goto('/');
      await page.evaluate(() => {
        const mockConfig = {
          provider: {
            id: 'test-123',
            name: 'Test Provider',
          },
          copingStrategies: [],
        };
        localStorage.setItem('providerConfig', JSON.stringify(mockConfig));
      });

      // Enable provider mode
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
      });

      // Try to access patient route
      await page.goto('/dashboard');

      // Should redirect to provider portal (provider mode takes precedence)
      await page.waitForURL('**/provider**');
      expect(page.url()).toContain('/provider');
    });

    test('should show error when provider mode blocks patient route', async ({ page }) => {
      // Enable provider mode
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
      });

      // Try to access dashboard
      await page.goto('/dashboard');

      // Should redirect with error parameter
      await page.waitForURL('**/provider**');
      expect(page.url()).toContain('error');
    });
  });

  test.describe('Error Messages', () => {
    test('should display appropriate error when provider mode blocks onboarding', async ({
      page,
    }) => {
      // Enable provider mode
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
        // Also set provider config to simulate coming from access code
        const mockConfig = {
          provider: { id: 'test', name: 'Test' },
          copingStrategies: [],
        };
        localStorage.setItem('providerConfig', JSON.stringify(mockConfig));
      });

      // Try to access onboarding
      await page.goto('/onboarding');

      // Should redirect to provider with error
      await page.waitForURL('**/provider**');
      const url = new URL(page.url());
      const error = url.searchParams.get('error');
      expect(error).toBeTruthy();
      expect(error).toContain('cannot_access_patient');
    });
  });

  test.describe('Navigation Persistence', () => {
    test('should maintain provider mode across navigation', async ({ page }) => {
      // Enable provider mode
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
      });

      // Navigate to provider portal
      await page.goto('/provider');
      await page.waitForURL('**/provider**');

      // Try to navigate to patient route
      await page.goto('/dashboard');

      // Should still block access
      await page.waitForURL('**/provider**');
      expect(page.url()).toContain('/provider');
    });

    test('should allow patient routes after disabling provider mode', async ({ page }) => {
      // Enable provider mode
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('provider_mode', 'enabled');
      });

      // Verify provider mode blocks patient route
      await page.goto('/dashboard');
      await page.waitForURL('**/provider**');

      // Disable provider mode
      await page.evaluate(() => {
        localStorage.removeItem('provider_mode');
      });

      // Now try to access patient route
      await page.goto('/dashboard');

      // Should not redirect to provider portal
      // (Will redirect to onboarding/home based on onboarding status, but not to /provider)
      await page.waitForTimeout(1000); // Give time for any redirect
      expect(page.url()).not.toContain('/provider');
    });
  });
});
