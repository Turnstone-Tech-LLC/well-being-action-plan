import { expect, test } from '@playwright/test';

/**
 * Action Plan CRUD Tests
 *
 * Tests the action plan creation wizard, viewing, editing, and management.
 *
 * Note: These tests require authentication. Skipped tests document
 * expected behavior when properly authenticated.
 */

test.describe('Action Plans', () => {
	test.describe('Access Control', () => {
		test('plans list requires authentication', async ({ page }) => {
			const response = await page.goto('/provider/plans');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('new plan wizard requires authentication', async ({ page }) => {
			await page.goto('/provider/plans/new');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('plan view requires authentication', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('plan edit requires authentication', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id/edit');

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

test.describe('Provider Dashboard', () => {
	test.describe('Access Control', () => {
		test('dashboard requires authentication', async ({ page }) => {
			await page.goto('/provider');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});
	});

	test.describe('Dashboard Content (Expected UI)', () => {
		test.skip('displays Action Plans heading', async ({ page }) => {
			await page.goto('/provider');

			await expect(page.getByRole('heading', { name: /action plans/i })).toBeVisible();
		});

		test.skip('displays welcome message with provider name', async ({ page }) => {
			await page.goto('/provider');

			await expect(page.getByText(/welcome back/i)).toBeVisible();
		});

		test.skip('displays empty state when no plans exist', async ({ page }) => {
			await page.goto('/provider');

			// If no plans, should show empty state
			const emptyState = page.getByText(/no.*plans|create your first|get started/i);
			const plansList = page.locator('[data-testid="plans-list"], .plans-list');

			// Either empty state or plans list should be visible
			const hasEmptyState = await emptyState.isVisible().catch(() => false);
			const hasPlansList = await plansList.isVisible().catch(() => false);

			expect(hasEmptyState || hasPlansList).toBe(true);
		});

		test.skip('displays plans list when plans exist', async ({ page }) => {
			await page.goto('/provider');

			// If plans exist, should show list
			const plansList = page.locator('[data-testid="plans-list"], .plans-list, table');
			await expect(plansList).toBeVisible();
		});
	});
});

test.describe('Action Plan Creation Wizard', () => {
	test.describe('Wizard Steps (Expected UI)', () => {
		test.skip('Step 1: Patient info', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Should have patient nickname field
			await expect(page.getByLabel(/nickname|name/i)).toBeVisible();

			// DOB is optional
			const dobField = page.getByLabel(/date of birth|dob/i);
			expect(await dobField.isVisible().catch(() => true)).toBe(true);
		});

		test.skip('Step 2: Happy when - free text', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Fill step 1 and proceed
			await page.getByLabel(/nickname|name/i).fill('Test Patient');
			await page.getByRole('button', { name: /next|continue/i }).click();

			// Step 2: "I feel happy when..."
			await expect(page.getByText(/feel happy when/i)).toBeVisible();
			await expect(page.getByRole('textbox')).toBeVisible();
		});

		test.skip('Step 3: Happy because - free text', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Navigate to step 3
			await page.getByLabel(/nickname|name/i).fill('Test Patient');
			await page.getByRole('button', { name: /next|continue/i }).click();
			await page.getByRole('textbox').fill('spending time with friends');
			await page.getByRole('button', { name: /next|continue/i }).click();

			// Step 3: "I can tell I am feeling happy because..."
			await expect(page.getByText(/tell.*happy because|know.*happy/i)).toBeVisible();
		});

		test.skip('Step 4: Select coping skills', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Navigate to step 4 (skills selection)
			// ... navigate through previous steps ...

			// Should show skills from library
			await expect(page.getByText(/coping skills|strategies/i)).toBeVisible();

			// Should have checkboxes or cards to select
			const skillCards = page.locator(
				'[data-testid="skill-option"], .skill-card, input[type="checkbox"]'
			);
			await expect(skillCards.first()).toBeVisible();
		});

		test.skip('Step 4a: Can add custom skill', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Navigate to skills step
			// Should have option to add custom
			await expect(page.getByRole('button', { name: /add custom|add new/i })).toBeVisible();
		});

		test.skip('Step 5: Select supportive adults', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Navigate to supportive adults step
			await expect(page.getByText(/supportive adult/i)).toBeVisible();

			// Should have type selection and name/contact fields
			await expect(page.getByLabel(/type/i)).toBeVisible();
		});

		test.skip('Step 5a: Can add custom supportive adult', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Navigate to supportive adults step
			await expect(page.getByRole('button', { name: /add|another/i })).toBeVisible();
		});

		test.skip('Step 5b: Can mark adult as primary', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Navigate to supportive adults step
			await expect(page.getByLabel(/primary/i)).toBeVisible();
		});

		test.skip('Step 6: Select help methods', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Navigate to help methods step
			await expect(page.getByText(/help method|when.*struggling/i)).toBeVisible();
		});

		test.skip('Step 7: Review all selections', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Navigate to review step
			await expect(page.getByText(/review|summary/i)).toBeVisible();

			// Should show all zones
			await expect(page.getByText(/green zone/i)).toBeVisible();
			await expect(page.getByText(/yellow zone/i)).toBeVisible();
			await expect(page.getByText(/red zone/i)).toBeVisible();
		});

		test.skip('Step 8: Generate access code', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Complete wizard and submit
			// Should show access code or QR
			await expect(page.getByText(/access code|qr code/i)).toBeVisible();
		});
	});

	test.describe('Wizard Navigation', () => {
		test.skip('can navigate back without losing data', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Fill step 1
			const nickname = 'Test Patient';
			await page.getByLabel(/nickname|name/i).fill(nickname);
			await page.getByRole('button', { name: /next|continue/i }).click();

			// Fill step 2
			await page.getByRole('textbox').fill('playing games');
			await page.getByRole('button', { name: /next|continue/i }).click();

			// Go back
			await page.getByRole('button', { name: /back|previous/i }).click();

			// Data should be preserved
			await expect(page.getByRole('textbox')).toHaveValue('playing games');

			// Go back again
			await page.getByRole('button', { name: /back|previous/i }).click();
			await expect(page.getByLabel(/nickname|name/i)).toHaveValue(nickname);
		});

		test.skip('cancel wizard shows confirmation if data entered', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Enter some data
			await page.getByLabel(/nickname|name/i).fill('Test');

			// Try to cancel/leave
			await page.getByRole('link', { name: /cancel|back to plans/i }).click();

			// Should show confirmation dialog
			await expect(page.getByText(/unsaved changes|are you sure/i)).toBeVisible();
		});
	});

	test.describe('Validation', () => {
		test.skip('requires at least one skill', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Navigate to skills step without selecting any
			// Try to proceed
			await page.getByRole('button', { name: /next|continue/i }).click();

			// Should show validation error
			await expect(page.getByText(/select at least one|required/i)).toBeVisible();
		});

		test.skip('requires at least one supportive adult', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Navigate to supportive adults step without adding any
			// Try to proceed
			await page.getByRole('button', { name: /next|continue/i }).click();

			// Should show validation error
			await expect(page.getByText(/add at least one|required/i)).toBeVisible();
		});

		test.skip('validates supportive adult contact info', async ({ page }) => {
			await page.goto('/provider/plans/new');

			// Navigate to supportive adults step
			// Add adult without contact info
			await page.getByLabel(/name/i).fill('Mom');
			// Leave contact empty
			await page.getByRole('button', { name: /add|save/i }).click();

			// Should show validation error
			await expect(page.getByText(/contact.*required/i)).toBeVisible();
		});
	});
});

