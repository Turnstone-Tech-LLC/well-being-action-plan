import Dexie, { type EntityTable } from 'dexie';

/**
 * Represents the immutable plan payload snapshot sent to the patient.
 * This mirrors the `plan_payload` JSONB structure from action_plan_revisions.
 */
export interface PlanPayload {
	patientNickname: string;
	happyWhen: string;
	happyBecause: string;
	skills: Array<{
		id: string;
		title: string;
		description: string;
		category: string;
		additionalInfo?: string;
		displayOrder: number;
	}>;
	supportiveAdults: Array<{
		id: string;
		type: string;
		typeDescription?: string;
		name: string;
		contactInfo: string;
		isPrimary: boolean;
		displayOrder: number;
	}>;
	helpMethods: Array<{
		id: string;
		title: string;
		description: string;
		additionalInfo?: string;
		displayOrder: number;
	}>;
	crisisResources: Array<{
		id: string;
		name: string;
		contact: string;
		contactType: string;
		description: string;
		displayOrder: number;
	}>;
}

/**
 * Local representation of an installed action plan.
 * Stored in IndexedDB for offline access.
 */
export interface LocalActionPlan {
	/** Primary key for local storage (auto-generated) */
	id?: number;
	/** Matches the server action_plan_id (UUID) */
	actionPlanId: string;
	/** The revision ID this install is based on */
	revisionId: string;
	/** The revision version number */
	revisionVersion: number;
	/** Access code for the plan */
	accessCode: string;
	/** The immutable snapshot of the plan */
	planPayload: PlanPayload;
	/** Device install ID for tracking */
	deviceInstallId: string;
	/** When this plan was installed locally */
	installedAt: Date;
	/** Last time the plan was accessed/viewed */
	lastAccessedAt: Date;
}

/**
 * Notification frequency options for reminders.
 */
export type NotificationFrequency = 'daily' | 'every_few_days' | 'weekly' | 'none';

/**
 * Time preference for notifications.
 */
export type NotificationTime = 'morning' | 'afternoon' | 'evening';

/**
 * Represents a patient's profile data stored locally.
 * Created during onboarding after token validation.
 */
export interface PatientProfile {
	/** Primary key for local storage (auto-generated) */
	id?: number;
	/** Matches the action plan ID this profile is associated with */
	actionPlanId: string;
	/** Display name chosen by the patient */
	displayName: string;
	/** Whether onboarding has been completed */
	onboardingComplete: boolean;
	/** Whether push notifications are enabled */
	notificationsEnabled: boolean;
	/** How often to send reminder notifications */
	notificationFrequency: NotificationFrequency;
	/** Preferred time of day for notifications */
	notificationTime: NotificationTime;
	/** Last time a reminder was shown */
	lastReminderShown?: Date;
	/** Next appointment date for reminder scheduling */
	nextAppointmentDate?: Date;
	/** Last time a provider report was generated */
	lastProviderReportDate?: Date;
	/** When this profile was created */
	createdAt: Date;
	/** Last time the profile was updated */
	updatedAt: Date;
}

/**
 * Zone colors following the well-being zones concept:
 * - green: Feeling good, using coping skills proactively
 * - yellow: Feeling stressed, need extra support
 * - red: In crisis, need immediate help
 */
export type CheckInZone = 'green' | 'yellow' | 'red';

/**
 * Represents a patient check-in record.
 * Stored in IndexedDB for tracking well-being over time.
 */
export interface CheckIn {
	/** Primary key for local storage (auto-generated) */
	id?: number;
	/** Matches the action plan ID this check-in is associated with */
	actionPlanId: string;
	/** The zone the patient selected during check-in */
	zone: CheckInZone;
	/** IDs of coping strategies used during this check-in */
	strategiesUsed: string[];
	/** IDs of supportive adults contacted during this check-in */
	supportiveAdultsContacted: string[];
	/** IDs of help methods selected during this check-in */
	helpMethodsSelected: string[];
	/** Optional notes from the patient */
	notes?: string;
	/** Open-ended "why" context for yellow/red zone check-ins */
	feelingNotes?: string;
	/** ID of supportive adult contacted during red zone check-in */
	contactedAdultId?: string;
	/** Denormalized name of contacted adult for display */
	contactedAdultName?: string;
	/** When this check-in was created */
	createdAt: Date;
}

/**
 * Dexie database for Well-Being Action Plan local storage.
 * Uses IndexedDB under the hood for offline-capable storage.
 */
class WellBeingDB extends Dexie {
	localPlans!: EntityTable<LocalActionPlan, 'id'>;
	patientProfiles!: EntityTable<PatientProfile, 'id'>;
	checkIns!: EntityTable<CheckIn, 'id'>;

