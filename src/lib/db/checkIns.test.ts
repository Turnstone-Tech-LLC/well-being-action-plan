import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the getDB function
const mockCheckIns = {
	where: vi.fn().mockReturnThis(),
	equals: vi.fn().mockReturnThis(),
	reverse: vi.fn().mockReturnThis(),
	sortBy: vi.fn(),
	add: vi.fn(),
	get: vi.fn(),
	count: vi.fn(),
	delete: vi.fn()
};

const mockDB = {
	checkIns: mockCheckIns
};

vi.mock('./index', () => ({
	getDB: () => mockDB
}));

// Import after mocking
import {
	getRecentCheckIns,
	getCheckInsByDateRange,
	saveCheckIn,
	getCheckInById,
	getCheckInCount,
	getLatestCheckIn,
	clearCheckIns,
	getZoneInfo,
	formatRelativeDate,
	formatStrategiesSummary
} from './checkIns';

describe('checkIns database utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getRecentCheckIns', () => {
		it('returns recent check-ins sorted by createdAt descending', async () => {
			const mockData = [
				{ id: 2, actionPlanId: 'test-id', zone: 'green', createdAt: new Date('2024-01-02') },
				{ id: 1, actionPlanId: 'test-id', zone: 'yellow', createdAt: new Date('2024-01-01') }
			];
			mockCheckIns.sortBy.mockResolvedValue(mockData);

			const result = await getRecentCheckIns('test-id', 7);

			expect(result).toHaveLength(2);
			expect(mockCheckIns.where).toHaveBeenCalledWith('actionPlanId');
			expect(mockCheckIns.equals).toHaveBeenCalledWith('test-id');
			expect(mockCheckIns.reverse).toHaveBeenCalled();
		});

		it('limits the number of results', async () => {
			const mockData = [
				{ id: 3, zone: 'green', createdAt: new Date('2024-01-03') },
				{ id: 2, zone: 'yellow', createdAt: new Date('2024-01-02') },
				{ id: 1, zone: 'red', createdAt: new Date('2024-01-01') }
			];
			mockCheckIns.sortBy.mockResolvedValue(mockData);

			const result = await getRecentCheckIns('test-id', 2);

			expect(result).toHaveLength(2);
		});

		it('returns empty array when no check-ins exist', async () => {
			mockCheckIns.sortBy.mockResolvedValue([]);

			const result = await getRecentCheckIns('test-id');

			expect(result).toEqual([]);
		});
	});

	describe('getCheckInsByDateRange', () => {
		it('filters check-ins by date range', async () => {
			const start = new Date('2024-01-01');
			const end = new Date('2024-01-03');
			const mockData = [
				{ id: 1, zone: 'green', createdAt: new Date('2024-01-01') },
				{ id: 2, zone: 'yellow', createdAt: new Date('2024-01-02') },
				{ id: 3, zone: 'red', createdAt: new Date('2024-01-05') }
			];
			mockCheckIns.sortBy.mockResolvedValue(mockData);

			const result = await getCheckInsByDateRange('test-id', start, end);

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe(2); // Most recent first
			expect(result[1].id).toBe(1);
		});
	});

	describe('saveCheckIn', () => {
		it('saves a new check-in with defaults', async () => {
			mockCheckIns.add.mockResolvedValue(1);

			const result = await saveCheckIn({
				actionPlanId: 'test-id',
				zone: 'green'
			});

			expect(result).toBe(1);
			expect(mockCheckIns.add).toHaveBeenCalledWith(
				expect.objectContaining({
					actionPlanId: 'test-id',
					zone: 'green',
					strategiesUsed: [],
					supportiveAdultsContacted: [],
					helpMethodsSelected: [],
					createdAt: expect.any(Date)
				})
			);
		});

		it('saves a check-in with all fields', async () => {
			mockCheckIns.add.mockResolvedValue(1);

			await saveCheckIn({
				actionPlanId: 'test-id',
				zone: 'yellow',
				strategiesUsed: ['strategy-1', 'strategy-2'],
				supportiveAdultsContacted: ['adult-1'],
				helpMethodsSelected: ['method-1'],
				notes: 'Test notes'
			});

			expect(mockCheckIns.add).toHaveBeenCalledWith(
				expect.objectContaining({
					strategiesUsed: ['strategy-1', 'strategy-2'],
					supportiveAdultsContacted: ['adult-1'],
					helpMethodsSelected: ['method-1'],
					notes: 'Test notes'
				})
			);
		});
	});

	describe('getCheckInById', () => {
		it('returns the check-in when found', async () => {
			const mockCheckIn = { id: 1, zone: 'green', createdAt: new Date() };
			mockCheckIns.get.mockResolvedValue(mockCheckIn);

			const result = await getCheckInById(1);

			expect(result).toEqual(mockCheckIn);
			expect(mockCheckIns.get).toHaveBeenCalledWith(1);
		});

		it('returns null when not found', async () => {
			mockCheckIns.get.mockResolvedValue(undefined);

			const result = await getCheckInById(999);

			expect(result).toBeNull();
		});
	});

	describe('getCheckInCount', () => {
		it('returns the count of check-ins', async () => {
			mockCheckIns.count.mockResolvedValue(5);

			const result = await getCheckInCount('test-id');

			expect(result).toBe(5);
			expect(mockCheckIns.where).toHaveBeenCalledWith('actionPlanId');
			expect(mockCheckIns.equals).toHaveBeenCalledWith('test-id');
		});
	});

	describe('getLatestCheckIn', () => {
		it('returns the most recent check-in', async () => {
			const mockData = [
				{ id: 2, zone: 'yellow', createdAt: new Date('2024-01-02') },
				{ id: 1, zone: 'green', createdAt: new Date('2024-01-01') }
			];
			mockCheckIns.sortBy.mockResolvedValue(mockData);

			const result = await getLatestCheckIn('test-id');

			expect(result?.id).toBe(2);
		});

		it('returns null when no check-ins exist', async () => {
			mockCheckIns.sortBy.mockResolvedValue([]);

			const result = await getLatestCheckIn('test-id');

			expect(result).toBeNull();
		});
	});

	describe('clearCheckIns', () => {
		it('deletes all check-ins for an action plan', async () => {
			mockCheckIns.delete.mockResolvedValue(undefined);

			await clearCheckIns('test-id');

			expect(mockCheckIns.where).toHaveBeenCalledWith('actionPlanId');
			expect(mockCheckIns.equals).toHaveBeenCalledWith('test-id');
			expect(mockCheckIns.delete).toHaveBeenCalled();
		});
	});
});

