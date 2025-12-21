/**
 * Patient-related fixtures for E2E tests.
 * Includes helpers for IndexedDB manipulation for patient data.
 */

import type { Page } from '@playwright/test';
import { TEST_LOCAL_PLAN, TEST_PLAN_PAYLOAD } from './test-plan';

/**
 * Database version must match the app's Dexie schema version.
 */
const DB_VERSION = 4;
const DB_NAME = 'WellBeingActionPlan';

/**
 * Create a check-in object for testing.
 */
export function createTestCheckIn(
	overrides: {
		zone?: 'green' | 'yellow' | 'red';
		strategiesUsed?: string[];
		supportiveAdultsContacted?: string[];
		helpMethodsSelected?: string[];
		notes?: string;
		createdAt?: Date;
	} = {}
) {
	return {
		actionPlanId: TEST_LOCAL_PLAN.actionPlanId,
		zone: overrides.zone || 'green',
		strategiesUsed: overrides.strategiesUsed || ['skill-1'],
		supportiveAdultsContacted: overrides.supportiveAdultsContacted || [],
		helpMethodsSelected: overrides.helpMethodsSelected || [],
		notes: overrides.notes || '',
		createdAt: overrides.createdAt || new Date()
	};
}

/**
 * Seed check-ins into IndexedDB for testing.
 */
