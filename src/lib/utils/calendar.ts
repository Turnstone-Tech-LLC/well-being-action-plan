import type { CheckIn, CheckInZone } from '$lib/db/index';

/**
 * Represents a single day in the calendar.
 */
export interface CalendarDay {
	/** Date for this day */
	date: Date;
	/** Day of the month (1-31) */
	dayNumber: number;
	/** Whether this day is in the current month being displayed */
	isCurrentMonth: boolean;
	/** Whether this day is today */
	isToday: boolean;
	/** Whether this day is in the future */
	isFuture: boolean;
}

/**
 * Represents a week in the calendar (array of 7 days).
 */
export type CalendarWeek = CalendarDay[];

/**
 * Map of date keys to check-ins for that date.
 */
export type CheckInsByDate = Map<string, CheckIn[]>;

/**
 * Get the date key for a given date (YYYY-MM-DD format).
 */
export function getDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Group check-ins by date for calendar display.
 * Returns a Map where keys are date strings (YYYY-MM-DD) and values are arrays of check-ins.
 */
export function getCheckInsByDate(checkIns: CheckIn[]): CheckInsByDate {
	const byDate = new Map<string, CheckIn[]>();

	for (const checkIn of checkIns) {
		const dateKey = getDateKey(new Date(checkIn.createdAt));
		const existing = byDate.get(dateKey) || [];
		byDate.set(dateKey, [...existing, checkIn]);
	}

	return byDate;
}

/**
 * Get the dominant zone for a day (highest priority: Red > Yellow > Green).
 * This determines the dot color for days with multiple check-ins.
 */
export function getDominantZone(checkIns: CheckIn[]): CheckInZone {
	if (checkIns.some((c) => c.zone === 'red')) return 'red';
	if (checkIns.some((c) => c.zone === 'yellow')) return 'yellow';
	return 'green';
}

/**
 * Get the number of days in a month.
 */
export function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of the week for the first day of a month.
 * Returns 0-6 (Sunday = 0).
 */
export function getFirstDayOfMonth(year: number, month: number): number {
	return new Date(year, month, 1).getDay();
}

/**
 * Check if two dates are the same day.
 */
export function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

/**
 * Check if a date is in the future (after today).
 */
export function isFutureDate(date: Date): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const compareDate = new Date(date);
	compareDate.setHours(0, 0, 0, 0);
	return compareDate > today;
}

/**
 * Generate the calendar grid for a given month.
 * Returns an array of weeks, where each week is an array of 7 CalendarDay objects.
 * The grid includes days from the previous and next months to fill the weeks.
 */
export function generateCalendarGrid(year: number, month: number): CalendarWeek[] {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const daysInMonth = getDaysInMonth(year, month);
	const firstDayOfMonth = getFirstDayOfMonth(year, month);

	// Get days from previous month to fill first week
	const daysInPrevMonth = getDaysInMonth(year, month - 1);
	const prevMonth = month === 0 ? 11 : month - 1;
	const prevYear = month === 0 ? year - 1 : year;

	// Get next month info
	const nextMonth = month === 11 ? 0 : month + 1;
	const nextYear = month === 11 ? year + 1 : year;

	const days: CalendarDay[] = [];

	// Add days from previous month
	for (let i = firstDayOfMonth - 1; i >= 0; i--) {
		const dayNumber = daysInPrevMonth - i;
		const date = new Date(prevYear, prevMonth, dayNumber);
		date.setHours(0, 0, 0, 0);

		days.push({
			date,
			dayNumber,
			isCurrentMonth: false,
			isToday: isSameDay(date, today),
			isFuture: isFutureDate(date)
		});
	}

	// Add days from current month
	for (let i = 1; i <= daysInMonth; i++) {
		const date = new Date(year, month, i);
		date.setHours(0, 0, 0, 0);

		days.push({
			date,
			dayNumber: i,
			isCurrentMonth: true,
			isToday: isSameDay(date, today),
			isFuture: isFutureDate(date)
		});
	}

	// Add days from next month to complete last week
	const remainingDays = 7 - (days.length % 7);
	if (remainingDays < 7) {
		for (let i = 1; i <= remainingDays; i++) {
			const date = new Date(nextYear, nextMonth, i);
			date.setHours(0, 0, 0, 0);

			days.push({
				date,
				dayNumber: i,
				isCurrentMonth: false,
				isToday: isSameDay(date, today),
				isFuture: isFutureDate(date)
			});
		}
	}

	// Split days into weeks
	const weeks: CalendarWeek[] = [];
	for (let i = 0; i < days.length; i += 7) {
		weeks.push(days.slice(i, i + 7));
	}

	return weeks;
}

/**
 * Format a month and year for display (e.g., "December 2025").
 */
export function formatMonthYear(year: number, month: number): string {
	const date = new Date(year, month, 1);
	return date.toLocaleDateString('en-US', {
		month: 'long',
		year: 'numeric'
	});
}

/**
 * Get the start date of a month (first day at midnight).
 */
export function getMonthStartDate(year: number, month: number): Date {
	const date = new Date(year, month, 1);
	date.setHours(0, 0, 0, 0);
	return date;
}

/**
 * Get the end date of a month (last day at 23:59:59.999).
 */
export function getMonthEndDate(year: number, month: number): Date {
	const date = new Date(year, month + 1, 0);
	date.setHours(23, 59, 59, 999);
	return date;
}

/**
 * Check if a month/year is in the future.
 * Returns true if the month starts after the current month.
 */
export function isMonthInFuture(year: number, month: number): boolean {
	const today = new Date();
	const currentYear = today.getFullYear();
	const currentMonth = today.getMonth();

	if (year > currentYear) return true;
	if (year === currentYear && month > currentMonth) return true;
	return false;
}

/**
 * Day of week abbreviations.
 */
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
