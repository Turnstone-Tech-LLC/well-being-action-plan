import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration.
 *
 * Local development: Only runs Chromium by default for speed.
 * CI: Runs all browsers for comprehensive cross-browser testing.
 *
 * To run all browsers locally:
 *   pnpm exec playwright test --project=chromium --project=firefox --project=webkit
 *
 * First-time setup:
 *   pnpm exec playwright install
 */
export default defineConfig({
	testDir: 'e2e',

	// Run tests in parallel
	fullyParallel: true,

	// Fail the build on CI if you accidentally left test.only in the source code
	forbidOnly: !!process.env.CI,

	// Retry on CI only
	retries: process.env.CI ? 2 : 0,

	// Opt out of parallel tests on CI for more stable results
	workers: process.env.CI ? 1 : undefined,

	// Reporter to use
	reporter: process.env.CI ? 'github' : 'list',

	// Shared settings for all the projects below
	use: {
		// Base URL to use in actions like `await page.goto('/')`
		baseURL: 'http://localhost:4173',

		// Collect trace when retrying the failed test
		trace: 'on-first-retry',

		// Take screenshot on failure
		screenshot: 'only-on-failure'
	},

	// Configure projects for major browsers
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],

	// Run your local dev server before starting the tests
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	}
});
