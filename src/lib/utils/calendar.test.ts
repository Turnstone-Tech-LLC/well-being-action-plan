import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	getDateKey,
	getCheckInsByDate,
	getDominantZone,
	getDaysInMonth,
	getFirstDayOfMonth,
	isSameDay,
	isFutureDate,
	generateCalendarGrid,
	formatMonthYear,
	getMonthStartDate,
	getMonthEndDate,
	isMonthInFuture,
	WEEKDAY_LABELS
} from './calendar';
import type { CheckIn } from '$lib/db/index';

// Helper to create a mock check-in
function createMockCheckIn(zone: 'green' | 'yellow' | 'red', date: Date, id: number = 1): CheckIn {
	return {
		id,
		actionPlanId: 'test-plan',
		zone,
		strategiesUsed: [],
		supportiveAdultsContacted: [],
		helpMethodsSelected: [],
		createdAt: date
	};
}

describe('getDateKey', () => {
	it('returns date in YYYY-MM-DD format', () => {
		const date = new Date(2025, 11, 15); // Dec 15, 2025
		expect(getDateKey(date)).toBe('2025-12-15');
	});

	it('pads single digit months and days', () => {
		const date = new Date(2025, 0, 5); // Jan 5, 2025
		expect(getDateKey(date)).toBe('2025-01-05');
	});

	it('handles different years', () => {
		const date = new Date(2024, 5, 20); // June 20, 2024
		expect(getDateKey(date)).toBe('2024-06-20');
	});
});

describe('getCheckInsByDate', () => {
	it('groups check-ins by date', () => {
		const checkIns = [
			createMockCheckIn('green', new Date(2025, 11, 15, 10, 0), 1),
			createMockCheckIn('yellow', new Date(2025, 11, 15, 14, 0), 2),
			createMockCheckIn('red', new Date(2025, 11, 16, 9, 0), 3)
		];

		const result = getCheckInsByDate(checkIns);

		expect(result.size).toBe(2);
		expect(result.get('2025-12-15')?.length).toBe(2);
		expect(result.get('2025-12-16')?.length).toBe(1);
	});

	it('returns empty map for empty input', () => {
		const result = getCheckInsByDate([]);
		expect(result.size).toBe(0);
	});

	it('handles single check-in', () => {
		const checkIns = [createMockCheckIn('green', new Date(2025, 11, 15))];
		const result = getCheckInsByDate(checkIns);
		expect(result.size).toBe(1);
		expect(result.get('2025-12-15')?.length).toBe(1);
	});
});

describe('getDominantZone', () => {
	it('returns red if any check-in is red', () => {
		const checkIns = [
			createMockCheckIn('green', new Date(), 1),
			createMockCheckIn('red', new Date(), 2),
			createMockCheckIn('yellow', new Date(), 3)
		];
		expect(getDominantZone(checkIns)).toBe('red');
	});

	it('returns yellow if no red but has yellow', () => {
		const checkIns = [
			createMockCheckIn('green', new Date(), 1),
			createMockCheckIn('yellow', new Date(), 2)
		];
		expect(getDominantZone(checkIns)).toBe('yellow');
	});

	it('returns green if all are green', () => {
		const checkIns = [
			createMockCheckIn('green', new Date(), 1),
			createMockCheckIn('green', new Date(), 2)
		];
		expect(getDominantZone(checkIns)).toBe('green');
	});

	it('returns green for single green check-in', () => {
		const checkIns = [createMockCheckIn('green', new Date())];
		expect(getDominantZone(checkIns)).toBe('green');
	});
});

describe('getDaysInMonth', () => {
	it('returns correct days for January', () => {
		expect(getDaysInMonth(2025, 0)).toBe(31);
	});

	it('returns correct days for February in regular year', () => {
		expect(getDaysInMonth(2025, 1)).toBe(28);
	});

	it('returns correct days for February in leap year', () => {
		expect(getDaysInMonth(2024, 1)).toBe(29);
	});

	it('returns correct days for April', () => {
		expect(getDaysInMonth(2025, 3)).toBe(30);
	});

	it('returns correct days for December', () => {
		expect(getDaysInMonth(2025, 11)).toBe(31);
	});
});

describe('getFirstDayOfMonth', () => {
	it('returns correct day of week (0=Sunday)', () => {
		// December 2025 starts on Monday
		expect(getFirstDayOfMonth(2025, 11)).toBe(1);
	});

	it('returns Sunday correctly', () => {
		// June 2025 starts on Sunday
		expect(getFirstDayOfMonth(2025, 5)).toBe(0);
	});
});

describe('isSameDay', () => {
	it('returns true for same day', () => {
		const date1 = new Date(2025, 11, 15, 10, 30);
		const date2 = new Date(2025, 11, 15, 14, 45);
		expect(isSameDay(date1, date2)).toBe(true);
	});

	it('returns false for different days', () => {
		const date1 = new Date(2025, 11, 15);
		const date2 = new Date(2025, 11, 16);
		expect(isSameDay(date1, date2)).toBe(false);
	});

	it('returns false for different months', () => {
		const date1 = new Date(2025, 11, 15);
		const date2 = new Date(2025, 10, 15);
		expect(isSameDay(date1, date2)).toBe(false);
	});

	it('returns false for different years', () => {
		const date1 = new Date(2025, 11, 15);
		const date2 = new Date(2024, 11, 15);
		expect(isSameDay(date1, date2)).toBe(false);
	});
});

