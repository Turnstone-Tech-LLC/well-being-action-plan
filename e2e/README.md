# E2E Test Suite

This directory contains the comprehensive Playwright end-to-end test suite for the Well-Being Action Plan application.

## Directory Structure

```
e2e/
├── fixtures/           # Test data and fixtures
│   ├── auth.ts         # Authentication helpers
│   ├── patient.ts      # Patient IndexedDB helpers
│   ├── test-backup.ts  # Backup file fixtures
│   └── test-plan.ts    # Test plan data
├── utils/              # Utility functions
│   ├── backup.ts       # Backup file utilities
│   └── indexeddb.ts    # IndexedDB manipulation
├── provider/           # Provider-facing tests
│   ├── auth.spec.ts    # Authentication flow
│   ├── settings.spec.ts # Provider settings
│   ├── resources.spec.ts # Resource library CRUD
│   ├── action-plans.spec.ts # Action plan management
│   └── invitations.spec.ts # Team invitations
├── patient/            # Patient-facing tests
│   ├── access.spec.ts  # Loading action plans
│   ├── onboarding.spec.ts # Onboarding flow
│   ├── dashboard.spec.ts # Dashboard views
│   ├── settings.spec.ts # Patient settings
│   ├── checkin.spec.ts # Check-in flows
│   └── reports.spec.ts # Reports and history
├── authorization.spec.ts # Route protection tests
├── accessibility.test.ts # WCAG compliance tests
├── landing.test.ts     # Landing page tests
├── access-token.test.ts # Token handling tests
├── restore.test.ts     # Backup restore tests
└── README.md           # This file
```

## Running Tests

### Run all E2E tests

```bash
pnpm run test:e2e
```

### Run specific test file

```bash
pnpm exec playwright test e2e/patient/checkin.spec.ts
```

### Run tests by folder

```bash
# All provider tests
pnpm exec playwright test e2e/provider/

# All patient tests
pnpm exec playwright test e2e/patient/
```

### Run tests with UI

```bash
pnpm exec playwright test --ui
```

### Run tests in headed mode

```bash
pnpm exec playwright test --headed
```

### Show HTML report

```bash
pnpm exec playwright show-report
```

## Test Categories

### Provider Tests

Provider tests verify the healthcare provider experience:

- **Authentication** (`auth.spec.ts`): Magic link login, session handling
- **Settings** (`settings.spec.ts`): Profile management, admin settings
- **Resources** (`resources.spec.ts`): CRUD for skills, help methods, crisis resources
- **Action Plans** (`action-plans.spec.ts`): Plan creation wizard, editing, viewing
- **Invitations** (`invitations.spec.ts`): Team management, provider invitations

> **Note**: Many provider tests are marked as `test.skip()` because they require authenticated sessions. These tests document expected behavior and can be enabled with proper authentication setup.

### Patient Tests

Patient tests verify the youth/patient experience:

- **Access** (`access.spec.ts`): Loading plans via token, restore, local bypass
- **Onboarding** (`onboarding.spec.ts`): First-time setup flow
- **Dashboard** (`dashboard.spec.ts`): Main view, stats, navigation
- **Settings** (`settings.spec.ts`): Profile, export, delete data
- **Check-in** (`checkin.spec.ts`): Green/Yellow/Red zone flows
- **Reports** (`reports.spec.ts`): History, calendar, statistics

### Authorization Tests

`authorization.spec.ts` verifies route protection:

- Provider routes require Supabase authentication
- Patient routes require local action plan in IndexedDB
- Public routes are accessible to all

## Test Fixtures

### IndexedDB Helpers (`utils/indexeddb.ts`)

```typescript
import { seedLocalPlan, clearLocalPlan, hasLocalPlan, deleteDatabase } from './utils/indexeddb';

// Seed a test plan with completed onboarding
await seedLocalPlan(page, { withCompletedOnboarding: true });

// Clear local plan data
await clearLocalPlan(page);

// Check if plan exists
const hasPlan = await hasLocalPlan(page);

// Delete entire database
await deleteDatabase(page);
```

### Patient Helpers (`fixtures/patient.ts`)

```typescript
import {
	seedLocalPlanWithoutOnboarding,
	seedCheckIns,
	getCheckInCount,
	getPatientProfile
} from './fixtures/patient';

// Seed plan without completing onboarding
await seedLocalPlanWithoutOnboarding(page);

// Seed check-in history
await seedCheckIns(page, [
	{ zone: 'green', createdAt: new Date() },
	{ zone: 'yellow', createdAt: new Date(Date.now() - 86400000) }
]);

// Get check-in count
const count = await getCheckInCount(page);

// Get patient profile
const profile = await getPatientProfile(page);
```

### Test Data (`fixtures/test-plan.ts`)

```typescript
import {
	TEST_PLAN_PAYLOAD,
	TEST_LOCAL_PLAN,
	TEST_PASSPHRASE,
	TEST_TOKENS
} from './fixtures/test-plan';
```

