import { getDB, type CheckIn, type CheckInZone } from './index';

/**
 * Input type for creating a new check-in.
 */
export interface CreateCheckInInput {
	actionPlanId: string;
	zone: CheckInZone;
	strategiesUsed?: string[];
	supportiveAdultsContacted?: string[];
	helpMethodsSelected?: string[];
	notes?: string;
}

/**
 * Get recent check-ins for an action plan.
 * Returns check-ins sorted by createdAt in descending order (most recent first).
 */
export async function getRecentCheckIns(
	actionPlanId: string,
	limit: number = 7
): Promise<CheckIn[]> {
	const db = getDB();
	if (!db) {
		return [];
	}

	const checkIns = await db.checkIns
		.where('actionPlanId')
		.equals(actionPlanId)
		.reverse()
		.sortBy('createdAt');

	// Return most recent first, limited
	return checkIns.slice(0, limit);
}

/**
 * Get check-ins within a date range for an action plan.
 * Returns check-ins sorted by createdAt in descending order (most recent first).
 */
export async function getCheckInsByDateRange(
	actionPlanId: string,
	start: Date,
	end: Date
): Promise<CheckIn[]> {
	const db = getDB();
	if (!db) {
		return [];
	}

	const allCheckIns = await db.checkIns
		.where('actionPlanId')
		.equals(actionPlanId)
		.sortBy('createdAt');

	// Filter by date range and reverse for most recent first
	return allCheckIns
		.filter((checkIn) => {
			const createdAt = new Date(checkIn.createdAt);
			return createdAt >= start && createdAt <= end;
		})
		.reverse();
}

/**
 * Save a new check-in to the database.
 * Returns the ID of the created check-in.
 *
 * Note: We use spread operators to create plain arrays from the input arrays.
 * This is necessary because Svelte 5's $state() creates Proxy objects for arrays,
 * and IndexedDB's structured clone algorithm cannot clone Proxy objects.
 */
export async function saveCheckIn(input: CreateCheckInInput): Promise<number | undefined> {
	const db = getDB();
	if (!db) {
		return undefined;
	}

	// Create plain arrays from input arrays (they may be Svelte 5 Proxy objects)
	const checkIn: Omit<CheckIn, 'id'> = {
		actionPlanId: input.actionPlanId,
		zone: input.zone,
		strategiesUsed: [...(input.strategiesUsed ?? [])],
		supportiveAdultsContacted: [...(input.supportiveAdultsContacted ?? [])],
		helpMethodsSelected: [...(input.helpMethodsSelected ?? [])],
		notes: input.notes,
		createdAt: new Date()
	};

	const id = await db.checkIns.add(checkIn as CheckIn);
	return id;
}

/**
 * Get a single check-in by ID.
 * Returns null if not found or not in browser environment.
 */
export async function getCheckInById(id: number): Promise<CheckIn | null> {
	const db = getDB();
	if (!db) {
		return null;
	}

	const checkIn = await db.checkIns.get(id);
	return checkIn ?? null;
}

/**
 * Get total count of check-ins for an action plan.
 */
export async function getCheckInCount(actionPlanId: string): Promise<number> {
	const db = getDB();
	if (!db) {
		return 0;
	}

	return db.checkIns.where('actionPlanId').equals(actionPlanId).count();
}

/**
 * Get the most recent check-in for an action plan.
 * Returns null if no check-ins exist or not in browser environment.
 */
export async function getLatestCheckIn(actionPlanId: string): Promise<CheckIn | null> {
	const db = getDB();
	if (!db) {
		return null;
	}

	const checkIns = await db.checkIns
		.where('actionPlanId')
		.equals(actionPlanId)
		.reverse()
		.sortBy('createdAt');

	return checkIns[0] ?? null;
}

/**
 * Clear all check-ins for an action plan.
 */
export async function clearCheckIns(actionPlanId: string): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	await db.checkIns.where('actionPlanId').equals(actionPlanId).delete();
}