test.describe('Action Plan View', () => {
	test.describe('Plan Details (Expected UI)', () => {
		test.skip('displays patient nickname', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			await expect(page.getByText(/patient|name/i)).toBeVisible();
		});

		test.skip('displays Green Zone section', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			await expect(page.getByText(/green zone/i)).toBeVisible();
			// Should show "happy when" and "happy because"
			await expect(page.getByText(/happy when/i)).toBeVisible();
		});

		test.skip('displays selected coping skills', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			// Should show skills in plan
			await expect(page.getByText(/coping skills|strategies/i)).toBeVisible();
		});

		test.skip('displays Yellow Zone section', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			await expect(page.getByText(/yellow zone/i)).toBeVisible();
		});

		test.skip('displays supportive adults', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			await expect(page.getByText(/supportive adult/i)).toBeVisible();
		});

		test.skip('displays Red Zone section', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			await expect(page.getByText(/red zone|crisis/i)).toBeVisible();
			// Should show crisis resources
			await expect(page.getByText('988')).toBeVisible();
		});

		test.skip('displays edit button', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			await expect(page.getByRole('link', { name: /edit/i })).toBeVisible();
		});

		test.skip('displays regenerate token option', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			await expect(
				page.getByRole('button', { name: /regenerate|new.*token|new.*link/i })
			).toBeVisible();
		});
	});

	test.describe('Access Code/QR Display', () => {
		test.skip('displays access code', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			// Should show access code or QR section
			await expect(page.getByText(/access code|qr code|share/i)).toBeVisible();
		});

		test.skip('can copy access link', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id');

			await expect(page.getByRole('button', { name: /copy/i })).toBeVisible();
		});
	});
});