describe('checkIns utility functions', () => {
	describe('getZoneInfo', () => {
		it('returns correct info for green zone', () => {
			const info = getZoneInfo('green');

			expect(info.label).toBe('Feeling good');
			expect(info.cssClass).toBe('zone-green');
		});

		it('returns correct info for yellow zone', () => {
			const info = getZoneInfo('yellow');

			expect(info.label).toBe('Needed support');
			expect(info.cssClass).toBe('zone-yellow');
		});

		it('returns correct info for red zone', () => {
			const info = getZoneInfo('red');

			expect(info.label).toBe('Reached out');
			expect(info.cssClass).toBe('zone-red');
		});
	});

	describe('formatRelativeDate', () => {
		beforeEach(() => {
			// Mock current date to 2024-01-15
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2024-01-15T12:00:00'));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('returns "Today" for today\'s date', () => {
			const today = new Date('2024-01-15T10:00:00');
			expect(formatRelativeDate(today)).toBe('Today');
		});

		it('returns "Yesterday" for yesterday\'s date', () => {
			const yesterday = new Date('2024-01-14T10:00:00');
			expect(formatRelativeDate(yesterday)).toBe('Yesterday');
		});

		it('returns "X days ago" for dates within a week', () => {
			const threeDaysAgo = new Date('2024-01-12T10:00:00');
			expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
		});

		it('returns formatted date for dates older than a week', () => {
			const twoWeeksAgo = new Date('2024-01-01T10:00:00');
			const result = formatRelativeDate(twoWeeksAgo);
			expect(result).toBe('Jan 1');
		});

		it('includes year for dates from a different year', () => {
			const lastYear = new Date('2023-12-25T10:00:00');
			const result = formatRelativeDate(lastYear);
			expect(result).toBe('Dec 25, 2023');
		});
	});

	describe('formatStrategiesSummary', () => {
		it('returns null for empty strategies', () => {
			expect(formatStrategiesSummary([])).toBeNull();
		});

		it('returns singular form for one strategy', () => {
			expect(formatStrategiesSummary(['strategy-1'])).toBe('Used 1 coping skill');
		});

		it('returns plural form for multiple strategies', () => {
			expect(formatStrategiesSummary(['s1', 's2', 's3'])).toBe('Used 3 coping skills');
		});
	});
});
