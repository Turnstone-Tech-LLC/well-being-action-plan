import { getDB, type LocalActionPlan, type PlanPayload } from './index';
import { setPlanCookie, clearPlanCookie } from '$lib/guards/cookies';

/**
 * Check if a local plan exists in IndexedDB.
 * Returns false if not in browser environment.
 */
export async function hasLocalPlan(): Promise<boolean> {
	const db = getDB();
	if (!db) {
		return false;
	}

	const count = await db.localPlans.count();
	return count > 0;
}

/**
 * Get the local plan from IndexedDB.
 * Returns the most recently installed plan, or null if none exists.
 * Returns null if not in browser environment.
 */
export async function getLocalPlan(): Promise<LocalActionPlan | null> {
	const db = getDB();
	if (!db) {
		return null;
	}

	// Get the most recently installed plan
	const plan = await db.localPlans.orderBy('installedAt').reverse().first();

	if (plan) {
		// Update last accessed timestamp
		await db.localPlans.update(plan.id!, {
			lastAccessedAt: new Date()
		});
	}

	return plan ?? null;
}

/**
 * Get a local plan by its action plan ID.
 * Returns null if not found or not in browser environment.
 */
export async function getLocalPlanById(actionPlanId: string): Promise<LocalActionPlan | null> {
	const db = getDB();
	if (!db) {
		return null;
	}

	const plan = await db.localPlans.where('actionPlanId').equals(actionPlanId).first();

	if (plan) {
		// Update last accessed timestamp
		await db.localPlans.update(plan.id!, {
			lastAccessedAt: new Date()
		});
	}

	return plan ?? null;
}

/**
 * Get a local plan by its access code.
 * Returns null if not found or not in browser environment.
 */
export async function getLocalPlanByAccessCode(
	accessCode: string
): Promise<LocalActionPlan | null> {
	const db = getDB();
	if (!db) {
		return null;
	}

	const plan = await db.localPlans.where('accessCode').equals(accessCode).first();

	if (plan) {
		// Update last accessed timestamp
		await db.localPlans.update(plan.id!, {
			lastAccessedAt: new Date()
		});
	}

	return plan ?? null;
}

/**
 * Input type for saving a new local plan.
 */
export interface SaveLocalPlanInput {
	actionPlanId: string;
	revisionId: string;
	revisionVersion: number;
	accessCode: string;
	planPayload: PlanPayload;
	deviceInstallId: string;
}

/**
 * Save a local plan to IndexedDB.
 * If a plan with the same actionPlanId exists, it will be replaced.
 * No-op if not in browser environment.
 */
export async function saveLocalPlan(input: SaveLocalPlanInput): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	const now = new Date();

	// Check if plan already exists
	const existing = await db.localPlans.where('actionPlanId').equals(input.actionPlanId).first();

	if (existing) {
		// Update existing plan
		await db.localPlans.update(existing.id!, {
			revisionId: input.revisionId,
			revisionVersion: input.revisionVersion,
			accessCode: input.accessCode,
			planPayload: input.planPayload,
			deviceInstallId: input.deviceInstallId,
			installedAt: now,
			lastAccessedAt: now
		});
	} else {
		// Insert new plan
		await db.localPlans.add({
			actionPlanId: input.actionPlanId,
			revisionId: input.revisionId,
			revisionVersion: input.revisionVersion,
			accessCode: input.accessCode,
			planPayload: input.planPayload,
			deviceInstallId: input.deviceInstallId,
			installedAt: now,
			lastAccessedAt: now
		});
	}

	// Sync cookie with IndexedDB state
	setPlanCookie();
}

/**
 * Clear all local plans from IndexedDB.
 * No-op if not in browser environment.
 */
export async function clearLocalPlan(): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	await db.localPlans.clear();

	// Sync cookie with IndexedDB state
	clearPlanCookie();
}

/**
 * Delete a specific local plan by its action plan ID.
 * No-op if not in browser environment or plan doesn't exist.
 */
export async function deleteLocalPlan(actionPlanId: string): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	await db.localPlans.where('actionPlanId').equals(actionPlanId).delete();

	// Check if any plans remain, clear cookie if not
	const remaining = await db.localPlans.count();
	if (remaining === 0) {
		clearPlanCookie();
	}
}

/**
 * Check if IndexedDB is available in the current environment.
 */
export function isIndexedDBAvailable(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	try {
		return 'indexedDB' in window && window.indexedDB !== null;
	} catch {
		return false;
	}
}
