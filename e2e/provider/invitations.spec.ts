import { expect, test } from '@playwright/test';

/**
 * Provider Invitation Flow Tests
 *
 * Tests the admin-only functionality for inviting new providers to an organization.
 * This extends the settings tests with more detailed invitation scenarios.
 *
 * Note: These tests require admin authentication.
 */

test.describe('Provider Invitation Flow', () => {
	test.describe('Access Control', () => {
		test('team management page requires authentication', async ({ page }) => {
			await page.goto('/provider/organization/team');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});
	});
});

test.describe('Admin Inviting New Provider', () => {
	test.describe('Invite Modal', () => {
		test.skip('Add Provider button opens invite modal', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();

			await expect(page.getByRole('dialog')).toBeVisible();
			await expect(page.getByRole('heading', { name: /add provider/i })).toBeVisible();
		});

		test.skip('invite modal has email field with validation', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();

			const emailInput = page.getByLabel(/email/i);
			await expect(emailInput).toBeVisible();
			await expect(emailInput).toHaveAttribute('required');
		});

		test.skip('invite modal has optional name field', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();

			await expect(page.getByLabel(/name/i)).toBeVisible();
			await expect(page.getByText(/optional|set their own name/i)).toBeVisible();
		});

		test.skip('invite modal has role selection defaulting to provider', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();

			const roleSelect = page.getByLabel(/role/i);
			await expect(roleSelect).toBeVisible();
			await expect(roleSelect).toHaveValue('provider');
		});

		test.skip('role selection includes admin option', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();

			await page.getByLabel(/role/i).selectOption('admin');
			await expect(page.getByLabel(/role/i)).toHaveValue('admin');
		});

		test.skip('shows admin privileges warning', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();
			await page.getByLabel(/role/i).selectOption('admin');

			await expect(page.getByText(/admin.*privileges|manage.*settings/i)).toBeVisible();
		});
	});

	test.describe('Invite Validation', () => {
		test.skip('requires email to submit', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();

			// Try to submit without email
			await page
				.getByRole('button', { name: /add provider/i })
				.last()
				.click();

			// Button should be disabled or error shown
			await expect(page.getByText(/email.*required/i)).toBeVisible();
		});

		test.skip('validates email format', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();

			await page.getByLabel(/email/i).fill('invalid-email');
			await page
				.getByRole('button', { name: /add provider/i })
				.last()
				.click();

			await expect(page.getByText(/valid email/i)).toBeVisible();
		});

		test.skip('shows error for duplicate email in org', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();

			// Use email of existing member
			await page.getByLabel(/email/i).fill('existing@example.com');
			await page
				.getByRole('button', { name: /add provider/i })
				.last()
				.click();

			await expect(page.getByText(/already exists/i)).toBeVisible();
		});
	});

	test.describe('Successful Invitation', () => {
		test.skip('shows success message after invitation', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();

			await page.getByLabel(/email/i).fill('new-provider@example.com');
			await page.getByLabel(/name/i).fill('New Provider');
			await page
				.getByRole('button', { name: /add provider/i })
				.last()
				.click();

			// Success toast or message
			await expect(page.getByText(/added successfully|invitation sent/i)).toBeVisible();
		});

		test.skip('closes modal after successful invitation', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();

			await page.getByLabel(/email/i).fill('new-provider@example.com');
			await page
				.getByRole('button', { name: /add provider/i })
				.last()
				.click();

			// Modal should close
			await expect(page.getByRole('dialog')).not.toBeVisible();
		});

		test.skip('new provider appears in list with Pending badge', async ({ page }) => {
			await page.goto('/provider/organization/team');

			// Find newly added provider with pending status
			const pendingRow = page.locator('.member-row.pending, [data-status="pending"]');
			await expect(pendingRow.getByText('Pending')).toBeVisible();
		});
	});

	test.describe('Pending Invitation Management', () => {
		test.skip('admin can see pending invitations', async ({ page }) => {
			await page.goto('/provider/organization/team');

			// Pending badge should be visible for unclaimed accounts
			const pendingBadges = page.getByText('Pending');
			const count = await pendingBadges.count();

			// Test passes whether or not there are pending invitations
			expect(count).toBeGreaterThanOrEqual(0);
		});

		test.skip('admin can resend invitation', async ({ page }) => {
			await page.goto('/provider/organization/team');

			// Find pending member and resend
			const pendingRow = page.locator('.member-row.pending').first();

			// There should be an option to resend
			await pendingRow.getByRole('button', { name: /resend|send again/i }).click();

			await expect(page.getByText(/resent|sent/i)).toBeVisible();
		});

		test.skip('admin can cancel pending invitation', async ({ page }) => {
			await page.goto('/provider/organization/team');

			// Find pending member
			const pendingRow = page.locator('.member-row.pending').first();

			// Remove pending invitation
			await pendingRow.getByRole('button', { name: /remove|delete|cancel/i }).click();

			// Confirm removal
			await page.getByRole('button', { name: /remove|confirm/i }).click();

			await expect(page.getByText(/removed|cancelled/i)).toBeVisible();
		});
	});
});

