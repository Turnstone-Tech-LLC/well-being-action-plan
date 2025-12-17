/**
 * IndexedDB utilities for E2E testing.
 * These functions run in the browser context via page.evaluate().
 */

import type { Page } from '@playwright/test';
import { TEST_LOCAL_PLAN } from '../fixtures/test-plan';

/**
 * Seed IndexedDB with a test plan.
 * This populates the local database so tests can verify bypass behavior.
 */
export async function seedLocalPlan(page: Page): Promise<void> {
	await page.evaluate((planData) => {
		return new Promise<void>((resolve, reject) => {
			const request = indexedDB.open('WellBeingActionPlan', 1);

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
			};

			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction(['localPlans'], 'readwrite');
				const store = transaction.objectStore('localPlans');

				const plan = {
					...planData,
					installedAt: new Date(),
					lastAccessedAt: new Date()
				};

				const addRequest = store.add(plan);

				addRequest.onsuccess = () => {
					db.close();
					resolve();
				};

				addRequest.onerror = () => {
					db.close();
					reject(addRequest.error);
				};
			};
		});
	}, TEST_LOCAL_PLAN);
}

/**
 * Clear all local plan data from IndexedDB.
 * Use this between tests to ensure isolation.
 */
export async function clearLocalPlan(page: Page): Promise<void> {
	await page.evaluate(() => {
		return new Promise<void>((resolve, reject) => {
			const request = indexedDB.open('WellBeingActionPlan', 1);

			request.onerror = () => {
				// Database might not exist yet, which is fine
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains('localPlans')) {
					db.createObjectStore('localPlans', {
						keyPath: 'id',
						autoIncrement: true
					});
				}
			};

			request.onsuccess = () => {
				const db = request.result;

				if (!db.objectStoreNames.contains('localPlans')) {
					db.close();
					resolve();
					return;
				}

				const transaction = db.transaction(['localPlans'], 'readwrite');
				const store = transaction.objectStore('localPlans');
				const clearRequest = store.clear();

				clearRequest.onsuccess = () => {
					db.close();
					resolve();
				};

				clearRequest.onerror = () => {
					db.close();
					reject(clearRequest.error);
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
			const request = indexedDB.open('WellBeingActionPlan', 1);

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