	constructor() {
		super('WellBeingActionPlan');

		this.version(1).stores({
			// Primary key is auto-incrementing id
			// Indexed fields: actionPlanId (unique), accessCode, installedAt
			localPlans: '++id, &actionPlanId, accessCode, installedAt'
		});

		// Version 2: Add patient profiles table
		this.version(2).stores({
			localPlans: '++id, &actionPlanId, accessCode, installedAt',
			patientProfiles: '++id, &actionPlanId, onboardingComplete, createdAt'
		});

		// Version 3: Add notification preferences to patient profiles
		this.version(3)
			.stores({
				localPlans: '++id, &actionPlanId, accessCode, installedAt',
				patientProfiles: '++id, &actionPlanId, onboardingComplete, createdAt'
			})
			.upgrade((tx) => {
				// Migrate existing profiles to have default notification settings
				return tx
					.table('patientProfiles')
					.toCollection()
					.modify((profile) => {
						profile.notificationsEnabled = false;
						profile.notificationFrequency = 'none';
						profile.notificationTime = 'morning';
					});
			});

		// Version 4: Add check-ins table
		this.version(4).stores({
			localPlans: '++id, &actionPlanId, accessCode, installedAt',
			patientProfiles: '++id, &actionPlanId, onboardingComplete, createdAt',
			checkIns: '++id, actionPlanId, zone, createdAt'
		});

		// Version 5: Add appointment reminder fields to patient profiles
		this.version(5)
			.stores({
				localPlans: '++id, &actionPlanId, accessCode, installedAt',
				patientProfiles: '++id, &actionPlanId, onboardingComplete, createdAt',
				checkIns: '++id, actionPlanId, zone, createdAt'
			})
			.upgrade((tx) => {
				// Migrate existing profiles to have appointment fields (undefined by default)
				return tx
					.table('patientProfiles')
					.toCollection()
					.modify((profile) => {
						profile.nextAppointmentDate = undefined;
						profile.lastProviderReportDate = undefined;
					});
			});
	}
}

/**
 * Singleton database instance.
 * Only created in browser environment.
 */
let db: WellBeingDB | null = null;

/**
 * Get the database instance.
 * Returns null if not in browser environment (SSR).
 */
export function getDB(): WellBeingDB | null {
	if (typeof window === 'undefined') {
		return null;
	}

	if (!db) {
		db = new WellBeingDB();
	}

	return db;
}

/**
 * Check if a local plan exists in IndexedDB.
 * Returns true if any plan is stored locally.
 */
export async function hasLocalPlan(): Promise<boolean> {
	const database = getDB();
	if (!database) {
		return false;
	}

	const count = await database.localPlans.count();
	return count > 0;
}

/**
 * Get the currently stored local plan.
 * Returns the most recently installed plan, or null if none exists.
 */
export async function getLocalPlan(): Promise<LocalActionPlan | null> {
	const database = getDB();
	if (!database) {
		return null;
	}

	// Get the most recently installed plan
	const plan = await database.localPlans.orderBy('installedAt').reverse().first();
	return plan ?? null;
}

/**
 * Save a plan to local IndexedDB storage.
 * If a plan already exists for this actionPlanId, it will be updated.
 */
export async function saveLocalPlan(plan: Omit<LocalActionPlan, 'id'>): Promise<number> {
	const database = getDB();
	if (!database) {
		throw new Error('Database not available (not in browser environment)');
	}

	// Check if plan already exists for this actionPlanId
	const existing = await database.localPlans
		.where('actionPlanId')
		.equals(plan.actionPlanId)
		.first();

	if (existing?.id) {
		// Update existing plan
		await database.localPlans.update(existing.id, plan);
		return existing.id;
	}

	// Add new plan
	const id = await database.localPlans.add(plan as LocalActionPlan);
	return id!;
}

/**
 * Update the lastAccessedAt timestamp for the local plan.
 */
export async function updateLastAccessed(actionPlanId: string): Promise<void> {
	const database = getDB();
	if (!database) {
		return;
	}

	await database.localPlans.where('actionPlanId').equals(actionPlanId).modify({
		lastAccessedAt: new Date()
	});
}

/**
 * Clear all local plan data from IndexedDB.
 */
export async function clearLocalData(): Promise<void> {
	const database = getDB();
	if (!database) {
		return;
	}

	await database.localPlans.clear();
}

/**
 * Clear all data from IndexedDB (plans, profiles, check-ins).
 * Use this for "Clear All Data" functionality.
 */
export async function clearAllData(): Promise<void> {
	const database = getDB();
	if (!database) {
		return;
	}

	await Promise.all([
		database.localPlans.clear(),
		database.patientProfiles.clear(),
		database.checkIns.clear()
	]);
}

/**
 * Generate a unique device install ID.
 * Uses crypto.randomUUID if available, falls back to a simple implementation.
 */
export function generateDeviceInstallId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback for older browsers
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export { db };
export type { WellBeingDB };