export async function seedCheckIns(
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
	const actionPlanId = TEST_LOCAL_PLAN.actionPlanId;

	await page.evaluate(
		({ checkInsData, planId, dbName, dbVersion }) => {
			return new Promise<void>((resolve, reject) => {
				const request = indexedDB.open(dbName, dbVersion);

				request.onerror = () => reject(request.error);

				request.onupgradeneeded = (event) => {
					const db = (event.target as IDBOpenDBRequest).result;

					// Create stores if they don't exist
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

					if (!db.objectStoreNames.contains('checkIns')) {
						const checkInStore = db.createObjectStore('checkIns', {
							keyPath: 'id',
							autoIncrement: true
						});
						checkInStore.createIndex('actionPlanId', 'actionPlanId', { unique: false });
						checkInStore.createIndex('zone', 'zone', { unique: false });
						checkInStore.createIndex('createdAt', 'createdAt', { unique: false });
					}
				};

				request.onsuccess = () => {
					const db = request.result;

					if (!db.objectStoreNames.contains('checkIns')) {
						db.close();
						resolve();
						return;
					}

					const transaction = db.transaction(['checkIns'], 'readwrite');
					const store = transaction.objectStore('checkIns');

					for (const checkIn of checkInsData) {
						store.add({
							actionPlanId: planId,
							zone: checkIn.zone,
							strategiesUsed: checkIn.strategiesUsed || [],
							supportiveAdultsContacted: checkIn.supportiveAdultsContacted || [],
							helpMethodsSelected: checkIn.helpMethodsSelected || [],
							notes: checkIn.notes || '',
							createdAt: checkIn.createdAt ? new Date(checkIn.createdAt) : new Date()
						});
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
		{
			checkInsData: checkIns.map((c) => ({
				...c,
				createdAt: c.createdAt?.toISOString()
			})),
			planId: actionPlanId,
			dbName: DB_NAME,
			dbVersion: DB_VERSION
		}
	);
}

/**
 * Seed a local plan with partial onboarding (not completed).
 */
export async function seedLocalPlanWithoutOnboarding(page: Page): Promise<void> {
	await page.evaluate(
		({ planData, dbName, dbVersion }) => {
			return new Promise<void>((resolve, reject) => {
				const request = indexedDB.open(dbName, dbVersion);

				request.onerror = () => reject(request.error);

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

					if (!db.objectStoreNames.contains('checkIns')) {
						const checkInStore = db.createObjectStore('checkIns', {
							keyPath: 'id',
							autoIncrement: true
						});
						checkInStore.createIndex('actionPlanId', 'actionPlanId', { unique: false });
						checkInStore.createIndex('zone', 'zone', { unique: false });
						checkInStore.createIndex('createdAt', 'createdAt', { unique: false });
					}
				};

				request.onsuccess = () => {
					const db = request.result;
					const transaction = db.transaction(['localPlans', 'patientProfiles'], 'readwrite');

					// Add the plan
					const planStore = transaction.objectStore('localPlans');
					const plan = {
						...planData,
						installedAt: new Date(),
						lastAccessedAt: new Date()
					};
					planStore.add(plan);

					// Add profile with onboarding NOT complete
					const profileStore = transaction.objectStore('patientProfiles');
					const profile = {
						actionPlanId: planData.actionPlanId,
						displayName: planData.planPayload.patientNickname || 'Test User',
						onboardingComplete: false,
						notificationsEnabled: false,
						notificationFrequency: 'none',
						notificationTime: 'morning',
						createdAt: new Date(),
						updatedAt: new Date()
					};
					profileStore.add(profile);

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
		{ planData: TEST_LOCAL_PLAN, dbName: DB_NAME, dbVersion: DB_VERSION }
	);
}

/**
 * Update the patient profile display name.
 */
export async function updatePatientDisplayName(page: Page, newName: string): Promise<void> {
	await page.evaluate(
		({ actionPlanId, displayName, dbName, dbVersion }) => {
			return new Promise<void>((resolve, reject) => {
				const request = indexedDB.open(dbName, dbVersion);

				request.onerror = () => reject(request.error);

				request.onsuccess = () => {
					const db = request.result;

					if (!db.objectStoreNames.contains('patientProfiles')) {
						db.close();
						resolve();
						return;
					}

					const transaction = db.transaction(['patientProfiles'], 'readwrite');
					const store = transaction.objectStore('patientProfiles');
					const index = store.index('actionPlanId');
					const getRequest = index.get(actionPlanId);

					getRequest.onsuccess = () => {
						const profile = getRequest.result;
						if (profile) {
							profile.displayName = displayName;
							profile.updatedAt = new Date();
							store.put(profile);
						}
					};

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
		{
			actionPlanId: TEST_LOCAL_PLAN.actionPlanId,
			displayName: newName,
			dbName: DB_NAME,
			dbVersion: DB_VERSION
		}
	);
}

/**
 * Get the current patient profile from IndexedDB.
 */
export async function getPatientProfile(page: Page): Promise<{
	displayName: string;
	onboardingComplete: boolean;
	notificationsEnabled: boolean;
} | null> {
	return await page.evaluate(
		({ actionPlanId, dbName, dbVersion }) => {
			return new Promise((resolve, reject) => {
				const request = indexedDB.open(dbName, dbVersion);

				request.onerror = () => resolve(null);

				request.onsuccess = () => {
					const db = request.result;

					if (!db.objectStoreNames.contains('patientProfiles')) {
						db.close();
						resolve(null);
						return;
					}

					const transaction = db.transaction(['patientProfiles'], 'readonly');
					const store = transaction.objectStore('patientProfiles');
					const index = store.index('actionPlanId');
					const getRequest = index.get(actionPlanId);

					getRequest.onsuccess = () => {
						db.close();
						const profile = getRequest.result;
						if (profile) {
							resolve({
								displayName: profile.displayName,
								onboardingComplete: profile.onboardingComplete,
								notificationsEnabled: profile.notificationsEnabled
							});
						} else {
							resolve(null);
						}
					};

					getRequest.onerror = () => {
						db.close();
						reject(getRequest.error);
					};
				};
			});
		},
		{
			actionPlanId: TEST_LOCAL_PLAN.actionPlanId,
			dbName: DB_NAME,
			dbVersion: DB_VERSION
		}
	);
}

/**
 * Get check-in count from IndexedDB.
 */
export async function getCheckInCount(page: Page): Promise<number> {
	return await page.evaluate(
		({ actionPlanId, dbName, dbVersion }) => {
			return new Promise((resolve, reject) => {
				const request = indexedDB.open(dbName, dbVersion);

				request.onerror = () => resolve(0);

				request.onsuccess = () => {
					const db = request.result;

					if (!db.objectStoreNames.contains('checkIns')) {
						db.close();
						resolve(0);
						return;
					}

					const transaction = db.transaction(['checkIns'], 'readonly');
					const store = transaction.objectStore('checkIns');
					const index = store.index('actionPlanId');
					const countRequest = index.count(actionPlanId);

					countRequest.onsuccess = () => {
						db.close();
						resolve(countRequest.result);
					};

					countRequest.onerror = () => {
						db.close();
						reject(countRequest.error);
					};
				};
			});
		},
		{
			actionPlanId: TEST_LOCAL_PLAN.actionPlanId,
			dbName: DB_NAME,
			dbVersion: DB_VERSION
		}
	);
}

export { TEST_LOCAL_PLAN, TEST_PLAN_PAYLOAD };
