/**
 * IndexedDB utilities for E2E testing.
 * These functions run in the browser context via page.evaluate().
 *
 * Note: Database version must match the app's Dexie schema version (currently 2).
 */

import type { Page } from '@playwright/test';
import { TEST_LOCAL_PLAN } from '../fixtures/test-plan';

/**
 * Seed IndexedDB with a test plan and optionally a patient profile.
 * This populates the local database so tests can verify bypass behavior.
 */
export async function seedLocalPlan(
	page: Page,
	options: { withCompletedOnboarding?: boolean } = {}
): Promise<void> {
	const { withCompletedOnboarding = true } = options;

	await page.evaluate(
		({ planData, completeOnboarding }) => {
			return new Promise<void>((resolve, reject) => {
				const request = indexedDB.open('WellBeingActionPlan', 2);

				request.onerror = () => reject(request.error);

				request.onupgradeneeded = (event) => {
					const db = (event.target as IDBOpenDBRequest).result;

					// Create localPlans store if it doesn't exist
					if (!db.objectStoreNames.contains('localPlans')) {
						const store = db.createObjectStore('localPlans', {
							keyPath: 'id',
							autoIncrement: true
						});
						store.createIndex('actionPlanId', 'actionPlanId', { unique: true });
						store.createIndex('accessCode', 'accessCode', { unique: false });
						store.createIndex('installedAt', 'installedAt', { unique: false });
					}

					// Create patientProfiles store if it doesn't exist (version 2)
					if (!db.objectStoreNames.contains('patientProfiles')) {
						const profileStore = db.createObjectStore('patientProfiles', {
							keyPath: 'id',
							autoIncrement: true
						});
						profileStore.createIndex('actionPlanId', 'actionPlanId', { unique: true });
						profileStore.createIndex('onboardingComplete', 'onboardingComplete', { unique: false });
						profileStore.createIndex('createdAt', 'createdAt', { unique: false });
					}
				};

				request.onsuccess = () => {
					const db = request.result;
					const stores = completeOnboarding ? ['localPlans', 'patientProfiles'] : ['localPlans'];
					const transaction = db.transaction(stores, 'readwrite');

					// Add the plan
					const planStore = transaction.objectStore('localPlans');
					const plan = {
						...planData,
						installedAt: new Date(),
						lastAccessedAt: new Date()
					};
					planStore.add(plan);

					// Add a patient profile with completed onboarding if requested
					if (completeOnboarding) {
						const profileStore = transaction.objectStore('patientProfiles');
						const profile = {
							actionPlanId: planData.actionPlanId,
							displayName: planData.planPayload.patientNickname || 'Test User',
							onboardingComplete: true,
							createdAt: new Date(),
							updatedAt: new Date()
						};
						profileStore.add(profile);
					}

					transaction.oncomplete = () => {
						db.close();
						resolve();
					};

					transaction.onerror = () => {
						db.close();
						reject(transaction.error);
					};
				};
			});
		},
		{ planData: TEST_LOCAL_PLAN, completeOnboarding: withCompletedOnboarding }
	);
}

/**
 * Clear all local plan and profile data from IndexedDB.
 * Use this between tests to ensure isolation.
 */
export async function clearLocalPlan(page: Page): Promise<void> {
	await page.evaluate(() => {
		return new Promise<void>((resolve, reject) => {
			const request = indexedDB.open('WellBeingActionPlan', 2);

			request.onerror = () => {
				// Database might not exist yet, which is fine
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				if (!db.objectStoreNames.contains('localPlans')) {
					const store = db.createObjectStore('localPlans', {
						keyPath: 'id',
						autoIncrement: true
					});
					store.createIndex('actionPlanId', 'actionPlanId', { unique: true });
					store.createIndex('accessCode', 'accessCode', { unique: false });
					store.createIndex('installedAt', 'installedAt', { unique: false });
				}

				if (!db.objectStoreNames.contains('patientProfiles')) {
					const profileStore = db.createObjectStore('patientProfiles', {
						keyPath: 'id',
						autoIncrement: true
					});
					profileStore.createIndex('actionPlanId', 'actionPlanId', { unique: true });
					profileStore.createIndex('onboardingComplete', 'onboardingComplete', { unique: false });
					profileStore.createIndex('createdAt', 'createdAt', { unique: false });
				}
			};

			request.onsuccess = () => {
				const db = request.result;
				const storesToClear: string[] = [];

				if (db.objectStoreNames.contains('localPlans')) {
					storesToClear.push('localPlans');
				}
				if (db.objectStoreNames.contains('patientProfiles')) {
					storesToClear.push('patientProfiles');
				}

				if (storesToClear.length === 0) {
					db.close();
					resolve();
					return;
				}

				const transaction = db.transaction(storesToClear, 'readwrite');

				storesToClear.forEach((storeName) => {
					transaction.objectStore(storeName).clear();
				});

				transaction.oncomplete = () => {
					db.close();
					resolve();
				};

				transaction.onerror = () => {
					db.close();
					reject(transaction.error);
				};
			};
		});
	});
}

/**
 * Check if a local plan exists in IndexedDB.
 */
export async function hasLocalPlan(page: Page): Promise<boolean> {
	return await page.evaluate(() => {
		return new Promise<boolean>((resolve, reject) => {
			const request = indexedDB.open('WellBeingActionPlan', 2);

			request.onerror = () => resolve(false);

			request.onupgradeneeded = () => {
				// Database is being created, no data exists
				resolve(false);
			};

			request.onsuccess = () => {
				const db = request.result;

				if (!db.objectStoreNames.contains('localPlans')) {
					db.close();
					resolve(false);
					return;
				}

				const transaction = db.transaction(['localPlans'], 'readonly');
				const store = transaction.objectStore('localPlans');
				const countRequest = store.count();

				countRequest.onsuccess = () => {
					db.close();
					resolve(countRequest.result > 0);
				};

				countRequest.onerror = () => {
					db.close();
					reject(countRequest.error);
				};
			};
		});
	});
}

/**
 * Delete the entire IndexedDB database for a clean slate.
 */
export async function deleteDatabase(page: Page): Promise<void> {
	await page.evaluate(() => {
		return new Promise<void>((resolve) => {
			const request = indexedDB.deleteDatabase('WellBeingActionPlan');
			request.onsuccess = () => resolve();
			request.onerror = () => resolve(); // Resolve even on error
			request.onblocked = () => resolve(); // Resolve even if blocked
		});
	});
}
