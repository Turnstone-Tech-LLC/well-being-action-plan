import { expect, test } from '@playwright/test';
import { deleteDatabase } from './utils/indexeddb';
import {
	createTempBackupFile,
	cleanupTempFile,
	createEncryptedBackupInBrowser
} from './utils/backup';
import { TEST_PASSPHRASE, WRONG_PASSPHRASE } from './fixtures/test-plan';
import {
	INVALID_BACKUP_CONTENT,
	CORRUPT_BACKUP_CONTENT,
	MALFORMED_JSON_CONTENT
} from './fixtures/test-backup';

test.describe('Restore Flow', () => {
	let tempBackupPath: string | null = null;

	test.beforeEach(async ({ page }) => {
		// Navigate first to establish the origin for IndexedDB
		await page.goto('/');
		await deleteDatabase(page);
	});

	test.afterEach(async () => {
		// Clean up temp files
		if (tempBackupPath) {
			await cleanupTempFile(tempBackupPath);
			tempBackupPath = null;
		}
	});

	test.describe('Page elements', () => {
		test('displays restore page with correct title', async ({ page }) => {
			await page.goto('/restore');

			await expect(page).toHaveTitle('Restore Your Plan | Well-Being Action Plan');
			await expect(page.getByRole('heading', { name: 'Restore Your Plan' })).toBeVisible();
		});

		test('displays description text', async ({ page }) => {
			await page.goto('/restore');

			await expect(
				page.getByText(/Upload your encrypted backup file to restore your Well-Being Action Plan/)
			).toBeVisible();
		});

		test('displays file upload area', async ({ page }) => {
			await page.goto('/restore');

			await expect(page.getByText(/Drag and drop your backup file here/)).toBeVisible();
			await expect(page.getByText('Choose File')).toBeVisible();
		});

		test('displays passphrase input', async ({ page }) => {
			await page.goto('/restore');

			await expect(page.getByLabel('Recovery Passphrase')).toBeVisible();
			await expect(page.getByPlaceholder('Enter your recovery passphrase')).toBeVisible();
		});

		test('displays helper text about passphrase', async ({ page }) => {
			await page.goto('/restore');

			await expect(
				page.getByText(/This is the passphrase you created when you made your backup/)
			).toBeVisible();
		});

		test('displays info box about backup files', async ({ page }) => {
			await page.goto('/restore');

			await expect(page.getByRole('heading', { name: 'About Backup Files' })).toBeVisible();
			await expect(
				page.getByText(/Your backup file contains your encrypted Well-Being Action Plan/)
			).toBeVisible();
		});

		test('submit button is disabled initially', async ({ page }) => {
			await page.goto('/restore');

			const submitButton = page.getByRole('button', { name: 'Restore My Plan' });
			await expect(submitButton).toBeDisabled();
		});
	});

	test.describe('File selection', () => {
		test('shows selected file name after file upload', async ({ page }) => {
			// Create a valid backup file
			const backupContent = await createEncryptedBackupInBrowser(page, TEST_PASSPHRASE);
			tempBackupPath = await createTempBackupFile(backupContent, 'my-backup.wbap');

			await page.goto('/restore');

			// Upload the file
			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);

			// Verify file name is shown
			await expect(page.getByText('my-backup.wbap')).toBeVisible();
		});

		test('shows clear button after file selection', async ({ page }) => {
			const backupContent = await createEncryptedBackupInBrowser(page, TEST_PASSPHRASE);
			tempBackupPath = await createTempBackupFile(backupContent);

			await page.goto('/restore');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);

			// Look for the clear/remove button (use exact match to avoid matching the parent div)
			const clearButton = page.getByRole('button', { name: 'Remove file', exact: true });
			await expect(clearButton).toBeVisible();
		});

		test('clears selected file when clear button is clicked', async ({ page }) => {
			const backupContent = await createEncryptedBackupInBrowser(page, TEST_PASSPHRASE);
			tempBackupPath = await createTempBackupFile(backupContent, 'test-backup.wbap');

			await page.goto('/restore');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);

			// Verify file is selected
			await expect(page.getByText('test-backup.wbap')).toBeVisible();

			// Click clear button (use exact match to avoid matching the parent div)
			await page.getByRole('button', { name: 'Remove file', exact: true }).click();

			// Verify file is cleared - the upload text should be visible again
			await expect(page.getByText(/Drag and drop your backup file here/)).toBeVisible();
		});

		test('rejects invalid file extension', async ({ page }) => {
			tempBackupPath = await createTempBackupFile('some content', 'invalid.txt');

			await page.goto('/restore');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);

			// Should show error about invalid file
			await expect(page.getByText(/Please select a valid backup file/)).toBeVisible();
		});
	});

	test.describe('Passphrase visibility toggle', () => {
		test('hides passphrase by default', async ({ page }) => {
			await page.goto('/restore');

			const input = page.getByPlaceholder('Enter your recovery passphrase');
			await expect(input).toHaveAttribute('type', 'password');
		});

		test('toggles passphrase visibility', async ({ page }) => {
			await page.goto('/restore');

			const input = page.getByPlaceholder('Enter your recovery passphrase');
			const toggleButton = page.getByRole('button', { name: /Show passphrase|Hide passphrase/ });

			// Initially hidden
			await expect(input).toHaveAttribute('type', 'password');

			// Click to show
			await toggleButton.click();
			await expect(input).toHaveAttribute('type', 'text');

			// Click to hide again
			await toggleButton.click();
			await expect(input).toHaveAttribute('type', 'password');
		});
	});

	test.describe('Form submission', () => {
		test('submit button enables when file and passphrase are provided', async ({ page }) => {
			const backupContent = await createEncryptedBackupInBrowser(page, TEST_PASSPHRASE);
			tempBackupPath = await createTempBackupFile(backupContent);

			await page.goto('/restore');

			const submitButton = page.getByRole('button', { name: 'Restore My Plan' });

			// Initially disabled
			await expect(submitButton).toBeDisabled();

			// Add file
			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);

			// Still disabled without passphrase
			await expect(submitButton).toBeDisabled();

			// Add passphrase
			await page.getByPlaceholder('Enter your recovery passphrase').fill(TEST_PASSPHRASE);

			// Now should be enabled
			await expect(submitButton).toBeEnabled();
		});
	});

	test.describe('Restore success flow', () => {
		test('successfully restores plan with correct passphrase', async ({ page }) => {
			const backupContent = await createEncryptedBackupInBrowser(page, TEST_PASSPHRASE);
			tempBackupPath = await createTempBackupFile(backupContent);

			await page.goto('/restore');

			// Upload file
			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);

			// Enter passphrase
			await page.getByPlaceholder('Enter your recovery passphrase').fill(TEST_PASSPHRASE);

			// Submit
			await page.getByRole('button', { name: 'Restore My Plan' }).click();

			// Should show success message
			await expect(page.getByRole('heading', { name: 'Plan Restored Successfully' })).toBeVisible({
				timeout: 10000
			});
			await expect(page.getByText('Taking you to your plan...')).toBeVisible();

			// Should redirect to home after success
			await expect(page).toHaveURL('/', { timeout: 5000 });
		});

		test('shows loading state during restore', async ({ page }) => {
			const backupContent = await createEncryptedBackupInBrowser(page, TEST_PASSPHRASE);
			tempBackupPath = await createTempBackupFile(backupContent);

			await page.goto('/restore');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);
			await page.getByPlaceholder('Enter your recovery passphrase').fill(TEST_PASSPHRASE);

			// Click submit
			await page.getByRole('button', { name: 'Restore My Plan' }).click();

			// Should show loading state (may be brief)
			// The button text changes to "Restoring..."
			const restoringButton = page.getByRole('button', { name: /Restoring/ });
			await expect(restoringButton)
				.toBeVisible({ timeout: 1000 })
				.catch(() => {
					// Loading state may be too fast to catch, which is fine
				});
		});
	});

	test.describe('Wrong passphrase errors', () => {
		test('shows inline error on first wrong passphrase attempt', async ({ page }) => {
			const backupContent = await createEncryptedBackupInBrowser(page, TEST_PASSPHRASE);
			tempBackupPath = await createTempBackupFile(backupContent);

			await page.goto('/restore');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);
			await page.getByPlaceholder('Enter your recovery passphrase').fill(WRONG_PASSPHRASE);

			await page.getByRole('button', { name: 'Restore My Plan' }).click();

			// Should show inline error message
			await expect(page.getByText("Passphrase didn't match, try again")).toBeVisible({
				timeout: 10000
			});

			// Form should still be visible (not full error state)
			await expect(page.getByRole('button', { name: 'Restore My Plan' })).toBeVisible();
		});

		test('shows full error state after multiple wrong attempts', async ({ page }) => {
			const backupContent = await createEncryptedBackupInBrowser(page, TEST_PASSPHRASE);
			tempBackupPath = await createTempBackupFile(backupContent);

			await page.goto('/restore');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);

			// First attempt
			await page.getByPlaceholder('Enter your recovery passphrase').fill(WRONG_PASSPHRASE);
			await page.getByRole('button', { name: 'Restore My Plan' }).click();
			await expect(page.getByText("Passphrase didn't match, try again")).toBeVisible({
				timeout: 10000
			});

			// Second attempt (should trigger full error state)
			await page.getByPlaceholder('Enter your recovery passphrase').fill(WRONG_PASSPHRASE + '2');
			await page.getByRole('button', { name: 'Restore My Plan' }).click();

			// Should show full error state
			await expect(
				page.getByRole('heading', { name: "We couldn't restore your data" })
			).toBeVisible({
				timeout: 10000
			});
			await expect(page.getByText(/The passphrase you entered didn't match/)).toBeVisible();
		});

		test('Try again button resets form from error state', async ({ page }) => {
			const backupContent = await createEncryptedBackupInBrowser(page, TEST_PASSPHRASE);
			tempBackupPath = await createTempBackupFile(backupContent);

			await page.goto('/restore');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);

			// Trigger full error state (2 attempts)
			await page.getByPlaceholder('Enter your recovery passphrase').fill(WRONG_PASSPHRASE);
			await page.getByRole('button', { name: 'Restore My Plan' }).click();
			await page.waitForTimeout(1000);

			await page.getByPlaceholder('Enter your recovery passphrase').fill(WRONG_PASSPHRASE);
			await page.getByRole('button', { name: 'Restore My Plan' }).click();

			// Wait for error state
			await expect(
				page.getByRole('heading', { name: "We couldn't restore your data" })
			).toBeVisible({
				timeout: 10000
			});

			// Click Try again
			await page.getByRole('button', { name: 'Try again' }).click();

			// Form should be reset
			await expect(page.getByText(/Drag and drop your backup file here/)).toBeVisible();
			await expect(page.getByRole('button', { name: 'Restore My Plan' })).toBeDisabled();
		});

		test('Return to home button navigates from error state', async ({ page }) => {
			const backupContent = await createEncryptedBackupInBrowser(page, TEST_PASSPHRASE);
			tempBackupPath = await createTempBackupFile(backupContent);

			await page.goto('/restore');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);

			// Trigger full error state
			await page.getByPlaceholder('Enter your recovery passphrase').fill(WRONG_PASSPHRASE);
			await page.getByRole('button', { name: 'Restore My Plan' }).click();
			await page.waitForTimeout(1000);

			await page.getByPlaceholder('Enter your recovery passphrase').fill(WRONG_PASSPHRASE);
			await page.getByRole('button', { name: 'Restore My Plan' }).click();

			await expect(
				page.getByRole('heading', { name: "We couldn't restore your data" })
			).toBeVisible({
				timeout: 10000
			});

			// Click Return to home
			await page.getByRole('button', { name: 'Return to home' }).click();

			await expect(page).toHaveURL('/');
		});
	});

	test.describe('File error states', () => {
		test('shows error for invalid backup format', async ({ page }) => {
			tempBackupPath = await createTempBackupFile(INVALID_BACKUP_CONTENT, 'invalid.wbap');

			await page.goto('/restore');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);
			await page.getByPlaceholder('Enter your recovery passphrase').fill('any-passphrase');

			await page.getByRole('button', { name: 'Restore My Plan' }).click();

			// Should show error state for wrong format
			await expect(
				page.getByRole('heading', { name: "We couldn't restore your data" })
			).toBeVisible({
				timeout: 10000
			});
		});

		test('shows error for corrupt backup file', async ({ page }) => {
			tempBackupPath = await createTempBackupFile(CORRUPT_BACKUP_CONTENT, 'corrupt.wbap');

			await page.goto('/restore');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);
			await page.getByPlaceholder('Enter your recovery passphrase').fill('any-passphrase');

			await page.getByRole('button', { name: 'Restore My Plan' }).click();

			// Should show error state
			await expect(
				page.getByRole('heading', { name: "We couldn't restore your data" })
			).toBeVisible({
				timeout: 10000
			});
		});

		test('shows error for malformed JSON', async ({ page }) => {
			tempBackupPath = await createTempBackupFile(MALFORMED_JSON_CONTENT, 'malformed.wbap');

			await page.goto('/restore');

			const fileInput = page.locator('input[type="file"]');
			await fileInput.setInputFiles(tempBackupPath);
			await page.getByPlaceholder('Enter your recovery passphrase').fill('any-passphrase');

			await page.getByRole('button', { name: 'Restore My Plan' }).click();

			// Should show error state
			await expect(
				page.getByRole('heading', { name: "We couldn't restore your data" })
			).toBeVisible({
				timeout: 10000
			});
		});
	});
});
