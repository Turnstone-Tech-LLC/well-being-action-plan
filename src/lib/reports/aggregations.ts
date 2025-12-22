/**
 * Shared aggregation utilities for reporting views.
 *
 * These primitives compute statistics from check-in data and are used by:
 * - PatientTimeline (View 1)
 * - ProviderSummary (View 2)
 * - EHR PDF Export (View 3)
 * - Reports page summary
 */
import type { CheckIn, PlanPayload, CheckInZone } from '$lib/db/index';

/**
 * Zone distribution counts and percentages.
 */
export interface ZoneDistribution {
	green: { count: number; percent: number };
	yellow: { count: number; percent: number };
	red: { count: number; percent: number };
	total: number;
}

/**
 * Calculate zone distribution from check-ins.
 */
export function calculateZoneDistribution(checkIns: CheckIn[]): ZoneDistribution {
	const counts = { green: 0, yellow: 0, red: 0 };

	for (const checkIn of checkIns) {
		counts[checkIn.zone]++;
	}

	const total = checkIns.length || 1; // Avoid division by zero

	return {
		green: {
			count: counts.green,
			percent: Math.round((counts.green / total) * 100)
		},
		yellow: {
			count: counts.yellow,
			percent: Math.round((counts.yellow / total) * 100)
		},
		red: {
			count: counts.red,
			percent: Math.round((counts.red / total) * 100)
		},
		total: checkIns.length
	};
}

/**
 * Skill frequency entry.
 */
export interface SkillFrequency {
	id: string;
	title: string;
	count: number;
}

/**
 * Calculate coping skill frequency from check-ins.
 * Returns skills sorted by frequency (most used first).
 */
export function calculateSkillFrequency(
	checkIns: CheckIn[],
	planPayload: PlanPayload | null,
	limit: number = 5
): SkillFrequency[] {
	const counts: Record<string, number> = {};

	for (const checkIn of checkIns) {
		for (const skillId of checkIn.strategiesUsed) {
			counts[skillId] = (counts[skillId] || 0) + 1;
		}
	}

	return Object.entries(counts)
		.map(([id, count]) => {
			const skill = planPayload?.skills.find((s) => s.id === id);
			return {
				id,
				title: skill?.title || 'Unknown skill',
				count
			};
		})
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
}

/**
 * Engagement metrics for provider summary.
 */
export interface EngagementMetrics {
	totalCheckIns: number;
	daysSinceLastCheckIn: number | null;
	averageFrequency: string | null;
	checkInDates: Date[];
}

/**
 * Calculate engagement metrics from check-ins.
 */
export function calculateEngagementMetrics(checkIns: CheckIn[]): EngagementMetrics {
	if (checkIns.length === 0) {
		return {
			totalCheckIns: 0,
			daysSinceLastCheckIn: null,
			averageFrequency: null,
			checkInDates: []
		};
	}

	// Find most recent check-in
	const sortedByDate = [...checkIns].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);

	const mostRecent = new Date(sortedByDate[0].createdAt);
	const now = new Date();
	const daysSinceLastCheckIn = Math.floor(
		(now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
	);

	// Calculate average frequency
	let averageFrequency: string | null = null;
	if (checkIns.length >= 2) {
		const oldest = new Date(sortedByDate[sortedByDate.length - 1].createdAt);
		const daySpan = Math.max(
			1,
			Math.floor((mostRecent.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24))
		);
		const perMonth = Math.round((checkIns.length / daySpan) * 30);

		if (perMonth >= 30) averageFrequency = 'Daily';
		else if (perMonth >= 14) averageFrequency = '~3x/week';
		else if (perMonth >= 8) averageFrequency = '~2x/week';
		else if (perMonth >= 4) averageFrequency = '~1x/week';
		else if (perMonth >= 2) averageFrequency = '~2x/month';
		else averageFrequency = '~1x/month';
	}

	return {
		totalCheckIns: checkIns.length,
		daysSinceLastCheckIn,
		averageFrequency,
		checkInDates: sortedByDate.map((c) => new Date(c.createdAt))
	};
}

/**
 * Adult contact summary.
 */
export interface AdultContactSummary {
	hasContacted: boolean;
	contactCount: number;
	uniqueAdultsContacted: string[];
}

/**
 * Calculate supportive adult contact summary from check-ins.
 */
