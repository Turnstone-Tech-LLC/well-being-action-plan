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
 * Dexie database for Well-Being Action Plan local storage.
 * Uses IndexedDB under the hood for offline-capable storage.
 */
class WellBeingDB extends Dexie {
	localPlans!: EntityTable<LocalActionPlan, 'id'>;

	constructor() {
		super('WellBeingActionPlan');

		this.version(1).stores({
			// Primary key is auto-incrementing id
			// Indexed fields: actionPlanId (unique), accessCode, installedAt
			localPlans: '++id, &actionPlanId, accessCode, installedAt'
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

export { db };
export type { WellBeingDB };
