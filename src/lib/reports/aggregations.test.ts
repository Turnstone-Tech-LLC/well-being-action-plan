import { describe, it, expect } from 'vitest';
import {
	calculateZoneDistribution,
	calculateSkillFrequency,
	calculateEngagementMetrics,
	calculateAdultContactSummary,
	calculateRedZoneAlerts,
	calculateStreak,
	formatDaysSince,
	getZoneInfo
} from './aggregations';
import type { CheckIn, PlanPayload } from '$lib/db/index';

// Helper to create mock check-ins
function createCheckIn(zone: 'green' | 'yellow' | 'red', options: Partial<CheckIn> = {}): CheckIn {
	return {
		id: Math.random(),
		actionPlanId: 'test-plan',
		zone,
		strategiesUsed: [],
		supportiveAdultsContacted: [],
		helpMethodsSelected: [],
		createdAt: new Date(),
		...options
	};
}

const mockPlanPayload: PlanPayload = {
	patientNickname: 'Test',
	happyWhen: 'Playing',
	happyBecause: 'Smiling',
	skills: [
		{
			id: 'skill-1',
			title: 'Deep breathing',
			description: '',
			category: 'mindfulness',
			displayOrder: 0
		},
		{ id: 'skill-2', title: 'Music', description: '', category: 'creative', displayOrder: 1 },
		{ id: 'skill-3', title: 'Exercise', description: '', category: 'physical', displayOrder: 2 }
	],
	supportiveAdults: [],
	helpMethods: [],
	crisisResources: []
};

describe('calculateZoneDistribution', () => {
	it('returns zero counts for empty array', () => {
		const result = calculateZoneDistribution([]);

		expect(result.total).toBe(0);
		expect(result.green.count).toBe(0);
		expect(result.yellow.count).toBe(0);
		expect(result.red.count).toBe(0);
	});

	it('calculates correct counts and percentages', () => {
		const checkIns = [
			createCheckIn('green'),
			createCheckIn('green'),
			createCheckIn('green'),
			createCheckIn('yellow'),
			createCheckIn('red')
		];

		const result = calculateZoneDistribution(checkIns);

		expect(result.total).toBe(5);
		expect(result.green.count).toBe(3);
		expect(result.green.percent).toBe(60);
		expect(result.yellow.count).toBe(1);
		expect(result.yellow.percent).toBe(20);
		expect(result.red.count).toBe(1);
		expect(result.red.percent).toBe(20);
	});

	it('handles all same zone', () => {
		const checkIns = [createCheckIn('green'), createCheckIn('green'), createCheckIn('green')];

		const result = calculateZoneDistribution(checkIns);

		expect(result.green.percent).toBe(100);
		expect(result.yellow.percent).toBe(0);
		expect(result.red.percent).toBe(0);
	});
});

describe('calculateSkillFrequency', () => {
	it('returns empty array for no check-ins', () => {
		const result = calculateSkillFrequency([], mockPlanPayload);
		expect(result).toEqual([]);
	});

	it('counts skill usage correctly', () => {
		const checkIns = [
			createCheckIn('green', { strategiesUsed: ['skill-1', 'skill-2'] }),
			createCheckIn('green', { strategiesUsed: ['skill-1'] }),
			createCheckIn('yellow', { strategiesUsed: ['skill-1', 'skill-3'] })
		];

		const result = calculateSkillFrequency(checkIns, mockPlanPayload);

		expect(result[0].id).toBe('skill-1');
		expect(result[0].count).toBe(3);
		expect(result[1].count).toBe(1);
	});

	it('respects limit parameter', () => {
		const checkIns = [
			createCheckIn('green', { strategiesUsed: ['skill-1', 'skill-2', 'skill-3'] })
		];

		const result = calculateSkillFrequency(checkIns, mockPlanPayload, 2);

		expect(result.length).toBe(2);
	});

	it('returns Unknown skill for missing skill IDs', () => {
		const checkIns = [createCheckIn('green', { strategiesUsed: ['unknown-skill'] })];

		const result = calculateSkillFrequency(checkIns, mockPlanPayload);

		expect(result[0].title).toBe('Unknown skill');
	});
});