/**
 * Get all check-ins for an action plan.
 * Returns check-ins sorted by createdAt in ascending order (oldest first).
 * Used for backup/export functionality.
 */
export async function getAllCheckIns(actionPlanId: string): Promise<CheckIn[]> {
	const db = getDB();
	if (!db) {
		return [];
	}

	return db.checkIns.where('actionPlanId').equals(actionPlanId).sortBy('createdAt');
}

/**
 * Zone display information.
 */
export interface ZoneInfo {
	label: string;
	description: string;
	cssClass: string;
}

/**
 * Get display information for a check-in zone.
 */
export function getZoneInfo(zone: CheckInZone): ZoneInfo {
	switch (zone) {
		case 'green':
			return {
				label: 'Feeling good',
				description: 'Using coping skills proactively',
				cssClass: 'zone-green'
			};
		case 'yellow':
			return {
				label: 'Needed support',
				description: 'Feeling stressed, needed extra support',
				cssClass: 'zone-yellow'
			};
		case 'red':
			return {
				label: 'Reached out',
				description: 'In crisis, needed immediate help',
				cssClass: 'zone-red'
			};
	}
}

/**
 * Format a date as a relative string ("Today", "Yesterday", "Dec 15", etc.)
 */
export function formatRelativeDate(date: Date): string {
	const now = new Date();
	const checkInDate = new Date(date);

	// Reset times to start of day for comparison
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const checkInDay = new Date(
		checkInDate.getFullYear(),
		checkInDate.getMonth(),
		checkInDate.getDate()
	);

	const daysDiff = Math.floor((today.getTime() - checkInDay.getTime()) / (1000 * 60 * 60 * 24));

	if (daysDiff === 0) return 'Today';
	if (daysDiff === 1) return 'Yesterday';
	if (daysDiff < 7) return `${daysDiff} days ago`;

	// For older dates, show the date in a friendly format
	const options: Intl.DateTimeFormatOptions = {
		month: 'short',
		day: 'numeric'
	};

	// Add year if it's a different year
	if (checkInDate.getFullYear() !== now.getFullYear()) {
		options.year = 'numeric';
	}

	return checkInDate.toLocaleDateString('en-US', options);
}

/**
 * Format a strategies summary message.
 */
export function formatStrategiesSummary(strategiesUsed: string[]): string | null {
	const count = strategiesUsed.length;
	if (count === 0) return null;
	if (count === 1) return 'Used 1 coping skill';
	return `Used ${count} coping skills`;
}

/**
 * Input type for restoring check-ins from backup.
 */
export interface RestoreCheckInInput {
	actionPlanId: string;
	zone: CheckInZone;
	strategiesUsed: string[];
	supportiveAdultsContacted: string[];
	helpMethodsSelected: string[];
	notes?: string;
	createdAt: Date;
}

/**
 * Restore multiple check-ins from backup data.
 * Clears existing check-ins for the action plan before restoring.
 */
export async function restoreCheckIns(
	actionPlanId: string,
	checkIns: RestoreCheckInInput[]
): Promise<void> {
	const db = getDB();
	if (!db) {
		return;
	}

	// Clear existing check-ins for this action plan
	await db.checkIns.where('actionPlanId').equals(actionPlanId).delete();

	// Bulk add the restored check-ins
	if (checkIns.length > 0) {
		const checkInsToAdd = checkIns.map((checkIn) => ({
			actionPlanId: checkIn.actionPlanId,
			zone: checkIn.zone,
			strategiesUsed: [...checkIn.strategiesUsed],
			supportiveAdultsContacted: [...checkIn.supportiveAdultsContacted],
			helpMethodsSelected: [...checkIn.helpMethodsSelected],
			notes: checkIn.notes,
			createdAt: new Date(checkIn.createdAt)
		}));

		await db.checkIns.bulkAdd(checkInsToAdd as CheckIn[]);
	}
}