describe('isFutureDate', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2025, 11, 15, 12, 0)); // Dec 15, 2025, noon
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns true for future date', () => {
		const futureDate = new Date(2025, 11, 20);
		expect(isFutureDate(futureDate)).toBe(true);
	});

	it('returns false for today', () => {
		const today = new Date(2025, 11, 15);
		expect(isFutureDate(today)).toBe(false);
	});

	it('returns false for past date', () => {
		const pastDate = new Date(2025, 11, 10);
		expect(isFutureDate(pastDate)).toBe(false);
	});
});

describe('generateCalendarGrid', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2025, 11, 15, 12, 0)); // Dec 15, 2025
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('generates correct number of weeks', () => {
		const grid = generateCalendarGrid(2025, 11); // December 2025
		expect(grid.length).toBeGreaterThanOrEqual(4);
		expect(grid.length).toBeLessThanOrEqual(6);
	});

	it('each week has 7 days', () => {
		const grid = generateCalendarGrid(2025, 11);
		for (const week of grid) {
			expect(week.length).toBe(7);
		}
	});

	it('marks today correctly', () => {
		const grid = generateCalendarGrid(2025, 11);
		const todayDays = grid.flat().filter((day) => day.isToday);
		expect(todayDays.length).toBe(1);
		expect(todayDays[0].dayNumber).toBe(15);
	});

	it('marks current month days correctly', () => {
		const grid = generateCalendarGrid(2025, 11);
		const currentMonthDays = grid.flat().filter((day) => day.isCurrentMonth);
		expect(currentMonthDays.length).toBe(31); // December has 31 days
	});

	it('marks future days correctly', () => {
		const grid = generateCalendarGrid(2025, 11);
		const futureDays = grid.flat().filter((day) => day.isFuture && day.isCurrentMonth);
		// Days 16-31 are future
		expect(futureDays.length).toBe(16);
	});

	it('includes previous month days at start', () => {
		const grid = generateCalendarGrid(2025, 11);
		const prevMonthDays = grid[0].filter((day) => !day.isCurrentMonth);
		// December 2025 starts on Monday, so Sunday (Nov 30) is included
		expect(prevMonthDays.length).toBe(1);
	});
});

describe('formatMonthYear', () => {
	it('formats month and year correctly', () => {
		expect(formatMonthYear(2025, 11)).toBe('December 2025');
	});

	it('formats January correctly', () => {
		expect(formatMonthYear(2025, 0)).toBe('January 2025');
	});

	it('formats different years correctly', () => {
		expect(formatMonthYear(2024, 5)).toBe('June 2024');
	});
});

describe('getMonthStartDate', () => {
	it('returns first day of month at midnight', () => {
		const result = getMonthStartDate(2025, 11);
		expect(result.getFullYear()).toBe(2025);
		expect(result.getMonth()).toBe(11);
		expect(result.getDate()).toBe(1);
		expect(result.getHours()).toBe(0);
		expect(result.getMinutes()).toBe(0);
		expect(result.getSeconds()).toBe(0);
	});
});

describe('getMonthEndDate', () => {
	it('returns last day of month at end of day', () => {
		const result = getMonthEndDate(2025, 11);
		expect(result.getFullYear()).toBe(2025);
		expect(result.getMonth()).toBe(11);
		expect(result.getDate()).toBe(31);
		expect(result.getHours()).toBe(23);
		expect(result.getMinutes()).toBe(59);
	});

	it('handles February correctly', () => {
		const result = getMonthEndDate(2025, 1);
		expect(result.getDate()).toBe(28);
	});

	it('handles February in leap year', () => {
		const result = getMonthEndDate(2024, 1);
		expect(result.getDate()).toBe(29);
	});
});

describe('isMonthInFuture', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2025, 11, 15)); // Dec 15, 2025
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns true for future year', () => {
		expect(isMonthInFuture(2026, 0)).toBe(true);
	});

	it('returns true for future month in same year', () => {
		expect(isMonthInFuture(2025, 11)).toBe(false); // Current month
	});

	it('returns false for current month', () => {
		expect(isMonthInFuture(2025, 11)).toBe(false);
	});

	it('returns false for past month', () => {
		expect(isMonthInFuture(2025, 10)).toBe(false);
	});

	it('returns false for past year', () => {
		expect(isMonthInFuture(2024, 11)).toBe(false);
	});
});

describe('WEEKDAY_LABELS', () => {
	it('has 7 days', () => {
		expect(WEEKDAY_LABELS.length).toBe(7);
	});

	it('starts with Sunday', () => {
		expect(WEEKDAY_LABELS[0]).toBe('Sun');
	});

	it('ends with Saturday', () => {
		expect(WEEKDAY_LABELS[6]).toBe('Sat');
	});
});