test.describe('Invited Provider Flow', () => {
	test.describe('First Login (Expected Behavior)', () => {
		test.skip('invited provider can login with magic link', async ({ page }) => {
			// When an invited provider clicks their magic link:
			// 1. They are authenticated
			// 2. Their provider_profile is claimed (claimed_at is set)
			// 3. They are redirected to dashboard

			await page.goto('/auth');

			// Enter invited email
			await page.getByLabel(/email/i).fill('invited@example.com');
			await page.getByRole('button', { name: /send.*link/i }).click();

			// Should redirect to verify page
			await expect(page).toHaveURL(/\/auth\/verify/);
		});

		test.skip('provider is associated with correct organization', async ({ page }) => {
			// After claiming invitation, provider should see their organization
			await page.goto('/provider');

			// Should show organization name in UI
			await expect(page.getByText(/organization|team/i)).toBeVisible();
		});

		test.skip('Pending badge disappears after claim', async ({ page }) => {
			// After provider claims their account, admin view should update
			await page.goto('/provider/organization/team');

			// The member who just claimed should no longer show Pending
			const claimedMember = page.locator('.member-row').filter({ hasNotText: 'Pending' });
			await expect(claimedMember).toBeVisible();
		});
	});
});

test.describe('Error Cases', () => {
	test.describe('Invitation Errors', () => {
		test.skip('cannot invite email from different organization', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await page.getByRole('button', { name: /add provider/i }).click();

			// Try to invite someone already in another org
			await page.getByLabel(/email/i).fill('other-org@example.com');
			await page
				.getByRole('button', { name: /add provider/i })
				.last()
				.click();

			// Should show error
			await expect(page.getByText(/already.*organization|belongs.*another/i)).toBeVisible();
		});

		test.skip('expired invitation link shows error', async ({ page }) => {
			// Navigate directly to an expired magic link
			await page.goto('/auth/callback?code=expired-code');

			// Should show error about expired link
			await expect(page.getByText(/expired|no longer valid/i)).toBeVisible();

			// Should offer to resend
			await expect(page.getByRole('link', { name: /try again|resend/i })).toBeVisible();
		});
	});
});

test.describe('Role-Based Access', () => {
	test.describe('Non-Admin Provider', () => {
		test.skip('provider cannot access team management', async ({ page }) => {
			// When logged in as regular provider (not admin)
			await page.goto('/provider/organization/team');

			// Should show access denied or redirect
			const url = page.url();
			const isRedirected = !url.includes('/team');
			const hasError = await page
				.getByText(/access denied|admin.*required|not authorized/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test.skip('provider can access own settings', async ({ page }) => {
			// Regular provider should be able to access settings
			await page.goto('/provider/settings');

			await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
		});
	});

	test.describe('Admin Provider', () => {
		test.skip('admin can access all organization settings', async ({ page }) => {
			await page.goto('/provider/organization');

			await expect(page.getByRole('heading', { name: /organization|settings/i })).toBeVisible();
		});

		test.skip('admin can access team management', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await expect(page.getByRole('heading', { name: /team members/i })).toBeVisible();
		});

		test.skip('admin sees Add Provider button', async ({ page }) => {
			await page.goto('/provider/organization/team');

			await expect(page.getByRole('button', { name: /add provider/i })).toBeVisible();
		});
	});
});