export function calculateAdultContactSummary(checkIns: CheckIn[]): AdultContactSummary {
	const contactedCheckIns = checkIns.filter((c) => c.supportiveAdultsContacted.length > 0);
	const uniqueAdults = new Set<string>();

	for (const checkIn of contactedCheckIns) {
		for (const adultId of checkIn.supportiveAdultsContacted) {
			uniqueAdults.add(adultId);
		}
	}

	return {
		hasContacted: contactedCheckIns.length > 0,
		contactCount: contactedCheckIns.length,
		uniqueAdultsContacted: Array.from(uniqueAdults)
	};
}

/**
 * Alert information for red zone check-ins.
 */
export interface RedZoneAlerts {
	count: number;
	mostRecentDate: Date;
	checkIns: CheckIn[];
}

/**
 * Calculate red zone alerts, optionally filtered by date.
 */
export function calculateRedZoneAlerts(
	checkIns: CheckIn[],
	sinceDate?: Date | null
): RedZoneAlerts | null {
	let redCheckIns = checkIns.filter((c) => c.zone === 'red');

	if (sinceDate) {
		redCheckIns = redCheckIns.filter((c) => new Date(c.createdAt) > sinceDate);
	}

	if (redCheckIns.length === 0) {
		return null;
	}

	const sorted = [...redCheckIns].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);

	return {
		count: redCheckIns.length,
		mostRecentDate: new Date(sorted[0].createdAt),
		checkIns: sorted
	};
}

/**
 * Check-in streak calculation.
 */
export interface StreakInfo {
	currentStreak: number;
	longestStreak: number;
}

/**
 * Calculate check-in streak (consecutive days with check-ins).
 */
export function calculateStreak(checkIns: CheckIn[]): StreakInfo {
	if (checkIns.length === 0) {
		return { currentStreak: 0, longestStreak: 0 };
	}

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	// Get unique days with check-ins
	const daysWithCheckIns = new Set<string>();
	for (const checkIn of checkIns) {
		const d = new Date(checkIn.createdAt);
		const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
		daysWithCheckIns.add(dayKey);
	}

	// Calculate current streak
	let currentStreak = 0;
	let currentDate = today;

	for (let i = 0; i < 365; i++) {
		const dayKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;

		if (daysWithCheckIns.has(dayKey)) {
			currentStreak++;
		} else if (i > 0) {
			break;
		}

		currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
	}

	// For now, longest streak equals current streak
	// A more complete implementation would scan all dates
	return {
		currentStreak,
		longestStreak: currentStreak
	};
}

/**
 * Complete report summary combining all aggregations.
 */
export interface ReportSummary {
	zoneDistribution: ZoneDistribution;
	topSkills: SkillFrequency[];
	engagement: EngagementMetrics;
	adultContact: AdultContactSummary;
	redZoneAlerts: RedZoneAlerts | null;
	streak: StreakInfo;
}

/**
 * Calculate complete report summary from check-ins.
 * This is the main entry point for report generation.
 */
export function calculateReportSummary(
	checkIns: CheckIn[],
	planPayload: PlanPayload | null,
	options: { lastVisitDate?: Date | null; topSkillsLimit?: number } = {}
): ReportSummary {
	const { lastVisitDate = null, topSkillsLimit = 5 } = options;

	return {
		zoneDistribution: calculateZoneDistribution(checkIns),
		topSkills: calculateSkillFrequency(checkIns, planPayload, topSkillsLimit),
		engagement: calculateEngagementMetrics(checkIns),
		adultContact: calculateAdultContactSummary(checkIns),
		redZoneAlerts: calculateRedZoneAlerts(checkIns, lastVisitDate),
		streak: calculateStreak(checkIns)
	};
}

/**
 * Format days since last check-in for display.
 */
export function formatDaysSince(days: number | null): string {
	if (days === null) return 'No check-ins';
	if (days === 0) return 'Today';
	if (days === 1) return 'Yesterday';
	return `${days} days ago`;
}

/**
 * Get zone information for display.
 */
export function getZoneInfo(zone: CheckInZone): { label: string; shape: string; color: string } {
	switch (zone) {
		case 'green':
			return { label: 'Feeling good', shape: 'circle', color: '#00594C' };
		case 'yellow':
			return { label: 'Needed support', shape: 'triangle', color: '#EAB308' };
		case 'red':
			return { label: 'Reached out', shape: 'square', color: '#DC2626' };
	}
}
