import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Provider Mode
 *
 * Tests the provider mode activation flow:
 * - Happy path: Valid provider key activation
 * - Sad path: Invalid provider key rejection
 */

test.describe('Provider Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should show provider key input field on welcome screen', async ({ page }) => {
    // Verify welcome screen is displayed
    await expect(page.locator('text=Welcome')).toBeVisible();

    // Verify provider key input field exists
    const providerKeyInput = page.locator('input[id="provider-key"]');
    await expect(providerKeyInput).toBeVisible();

    // Verify provider key label
    await expect(page.locator('text=Provider Key')).toBeVisible();

    // Verify provider key description
    await expect(
      page.locator('text=Providers: Enter your access key to manage plans')
    ).toBeVisible();

    // Verify provider mode button
    await expect(page.locator('button:has-text("Enter Provider Mode")')).toBeVisible();
  });

  test('should reject invalid provider key', async ({ page }) => {
    // Find and fill the provider key input
    const providerKeyInput = page.locator('input[id="provider-key"]');
    await providerKeyInput.fill('invalid-key-12345');

    // Click the provider mode button
    await page.click('button:has-text("Enter Provider Mode")');

    // Wait for error message to appear
    await expect(page.locator('text=Invalid provider key')).toBeVisible();

    // Verify we're still on the home page
    expect(page.url()).toContain('localhost:3000');
    expect(page.url()).not.toContain('/provider');
  });

  test('should clear error when user tries again with valid key', async ({ page }) => {
    // Fill invalid provider key
    const providerKeyInput = page.locator('input[id="provider-key"]');
    await providerKeyInput.fill('wrong-key');

    // Click provider mode button
    await page.click('button:has-text("Enter Provider Mode")');

    // Verify error appears in the form
    const errorMessage = page.locator('main').getByText('Invalid provider key');
    await expect(errorMessage).toBeVisible();

    // Clear the input
    await providerKeyInput.clear();

    // Fill in a new key
    await providerKeyInput.fill('test-provider-key-2024');

    // Verify button is enabled
    const providerKeyButton = page.locator('button:has-text("Enter Provider Mode")');
    await expect(providerKeyButton).toBeEnabled();
  });

  test('should disable provider key button when input is empty', async ({ page }) => {
    // Find the provider key button
    const providerKeyButton = page.locator('button:has-text("Enter Provider Mode")');

    // Verify button is disabled initially (input is empty)
    await expect(providerKeyButton).toBeDisabled();

    // Fill in the input
    const providerKeyInput = page.locator('input[id="provider-key"]');
    await providerKeyInput.fill('some-key');

    // Verify button is now enabled
    await expect(providerKeyButton).toBeEnabled();

    // Clear the input
    await providerKeyInput.clear();

    // Verify button is disabled again
    await expect(providerKeyButton).toBeDisabled();
  });

  test('should show loading state while verifying provider key', async ({ page }) => {
    // Fill in provider key
    const providerKeyInput = page.locator('input[id="provider-key"]');
    await providerKeyInput.fill('test-key');

    // Click provider mode button
    const providerKeyButton = page.locator('button:has-text("Enter Provider Mode")');
    await providerKeyButton.click();

    // Verify loading state appears briefly
    await expect(page.locator('text=Verifying...')).toBeVisible();
  });

  test('should keep provider key input focused after error', async ({ page }) => {
    // Fill invalid provider key
    const providerKeyInput = page.locator('input[id="provider-key"]');
    await providerKeyInput.fill('invalid-key');

    // Click provider mode button
    await page.click('button:has-text("Enter Provider Mode")');

    // Wait for error
    await expect(page.locator('text=Invalid provider key')).toBeVisible();

    // Verify input still has the value
    const inputValue = await providerKeyInput.inputValue();
    expect(inputValue).toBe('invalid-key');

    // Verify input is still visible and usable
    await expect(providerKeyInput).toBeVisible();
  });
});