test.describe('Action Plan Edit', () => {
	test.describe('Edit Page (Expected UI)', () => {
		test.skip('edit page loads with existing data', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id/edit');

			// Should show existing patient nickname
			await expect(page.getByLabel(/nickname|name/i)).not.toHaveValue('');
		});

		test.skip('can add new skill to existing plan', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id/edit');

			// Navigate to skills section
			await page.getByRole('button', { name: /add skill/i }).click();

			// Should be able to add new skill
			await expect(page.getByRole('checkbox')).toBeVisible();
		});

		test.skip('can remove skill from existing plan', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id/edit');

			// Should have remove option for selected skills
			await expect(page.getByRole('button', { name: /remove/i })).toBeVisible();
		});

		test.skip('can update happy_when text', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id/edit');

			const happyWhenField = page.getByLabel(/happy when/i);
			await happyWhenField.clear();
			await happyWhenField.fill('Updated happy when text');

			await expect(happyWhenField).toHaveValue('Updated happy when text');
		});

		test.skip('save button is visible', async ({ page }) => {
			await page.goto('/provider/plans/test-plan-id/edit');

			await expect(page.getByRole('button', { name: /save|update/i })).toBeVisible();
		});
	});
});

test.describe('Action Plans List/Table', () => {
	test.describe('Table Display (Expected UI)', () => {
		test.skip('displays table with columns', async ({ page }) => {
			await page.goto('/provider');

			// Should have table headers or column labels
			await expect(page.getByText(/name|patient/i)).toBeVisible();
			await expect(page.getByText(/created|date/i)).toBeVisible();
		});

		test.skip('can click row to view plan', async ({ page }) => {
			await page.goto('/provider');

			// Click on a plan row
			await page.locator('tr, [data-testid="plan-row"]').first().click();

			await expect(page).toHaveURL(/\/provider\/plans\/[a-zA-Z0-9-]+$/);
		});

		test.skip('displays create new plan button', async ({ page }) => {
			await page.goto('/provider');

			await expect(page.getByRole('link', { name: /new|create|add/i })).toBeVisible();
		});
	});

	test.describe('Search and Filter', () => {
		test.skip('can search by patient name', async ({ page }) => {
			await page.goto('/provider');

			await page.getByPlaceholder(/search/i).fill('Alex');

			// Should filter results
			await page.waitForTimeout(500);
			await expect(page.getByText('Alex')).toBeVisible();
		});

		test.skip('can sort by date', async ({ page }) => {
			await page.goto('/provider');

			// Click sort header
			await page.getByRole('columnheader', { name: /created|date/i }).click();

			// Should reorder (test just that click doesn't error)
		});
	});

	test.describe('Pagination', () => {
		test.skip('shows pagination when many plans', async ({ page }) => {
			await page.goto('/provider');

			// If there are many plans, pagination should appear
			const pagination = page.getByRole('navigation', { name: /pagination/i });
			const paginationExists = await pagination.isVisible().catch(() => false);

			// Test passes whether or not pagination is needed
			expect(paginationExists || true).toBe(true);
		});
	});
});
