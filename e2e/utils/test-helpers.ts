/**
 * E2E Test Helpers using the App's Dexie Instance
 *
 * These utilities use the app's own database instance (exposed via __testHelpers)
 * to seed and clear data. This ensures proper sync with Dexie reactive stores.
 *
 * The app exposes these on the window object in dev/preview mode:
 * - window.__testDb: The Dexie database instance
 * - window.__testStores: { localPlanStore, patientProfileStore }
 * - window.__testHelpers: { seedPlan, clearAll, refreshStores }
 */

import type { Page } from '@playwright/test';
import { TEST_LOCAL_PLAN } from '../fixtures/test-plan';

/**
 * Wait for test helpers to be initialized on the page.
 * The app initializes these in onMount, so we may need to wait.
 */
export async function waitForTestHelpers(page: Page, timeout = 5000): Promise<boolean> {
	try {
		await page.waitForFunction(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			() => typeof (window as any).__testHelpers !== 'undefined',
			{ timeout }
		);
		return true;
	} catch {
		console.warn('Test helpers not available - is the app running in dev/preview mode?');
		return false;
	}
}

/**
 * Seed a local plan using the app's test helpers.
 * This properly syncs with Dexie reactive stores.
 */
export async function seedPlanViaApp(
	page: Page,
	options: { completeOnboarding?: boolean } = {}
): Promise<void> {
	const { completeOnboarding = true } = options;

	const helpersAvailable = await waitForTestHelpers(page);
	if (!helpersAvailable) {
		throw new Error('Test helpers not available. Make sure app is running in dev/preview mode.');
	}

	await page.evaluate(
		async ({ planData, completeOnboarding }) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await (window as any).__testHelpers.seedPlan(planData, { completeOnboarding });
		},
		{ planData: TEST_LOCAL_PLAN, completeOnboarding }
	);
}

/**
 * Seed check-ins using the app's database instance.
 */
export async function seedCheckInsViaApp(
	page: Page,
	checkIns: Array<{
		zone: 'green' | 'yellow' | 'red';
		strategiesUsed?: string[];
		supportiveAdultsContacted?: string[];
		helpMethodsSelected?: string[];
		notes?: string;
		createdAt?: Date;
	}>
): Promise<void> {
	const helpersAvailable = await waitForTestHelpers(page);
	if (!helpersAvailable) {
		throw new Error('Test helpers not available. Make sure app is running in dev/preview mode.');
	}

	await page.evaluate(
		async ({ checkIns, actionPlanId }) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const db = (window as any).__testDb;
			if (!db) {
				throw new Error('Test db not available');
			}

			for (const checkIn of checkIns) {
				await db.checkIns.add({
					actionPlanId,
					zone: checkIn.zone,
					strategiesUsed: checkIn.strategiesUsed || [],
					supportiveAdultsContacted: checkIn.supportiveAdultsContacted || [],
					helpMethodsSelected: checkIn.helpMethodsSelected || [],
					notes: checkIn.notes,
					createdAt: checkIn.createdAt ? new Date(checkIn.createdAt) : new Date()
				});
			}
		},
		{
			checkIns: checkIns.map((c) => ({
				...c,
				createdAt: c.createdAt?.toISOString()
			})),
			actionPlanId: TEST_LOCAL_PLAN.actionPlanId
		}
	);
}

/**
 * Clear all data using the app's test helpers.
 */
export async function clearDataViaApp(page: Page): Promise<void> {
	const helpersAvailable = await waitForTestHelpers(page);
	if (!helpersAvailable) {
		throw new Error('Test helpers not available. Make sure app is running in dev/preview mode.');
	}

	await page.evaluate(async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (window as any).__testHelpers.clearAll();
	});
}

/**
 * Refresh the stores to pick up any changes.
 */
export async function refreshStoresViaApp(page: Page): Promise<void> {
	const helpersAvailable = await waitForTestHelpers(page);
	if (!helpersAvailable) {
		return; // Silently fail if helpers not available
	}

	await page.evaluate(async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (window as any).__testHelpers.refreshStores();
	});
}

/**
 * Check if a local plan exists via the app's database.
 */
export async function hasLocalPlanViaApp(page: Page): Promise<boolean> {
	const helpersAvailable = await waitForTestHelpers(page);
	if (!helpersAvailable) {
		return false;
	}

	return await page.evaluate(async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const db = (window as any).__testDb;
		if (!db) return false;
		const count = await db.localPlans.count();
		return count > 0;
	});
}

/**
 * Get the check-in count via the app's database.
 */
export async function getCheckInCountViaApp(page: Page): Promise<number> {
	const helpersAvailable = await waitForTestHelpers(page);
	if (!helpersAvailable) {
		return 0;
	}

	return await page.evaluate(async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const db = (window as any).__testDb;
		if (!db) return 0;
		return await db.checkIns.count();
	});
}
