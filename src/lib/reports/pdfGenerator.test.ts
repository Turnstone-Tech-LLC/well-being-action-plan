import { describe, it, expect } from 'vitest';
import {
	formatDate,
	formatDateRange,
	calculateReportSummary,
	generateFilename
} from './pdfGenerator';
import type { CheckIn, PlanPayload } from '$lib/db/index';

describe('pdfGenerator', () => {
	describe('formatDate', () => {
		it('formats a date in long format', () => {
			const date = new Date('2025-12-15T10:00:00');
			const result = formatDate(date);
			expect(result).toBe('December 15, 2025');
		});

		it('handles different months correctly', () => {
			const january = new Date('2025-01-05T10:00:00');
			expect(formatDate(january)).toBe('January 5, 2025');

			const june = new Date('2025-06-20T10:00:00');
			expect(formatDate(june)).toBe('June 20, 2025');
		});
	});

	describe('formatDateRange', () => {
		it('formats a date range within the same year', () => {
			const start = new Date('2025-12-01T00:00:00');
			const end = new Date('2025-12-18T23:59:59');
			const result = formatDateRange(start, end);
			expect(result).toBe('December 1 - December 18, 2025');
		});

		it('formats a date range spanning different years', () => {
			const start = new Date('2024-12-15T00:00:00');
			const end = new Date('2025-01-15T23:59:59');
			const result = formatDateRange(start, end);
			expect(result).toBe('December 15, 2024 - January 15, 2025');
		});

		it('formats same day range', () => {
			const date = new Date('2025-12-15T00:00:00');
			const result = formatDateRange(date, date);
			expect(result).toBe('December 15 - December 15, 2025');
		});
	});

	describe('calculateReportSummary', () => {
		const mockPlanPayload: PlanPayload = {
			patientNickname: 'Test User',
			happyWhen: 'Playing games',
			happyBecause: 'It is fun',
			skills: [
				{
					id: 'skill-1',
					title: 'Deep Breathing',
					description: 'Take deep breaths',
					category: 'mindfulness',
					displayOrder: 1
				},
				{
					id: 'skill-2',
					title: 'Drawing',
					description: 'Express through art',
					category: 'creative',
					displayOrder: 2
				},
				{
					id: 'skill-3',
					title: 'Exercise',
					description: 'Physical activity',
					category: 'physical',
					displayOrder: 3
				}
			],
			supportiveAdults: [],
			helpMethods: [],
			crisisResources: []
		};

		it('calculates summary with no check-ins', () => {
			const checkIns: CheckIn[] = [];
			const result = calculateReportSummary(checkIns, mockPlanPayload);

			expect(result.total).toBe(0);
			expect(result.byZone).toEqual({ green: 0, yellow: 0, red: 0 });
			expect(result.topStrategies).toEqual([]);
		});

		it('calculates zone breakdown correctly', () => {
			const checkIns: CheckIn[] = [
				createMockCheckIn('green', []),
				createMockCheckIn('green', []),
				createMockCheckIn('yellow', []),
				createMockCheckIn('red', [])
			];

			const result = calculateReportSummary(checkIns, mockPlanPayload);

			expect(result.total).toBe(4);
			expect(result.byZone).toEqual({ green: 2, yellow: 1, red: 1 });
		});

		it('calculates top strategies correctly', () => {
			const checkIns: CheckIn[] = [
				createMockCheckIn('green', ['skill-1', 'skill-2']),
				createMockCheckIn('green', ['skill-1', 'skill-3']),
				createMockCheckIn('green', ['skill-1']),
				createMockCheckIn('green', ['skill-2'])
			];

			const result = calculateReportSummary(checkIns, mockPlanPayload);

			expect(result.topStrategies.length).toBe(3);
			expect(result.topStrategies[0]).toEqual({
				id: 'skill-1',
				title: 'Deep Breathing',
				count: 3
			});
			expect(result.topStrategies[1]).toEqual({
				id: 'skill-2',
				title: 'Drawing',
				count: 2
			});
			expect(result.topStrategies[2]).toEqual({
				id: 'skill-3',
				title: 'Exercise',
				count: 1
			});
		});

		it('limits top strategies to 5', () => {
			const manySkillsPayload: PlanPayload = {
				...mockPlanPayload,
				skills: Array.from({ length: 10 }, (_, i) => ({
					id: `skill-${i}`,
					title: `Skill ${i}`,
					description: `Description ${i}`,
					category: 'mindfulness',
					displayOrder: i
				}))
			};

			const checkIns: CheckIn[] = Array.from({ length: 10 }, (_, i) =>
				createMockCheckIn('green', [`skill-${i}`])
			);

			const result = calculateReportSummary(checkIns, manySkillsPayload);

			expect(result.topStrategies.length).toBe(5);
		});

		it('handles unknown skills gracefully', () => {
			const checkIns: CheckIn[] = [createMockCheckIn('green', ['unknown-skill'])];

			const result = calculateReportSummary(checkIns, mockPlanPayload);

			expect(result.topStrategies[0]).toEqual({
				id: 'unknown-skill',
				title: 'Unknown skill',
				count: 1
			});
		});
	});

	describe('generateFilename', () => {
		it('generates filename with date range', () => {
			const dateRange = {
				start: new Date('2025-12-01T12:00:00Z'),
				end: new Date('2025-12-18T12:00:00Z')
			};

			const result = generateFilename(dateRange);

			expect(result).toBe('wellbeing-report-2025-12-01-to-2025-12-18.pdf');
		});

		it('handles same day range', () => {
			const dateRange = {
				start: new Date('2025-12-15T12:00:00Z'),
				end: new Date('2025-12-15T12:00:00Z')
			};

			const result = generateFilename(dateRange);

			expect(result).toBe('wellbeing-report-2025-12-15-to-2025-12-15.pdf');
		});
	});
});

/**
 * Helper function to create mock check-ins for testing.
 */
function createMockCheckIn(zone: 'green' | 'yellow' | 'red', strategiesUsed: string[]): CheckIn {
	return {
		id: Math.random(),
		actionPlanId: 'test-action-plan',
		zone,
		strategiesUsed,
		supportiveAdultsContacted: [],
		helpMethodsSelected: [],
		createdAt: new Date()
	};
}
