/**
 * Test Helpers for E2E Testing
 *
 * This module exposes the database and stores on the window object
 * so Playwright tests can seed data using the app's own Dexie instance.
 *
 * IMPORTANT: Only import this in development/test builds.
 * It should NOT be included in production builds.
 */

import { browser } from '$app/environment';
import { getDB } from '$lib/db';
import { localPlanStore } from '$lib/stores/localPlan';
import { patientProfileStore } from '$lib/stores/patientProfile';

declare global {
	interface Window {
		__testDb: ReturnType<typeof getDB>;
		__testStores: {
			localPlanStore: typeof localPlanStore;
			patientProfileStore: typeof patientProfileStore;
		};
		__testHelpers: {
			seedPlan: (planData: any, options?: { completeOnboarding?: boolean }) => Promise<void>;
			clearAll: () => Promise<void>;
			refreshStores: () => Promise<void>;
		};
	}
}

/**
 * Initialize test helpers by exposing db and stores on window.
 * Call this in your app's root layout during development/test mode.
 */
export function initTestHelpers(): void {
	if (!browser) return;

	const db = getDB();
	if (!db) return;

	// Expose the database instance
	window.__testDb = db;

	// Expose the stores
	window.__testStores = {
		localPlanStore,
		patientProfileStore
	};

	// Expose helper functions
	window.__testHelpers = {
		async seedPlan(planData: any, options: { completeOnboarding?: boolean } = {}) {
			const { completeOnboarding = true } = options;

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

			// Refresh the stores so they pick up the new data
			await localPlanStore.refresh();
			await patientProfileStore.refresh();
		},

		async clearAll() {
			await Promise.all([db.localPlans.clear(), db.patientProfiles.clear(), db.checkIns.clear()]);

			// Refresh the stores so they pick up the cleared state
			await localPlanStore.refresh();
			await patientProfileStore.refresh();
		},

		async refreshStores() {
			await localPlanStore.refresh();
			await patientProfileStore.refresh();
		}
	};

	console.log(
		'[Test Helpers] Initialized - window.__testDb, __testStores, __testHelpers available'
	);
}
