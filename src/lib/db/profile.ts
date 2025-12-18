import { getDB, type PatientProfile } from './index';

/**
 * Check if a patient profile exists for the given action plan.
 * Returns false if not in browser environment.
 */
export async function hasPatientProfile(actionPlanId: string): Promise<boolean> {
	const db = getDB();
	if (!db) {
		return false;
	}

	const profile = await db.patientProfiles.where('actionPlanId').equals(actionPlanId).first();
	return profile !== undefined;
}

/**
 * Get the patient profile for a specific action plan.
 * Returns null if not found or not in browser environment.
 */
export async function getPatientProfile(actionPlanId: string): Promise<PatientProfile | null> {
	const db = getDB();
	if (!db) {
		return null;
	}

	const profile = await db.patientProfiles.where('actionPlanId').equals(actionPlanId).first();
	return profile ?? null;
}

/**
 * Get the current patient profile (associated with the most recently installed plan).
 * Returns null if not found or not in browser environment.
 */
export async function getCurrentPatientProfile(): Promise<PatientProfile | null> {
	const db = getDB();
	if (!db) {
		return null;
	}

	// Get the most recently created profile
	const profile = await db.patientProfiles.orderBy('createdAt').reverse().first();
	return profile ?? null;
}

/**
 * Input type for creating a new patient profile.
 */
export interface CreatePatientProfileInput {
	actionPlanId: string;
	displayName: string;
}

/**
 * Create a new patient profile.
 * If a profile already exists for this actionPlanId, it will be replaced.
 */
export async function createPatientProfile(input: CreatePatientProfileInput): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	const now = new Date();

	// Check if profile already exists
	const existing = await db.patientProfiles
		.where('actionPlanId')
		.equals(input.actionPlanId)
		.first();

	if (existing) {
		// Update existing profile
		await db.patientProfiles.update(existing.id!, {
			displayName: input.displayName,
			updatedAt: now
		});
	} else {
		// Insert new profile
		await db.patientProfiles.add({
			actionPlanId: input.actionPlanId,
			displayName: input.displayName,
			onboardingComplete: false,
			createdAt: now,
			updatedAt: now
		});
	}
}

/**
 * Update the display name for a patient profile.
 */
export async function updateDisplayName(actionPlanId: string, displayName: string): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	await db.patientProfiles.where('actionPlanId').equals(actionPlanId).modify({
		displayName,
		updatedAt: new Date()
	});
}

/**
 * Mark onboarding as complete for a patient profile.
 */
export async function completeOnboarding(actionPlanId: string): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	await db.patientProfiles.where('actionPlanId').equals(actionPlanId).modify({
		onboardingComplete: true,
		updatedAt: new Date()
	});
}

/**
 * Check if onboarding is complete for a given action plan.
 * Returns false if profile not found or not in browser environment.
 */
export async function isOnboardingComplete(actionPlanId: string): Promise<boolean> {
	const db = getDB();
	if (!db) {
		return false;
	}

	const profile = await db.patientProfiles.where('actionPlanId').equals(actionPlanId).first();
	return profile?.onboardingComplete ?? false;
}

/**
 * Delete a patient profile by action plan ID.
 * No-op if not in browser environment or profile doesn't exist.
 */
export async function deletePatientProfile(actionPlanId: string): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	await db.patientProfiles.where('actionPlanId').equals(actionPlanId).delete();
}

/**
 * Clear all patient profiles from IndexedDB.
 * No-op if not in browser environment.
 */
export async function clearPatientProfiles(): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	await db.patientProfiles.clear();
}
