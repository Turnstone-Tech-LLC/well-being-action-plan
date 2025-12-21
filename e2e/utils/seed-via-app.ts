/**
 * Seed data via the app's own store/db methods.
 *
 * This approach works with Dexie reactive stores because it uses the same
 * Dexie instance the app uses, rather than directly writing to IndexedDB.
 *
 * The key insight: Dexie caches its own state and doesn't automatically
 * see external IndexedDB writes. By using the app's db module directly
 * (via page.evaluate), we ensure the Dexie instance is aware of the data.
 */

import type { Page } from '@playwright/test';
import { TEST_LOCAL_PLAN } from '../fixtures/test-plan';

/**
 * Seed a local plan using the app's db module.
 * This properly syncs with Dexie reactive stores.
 */
export async function seedPlanViaApp(
	page: Page,
	options: { completeOnboarding?: boolean } = {}
): Promise<void> {
	const { completeOnboarding = true } = options;

	// Use the app's db module directly to save the plan
	await page.evaluate(
		async ({ planData, completeOnboarding }) => {
			// Access the app's db module (we'll need to expose it)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const db = (window as any).__testDb;
			if (!db) {
				throw new Error('Test db not exposed on window. Add test helper script.');
			}

			// Save the local plan
			await db.localPlans.add({
				actionPlanId: planData.actionPlanId,
				revisionId: planData.revisionId,
				revisionVersion: planData.revisionVersion,
				accessCode: planData.accessCode,
				planPayload: planData.planPayload,
				deviceInstallId: planData.deviceInstallId,
				installedAt: new Date(),
				lastAccessedAt: new Date()
			});

			// Create patient profile if completing onboarding
			if (completeOnboarding) {
				await db.patientProfiles.add({
					actionPlanId: planData.actionPlanId,
					displayName: planData.planPayload.patientNickname || 'Test User',
					onboardingComplete: true,
					notificationsEnabled: false,
					notificationFrequency: 'none',
					notificationTime: 'morning',
					createdAt: new Date(),
					updatedAt: new Date()
				});
			}
		},
		{ planData: TEST_LOCAL_PLAN, completeOnboarding }
	);
}

/**
 * Seed check-ins using the app's db module.
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
	await page.evaluate(
		async ({ checkIns, actionPlanId }) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const db = (window as any).__testDb;
			if (!db) {
				throw new Error('Test db not exposed on window. Add test helper script.');
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
 * Clear all data using the app's db module.
 */
export async function clearDataViaApp(page: Page): Promise<void> {
	await page.evaluate(async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const db = (window as any).__testDb;
		if (!db) {
			throw new Error('Test db not exposed on window. Add test helper script.');
		}

		await Promise.all([db.localPlans.clear(), db.patientProfiles.clear(), db.checkIns.clear()]);
	});
}

/**
 * Refresh the stores after seeding data.
 * This is needed because the stores cache their state.
 */
export async function refreshStores(page: Page): Promise<void> {
	await page.evaluate(async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const stores = (window as any).__testStores;
		if (stores) {
			await stores.localPlanStore.refresh();
			await stores.patientProfileStore.refresh();
		}
	});
}
