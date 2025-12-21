import { expect, test } from '@playwright/test';

/**
 * Resource Library CRUD Tests
 *
 * Tests the resource management pages for:
 * - Skills (Green Zone)
 * - Supportive Adult Types
 * - Help Methods (Yellow Zone)
 * - Crisis Resources (Red Zone)
 *
 * Note: These tests require authentication. Skipped tests document
 * expected behavior when properly authenticated.
 */

test.describe('Resource Library', () => {
	test.describe('Access Control', () => {
		test('resources page requires authentication', async ({ page }) => {
			const response = await page.goto('/provider/resources');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('skills page requires authentication', async ({ page }) => {
			await page.goto('/provider/resources/skills');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('help methods page requires authentication', async ({ page }) => {
			await page.goto('/provider/resources/help-methods');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('supportive adults page requires authentication', async ({ page }) => {
			await page.goto('/provider/resources/supportive-adults');

			const url = page.url();
			const isRedirected = url.includes('/auth');
			const hasError = await page
				.getByText(/not found|unauthorized|sign in/i)
				.isVisible()
				.catch(() => false);

			expect(isRedirected || hasError).toBe(true);
		});

		test('crisis resources page requires authentication', async ({ page }) => {
			await page.goto('/provider/resources/crisis');

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

test.describe('Skills (Green Zone) CRUD', () => {
	test.describe('List View', () => {
		test.skip('displays skills library heading', async ({ page }) => {
			await page.goto('/provider/resources/skills');

			await expect(page.getByRole('heading', { name: /skills|coping/i })).toBeVisible();
		});

		test.skip('displays skill cards', async ({ page }) => {
			await page.goto('/provider/resources/skills');

			// Should have at least one skill card
			const skillCards = page.locator('[data-testid="skill-card"], .skill-card, .resource-card');
			await expect(skillCards.first()).toBeVisible();
		});

		test.skip('displays skill title and description', async ({ page }) => {
			await page.goto('/provider/resources/skills');

			const card = page.locator('.skill-card, .resource-card').first();
			await expect(card.locator('h3, .title')).toBeVisible();
		});

		test.skip('displays skill category', async ({ page }) => {
			await page.goto('/provider/resources/skills');

			// Categories like "Calming", "Movement", etc.
			await expect(page.getByText(/calming|movement|distraction|thinking|social/i)).toBeVisible();
		});

		test.skip('displays add new skill button', async ({ page }) => {
			await page.goto('/provider/resources/skills');

			await expect(page.getByRole('link', { name: /add|new|create/i })).toBeVisible();
		});
	});

	test.describe('Create Skill', () => {
		test.skip('new skill page has required fields', async ({ page }) => {
			await page.goto('/provider/resources/skills/new');

			await expect(page.getByLabel(/title|name/i)).toBeVisible();
			await expect(page.getByLabel(/description/i)).toBeVisible();
			await expect(page.getByLabel(/category/i)).toBeVisible();
		});

		test.skip('has fill-in prompt option', async ({ page }) => {
			await page.goto('/provider/resources/skills/new');

			await expect(page.getByLabel(/fill.in|prompt/i)).toBeVisible();
		});

		test.skip('validates required fields', async ({ page }) => {
			await page.goto('/provider/resources/skills/new');

			// Try to submit without filling required fields
			await page.getByRole('button', { name: /save|create|add/i }).click();

			// Should show validation error
			await expect(page.getByText(/required/i)).toBeVisible();
		});

		test.skip('creates skill and redirects to list', async ({ page }) => {
			await page.goto('/provider/resources/skills/new');

			await page.getByLabel(/title|name/i).fill('Test Skill');
			await page.getByLabel(/description/i).fill('Test description');
			await page.getByLabel(/category/i).selectOption('Calming');

			await page.getByRole('button', { name: /save|create|add/i }).click();

			await expect(page).toHaveURL(/\/provider\/resources\/skills$/);
		});
	});

	test.describe('Edit Skill', () => {
		test.skip('edit page shows existing data', async ({ page }) => {
			// Would need a specific skill ID
			await page.goto('/provider/resources/skills/test-id/edit');

			const titleInput = page.getByLabel(/title|name/i);
			await expect(titleInput).toHaveValue(/.+/);
		});

		test.skip('can update skill title', async ({ page }) => {
			await page.goto('/provider/resources/skills/test-id/edit');

			await page.getByLabel(/title|name/i).fill('Updated Title');
			await page.getByRole('button', { name: /save|update/i }).click();

			await expect(page).toHaveURL(/\/provider\/resources\/skills$/);
		});
	});

	test.describe('Delete Skill', () => {
		test.skip('delete button shows confirmation', async ({ page }) => {
			await page.goto('/provider/resources/skills');

			await page
				.getByRole('button', { name: /delete|remove/i })
				.first()
				.click();

			await expect(page.getByRole('alertdialog')).toBeVisible();
		});

		test.skip('can cancel deletion', async ({ page }) => {
			await page.goto('/provider/resources/skills');

			await page
				.getByRole('button', { name: /delete|remove/i })
				.first()
				.click();
			await page.getByRole('button', { name: /cancel/i }).click();

			await expect(page.getByRole('alertdialog')).not.toBeVisible();
		});
	});

	test.describe('Search and Filter', () => {
		test.skip('can search skills by title', async ({ page }) => {
			await page.goto('/provider/resources/skills');

			await page.getByPlaceholder(/search/i).fill('breathing');

			// Should filter to matching skills
			await expect(page.getByText(/breathing/i)).toBeVisible();
		});

		test.skip('can filter by category', async ({ page }) => {
			await page.goto('/provider/resources/skills');

			await page.getByRole('combobox', { name: /category|filter/i }).selectOption('Calming');

			// Should show only calming skills
			// Other categories should not be visible
		});
	});
});

test.describe('Supportive Adult Types CRUD', () => {
	test.describe('List View', () => {
		test.skip('displays supportive adults heading', async ({ page }) => {
			await page.goto('/provider/resources/supportive-adults');

			await expect(page.getByRole('heading', { name: /supportive adult/i })).toBeVisible();
		});

		test.skip('displays type cards', async ({ page }) => {
			await page.goto('/provider/resources/supportive-adults');

			// Should have adult type cards (Parent, Teacher, Counselor, etc.)
			await expect(page.getByText(/parent|teacher|counselor/i)).toBeVisible();
		});

		test.skip('displays add new type button', async ({ page }) => {
			await page.goto('/provider/resources/supportive-adults');

			await expect(page.getByRole('link', { name: /add|new|create/i })).toBeVisible();
		});
	});

	test.describe('Create Adult Type', () => {
		test.skip('new type page has required fields', async ({ page }) => {
			await page.goto('/provider/resources/supportive-adults/new');

			await expect(page.getByLabel(/type|name/i)).toBeVisible();
		});

		test.skip('has fill-in toggle', async ({ page }) => {
			await page.goto('/provider/resources/supportive-adults/new');

			await expect(page.getByLabel(/fill.in|requires.*name|contact/i)).toBeVisible();
		});
	});

	test.describe('Edit Adult Type', () => {
		test.skip('edit page shows existing data', async ({ page }) => {
			await page.goto('/provider/resources/supportive-adults/test-id/edit');

			const typeInput = page.getByLabel(/type|name/i);
			await expect(typeInput).toHaveValue(/.+/);
		});
	});
});

test.describe('Help Methods (Yellow Zone) CRUD', () => {
	test.describe('List View', () => {
		test.skip('displays help methods heading', async ({ page }) => {
			await page.goto('/provider/resources/help-methods');

			await expect(page.getByRole('heading', { name: /help method/i })).toBeVisible();
		});

		test.skip('displays method cards', async ({ page }) => {
			await page.goto('/provider/resources/help-methods');

			// Should have help method cards
			const methodCards = page.locator('.resource-card, .method-card');
			await expect(methodCards.first()).toBeVisible();
		});

		test.skip('displays add new method button', async ({ page }) => {
			await page.goto('/provider/resources/help-methods');

			await expect(page.getByRole('link', { name: /add|new|create/i })).toBeVisible();
		});
	});

	test.describe('Create Help Method', () => {
		test.skip('new method page has required fields', async ({ page }) => {
			await page.goto('/provider/resources/help-methods/new');

			await expect(page.getByLabel(/title|name/i)).toBeVisible();
			await expect(page.getByLabel(/description/i)).toBeVisible();
		});

		test.skip('validates required fields', async ({ page }) => {
			await page.goto('/provider/resources/help-methods/new');

			await page.getByRole('button', { name: /save|create|add/i }).click();

			await expect(page.getByText(/required/i)).toBeVisible();
		});
	});

	test.describe('Edit Help Method', () => {
		test.skip('edit page shows existing data', async ({ page }) => {
			await page.goto('/provider/resources/help-methods/test-id/edit');

			const titleInput = page.getByLabel(/title|name/i);
			await expect(titleInput).toHaveValue(/.+/);
		});
	});
});

test.describe('Crisis Resources (Red Zone) CRUD', () => {
	test.describe('List View', () => {
		test.skip('displays crisis resources heading', async ({ page }) => {
			await page.goto('/provider/resources/crisis');

			await expect(page.getByRole('heading', { name: /crisis/i })).toBeVisible();
		});

		test.skip('displays default crisis resources', async ({ page }) => {
			await page.goto('/provider/resources/crisis');

			// 988 and Crisis Text Line should be visible by default
			await expect(page.getByText('988')).toBeVisible();
		});

		test.skip('displays add new resource button', async ({ page }) => {
			await page.goto('/provider/resources/crisis');

			await expect(page.getByRole('link', { name: /add|new|create/i })).toBeVisible();
		});
	});

	test.describe('Create Crisis Resource', () => {
		test.skip('new resource page has required fields', async ({ page }) => {
			// Note: Crisis resources may not have a create page if they are org-managed
			await page.goto('/provider/resources/crisis/new');

			await expect(page.getByLabel(/name/i)).toBeVisible();
			await expect(page.getByLabel(/contact/i)).toBeVisible();
			await expect(page.getByLabel(/type/i)).toBeVisible(); // call, text, both
		});

		test.skip('contact type options are available', async ({ page }) => {
			await page.goto('/provider/resources/crisis/new');

			await expect(page.getByRole('option', { name: /call|phone/i })).toBeVisible();
			await expect(page.getByRole('option', { name: /text/i })).toBeVisible();
		});
	});

	test.describe('Display Contact Type', () => {
		test.skip('shows phone icon for call resources', async ({ page }) => {
			await page.goto('/provider/resources/crisis');

			// 988 is a phone resource
			const phoneResource = page.locator('[data-contact-type="phone"], [data-contact-type="call"]');
			await expect(phoneResource).toBeVisible();
		});

		test.skip('shows text icon for text resources', async ({ page }) => {
			await page.goto('/provider/resources/crisis');

			// Crisis Text Line is a text resource
			const textResource = page.locator('[data-contact-type="text"]');
			await expect(textResource).toBeVisible();
		});
	});
});

test.describe('Resource Library Navigation', () => {
	test.skip('can navigate between resource types', async ({ page }) => {
		await page.goto('/provider/resources');

		// Navigate to skills
		await page.getByRole('link', { name: /skills/i }).click();
		await expect(page).toHaveURL(/\/skills/);

		// Navigate to help methods
		await page.getByRole('link', { name: /help methods/i }).click();
		await expect(page).toHaveURL(/\/help-methods/);

		// Navigate to crisis resources
		await page.getByRole('link', { name: /crisis/i }).click();
		await expect(page).toHaveURL(/\/crisis/);
	});

	test.skip('breadcrumb navigation works', async ({ page }) => {
		await page.goto('/provider/resources/skills');

		// Should have breadcrumb back to resources
		await page.getByRole('link', { name: /resources/i }).click();
		await expect(page).toHaveURL(/\/provider\/resources$/);
	});
});