describe('calculateEngagementMetrics', () => {
	it('returns null values for empty array', () => {
		const result = calculateEngagementMetrics([]);

		expect(result.totalCheckIns).toBe(0);
		expect(result.daysSinceLastCheckIn).toBeNull();
		expect(result.averageFrequency).toBeNull();
	});

	it('calculates days since last check-in', () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		const checkIns = [createCheckIn('green', { createdAt: yesterday })];
		const result = calculateEngagementMetrics(checkIns);

		expect(result.daysSinceLastCheckIn).toBe(1);
	});

	it('returns 0 days for check-in today', () => {
		const checkIns = [createCheckIn('green', { createdAt: new Date() })];
		const result = calculateEngagementMetrics(checkIns);

		expect(result.daysSinceLastCheckIn).toBe(0);
	});
});

describe('calculateAdultContactSummary', () => {
	it('returns no contact for empty array', () => {
		const result = calculateAdultContactSummary([]);

		expect(result.hasContacted).toBe(false);
		expect(result.contactCount).toBe(0);
	});

	it('counts contacts correctly', () => {
		const checkIns = [
			createCheckIn('yellow', { supportiveAdultsContacted: ['adult-1'] }),
			createCheckIn('yellow', { supportiveAdultsContacted: ['adult-1', 'adult-2'] }),
			createCheckIn('green', { supportiveAdultsContacted: [] })
		];

		const result = calculateAdultContactSummary(checkIns);

		expect(result.hasContacted).toBe(true);
		expect(result.contactCount).toBe(2);
		expect(result.uniqueAdultsContacted).toContain('adult-1');
		expect(result.uniqueAdultsContacted).toContain('adult-2');
	});
});

describe('calculateRedZoneAlerts', () => {
	it('returns null for no red zone check-ins', () => {
		const checkIns = [createCheckIn('green'), createCheckIn('yellow')];
		const result = calculateRedZoneAlerts(checkIns);

		expect(result).toBeNull();
	});

	it('counts red zone check-ins', () => {
		const checkIns = [
			createCheckIn('red', { createdAt: new Date('2024-01-15') }),
			createCheckIn('red', { createdAt: new Date('2024-01-20') }),
			createCheckIn('green')
		];

		const result = calculateRedZoneAlerts(checkIns);

		expect(result?.count).toBe(2);
		expect(result?.mostRecentDate.getTime()).toBe(new Date('2024-01-20').getTime());
	});

	it('filters by sinceDate', () => {
		const checkIns = [
			createCheckIn('red', { createdAt: new Date('2024-01-10') }),
			createCheckIn('red', { createdAt: new Date('2024-01-20') })
		];

		const result = calculateRedZoneAlerts(checkIns, new Date('2024-01-15'));

		expect(result?.count).toBe(1);
	});
});

describe('calculateStreak', () => {
	it('returns 0 for empty array', () => {
		const result = calculateStreak([]);
		expect(result.currentStreak).toBe(0);
	});

	it('counts consecutive days with check-ins', () => {
		const today = new Date();
		const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
		const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

		const checkIns = [
			createCheckIn('green', { createdAt: today }),
			createCheckIn('green', { createdAt: yesterday }),
			createCheckIn('green', { createdAt: twoDaysAgo })
		];

		const result = calculateStreak(checkIns);

		expect(result.currentStreak).toBe(3);
	});
});

describe('formatDaysSince', () => {
	it('returns "No check-ins" for null', () => {
		expect(formatDaysSince(null)).toBe('No check-ins');
	});

	it('returns "Today" for 0', () => {
		expect(formatDaysSince(0)).toBe('Today');
	});

	it('returns "Yesterday" for 1', () => {
		expect(formatDaysSince(1)).toBe('Yesterday');
	});

	it('returns "X days ago" for other values', () => {
		expect(formatDaysSince(5)).toBe('5 days ago');
	});
});

describe('getZoneInfo', () => {
	it('returns correct info for green zone', () => {
		const info = getZoneInfo('green');
		expect(info.label).toBe('Feeling good');
		expect(info.shape).toBe('circle');
		expect(info.color).toBe('#00594C');
	});

	it('returns correct info for yellow zone', () => {
		const info = getZoneInfo('yellow');
		expect(info.label).toBe('Needed support');
		expect(info.shape).toBe('triangle');
	});

	it('returns correct info for red zone', () => {
		const info = getZoneInfo('red');
		expect(info.label).toBe('Reached out');
		expect(info.shape).toBe('square');
	});
});