## Writing New Tests

### Basic Structure

```typescript
import { expect, test } from '@playwright/test';
import { deleteDatabase, seedLocalPlan } from '../utils/indexeddb';

test.describe('Feature Name', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await deleteDatabase(page);
	});

	test('should do something', async ({ page }) => {
		await seedLocalPlan(page);
		await page.goto('/app');

		await expect(page.getByRole('heading')).toBeVisible();
	});
});
```

### Testing with Authentication

Provider tests require authentication. Options:

1. **Skip tests** that require auth (current approach)
2. **Mock API responses** using MSW or Playwright route interception
3. **Use test database** with seeded provider accounts

```typescript
// Option 1: Skip
test.skip('requires auth', async ({ page }) => {
	// Test code
});

// Option 2: Route interception
test('with mocked auth', async ({ page }) => {
	await page.route('**/auth/**', async (route) => {
		await route.fulfill({
			status: 200,
			body: JSON.stringify({ user: { id: 'test-user' } })
		});
	});
});
```

### Testing IndexedDB State

Patient routes depend on IndexedDB. There are two approaches:

#### Approach 1: Raw IndexedDB (Current - Has Limitations)

The current utilities write directly to IndexedDB, but **Dexie reactive stores don't automatically see these writes**. This causes tests to fail because the app's stores don't recognize the seeded data.

```typescript
import { deleteDatabase, seedLocalPlan } from '../utils/indexeddb';

test.beforeEach(async ({ page }) => {
	await page.goto('/'); // Establish origin
	await deleteDatabase(page); // Clean slate
	await seedLocalPlan(page); // Seed - but stores won't see it!
});
```

#### Approach 2: Via App's Dexie Instance (Recommended)

The app exposes test helpers on the window object in dev/preview mode. These use the same Dexie instance as the app, so stores properly sync.

```typescript
import { seedPlanViaApp, clearDataViaApp, seedCheckInsViaApp } from '../utils/test-helpers';

test.beforeEach(async ({ page }) => {
	await page.goto('/'); // Triggers test helper initialization
	await clearDataViaApp(page); // Clear via Dexie
	await seedPlanViaApp(page, { completeOnboarding: true }); // Seed via Dexie
});
```

The app exposes these on `window` in dev/preview mode:

- `window.__testDb`: The Dexie database instance
- `window.__testStores`: `{ localPlanStore, patientProfileStore }`
- `window.__testHelpers`: `{ seedPlan, clearAll, refreshStores }`

#### Why This Matters

Dexie maintains its own cache/state. When you write directly to IndexedDB:

1. Data is saved to IndexedDB
2. But Dexie's cache doesn't know about it
3. The app's stores (which use Dexie) still show old/empty data
4. The layout sees `onboardingComplete: false` and redirects to onboarding

Using the app's Dexie instance ensures proper sync between IndexedDB and the reactive stores.

## Accessibility Testing

The `accessibility.test.ts` file uses axe-core for WCAG compliance:

```typescript
import AxeBuilder from '@axe-core/playwright';

test('has no accessibility violations', async ({ page }) => {
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();

	expect(results.violations).toEqual([]);
});
```

## Configuration

See `playwright.config.ts` in the project root:

- **testDir**: `e2e`
- **baseURL**: `http://localhost:4173`
- **webServer**: Builds and runs preview server
- **browsers**: Chromium (local), all major browsers (CI)

## Best Practices

1. **Use semantic locators**: Prefer `getByRole()`, `getByLabel()`, `getByText()` over CSS selectors
2. **Wait for state**: Use `waitForURL()`, `waitForSelector()` instead of arbitrary timeouts
3. **Test isolation**: Each test should be independent - use `beforeEach` to reset state
4. **Descriptive names**: Test names should describe the expected behavior
5. **Don't test implementation**: Test user-visible behavior, not internal implementation

## Debugging

### Run single test with debug

```bash
pnpm exec playwright test -g "test name" --debug
```

### Generate trace on failure

```bash
pnpm exec playwright test --trace on
```

### View trace

```bash
pnpm exec playwright show-trace trace.zip
```

## CI/CD

Tests run automatically in CI. The configuration:

- Uses `github` reporter in CI
- Retries failed tests 2x
- Runs tests sequentially (`workers: 1`) for stability
- Installs all browser engines

## Troubleshooting

### Tests fail with "browser not found"

```bash
pnpm exec playwright install
```

### IndexedDB operations fail

Ensure you navigate to a page first to establish the origin:

```typescript
await page.goto('/');
await deleteDatabase(page); // Now this works
```

### Tests are flaky

1. Add explicit waits: `await page.waitForURL(...)`
2. Increase timeouts for slow operations
3. Check for race conditions in async operations

### Screenshots on failure

Screenshots are automatically saved on failure. Find them in:

```
test-results/
└── feature-test-name-chromium/
    └── test-failed-1.png
```
