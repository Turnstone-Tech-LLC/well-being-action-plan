import {
	getDB,
	type PatientProfile,
	type NotificationFrequency,
	type NotificationTime
} from './index';

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
		// Insert new profile with default notification settings
		await db.patientProfiles.add({
			actionPlanId: input.actionPlanId,
			displayName: input.displayName,
			onboardingComplete: false,
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning',
			createdAt: now,
			updatedAt: now
		});
	}
}

/**
 * Input type for updating notification preferences.
 */
export interface UpdateNotificationPreferencesInput {
	actionPlanId: string;
	notificationsEnabled: boolean;
	notificationFrequency: NotificationFrequency;
	notificationTime: NotificationTime;
}

/**
 * Update notification preferences for a patient profile.
 */
export async function updateNotificationPreferences(
	input: UpdateNotificationPreferencesInput
): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	await db.patientProfiles.where('actionPlanId').equals(input.actionPlanId).modify({
		notificationsEnabled: input.notificationsEnabled,
		notificationFrequency: input.notificationFrequency,
		notificationTime: input.notificationTime,
		updatedAt: new Date()
	});
}

/**
 * Update the last reminder shown timestamp.
 */
export async function updateLastReminderShown(actionPlanId: string): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	await db.patientProfiles.where('actionPlanId').equals(actionPlanId).modify({
		lastReminderShown: new Date(),
		updatedAt: new Date()
	});
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

/**
 * Input type for restoring a patient profile from backup.
 */
export interface RestorePatientProfileInput {
	actionPlanId: string;
	displayName: string;
	onboardingComplete: boolean;
	notificationsEnabled: boolean;
	notificationFrequency: NotificationFrequency;
	notificationTime: NotificationTime;
	lastReminderShown?: Date;
}

/**
 * Restore a patient profile from backup data.
 * If a profile already exists for this actionPlanId, it will be replaced.
 */
export async function restorePatientProfile(input: RestorePatientProfileInput): Promise<void> {
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

	const profileData = {
		actionPlanId: input.actionPlanId,
		displayName: input.displayName,
		onboardingComplete: input.onboardingComplete,
		notificationsEnabled: input.notificationsEnabled,
		notificationFrequency: input.notificationFrequency,
		notificationTime: input.notificationTime,
		lastReminderShown: input.lastReminderShown,
		createdAt: now,
		updatedAt: now
	};

	if (existing) {
		await db.patientProfiles.update(existing.id!, profileData);
	} else {
		await db.patientProfiles.add(profileData);
	}
}

/**
 * Save the next appointment date for a patient profile.
 */
export async function saveNextAppointmentDate(
	actionPlanId: string,
	appointmentDate: Date | null
): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	await db.patientProfiles
		.where('actionPlanId')
		.equals(actionPlanId)
		.modify({
			nextAppointmentDate: appointmentDate ?? undefined,
			updatedAt: new Date()
		});
}

/**
 * Get the next appointment date for a patient profile.
 */
export async function getNextAppointmentDate(actionPlanId: string): Promise<Date | null> {
	const db = getDB();
	if (!db) {
		return null;
	}

	const profile = await db.patientProfiles.where('actionPlanId').equals(actionPlanId).first();
	return profile?.nextAppointmentDate ?? null;
}

/**
 * Save the last provider report generation date for a patient profile.
 */
export async function saveLastProviderReportDate(
	actionPlanId: string,
	reportDate: Date
): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	await db.patientProfiles.where('actionPlanId').equals(actionPlanId).modify({
		lastProviderReportDate: reportDate,
		updatedAt: new Date()
	});
}

/**
 * Get the last provider report generation date for a patient profile.
 */
export async function getLastProviderReportDate(actionPlanId: string): Promise<Date | null> {
	const db = getDB();
	if (!db) {
		return null;
	}

	const profile = await db.patientProfiles.where('actionPlanId').equals(actionPlanId).first();
	return profile?.lastProviderReportDate ?? null;
}
