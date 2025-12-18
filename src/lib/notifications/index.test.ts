import { describe, it, expect } from 'vitest';

// Import pure functions that don't require browser APIs
import {
	calculateNextReminderTime,
	getFrequencyDescription,
	getTimePreferenceDescription
} from './index';

describe('notification utilities', () => {
	describe('calculateNextReminderTime', () => {
		it('returns null for frequency "none"', () => {
			const result = calculateNextReminderTime('none', 'morning');
			expect(result).toBeNull();
		});

		it('calculates next reminder for daily frequency', () => {
			const lastShown = new Date('2025-01-01T10:00:00');
			const result = calculateNextReminderTime('daily', 'morning', lastShown);

			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(9); // morning = 9 AM
		});

		it('calculates next reminder for every_few_days frequency', () => {
			const lastShown = new Date('2025-01-01T10:00:00');
			const result = calculateNextReminderTime('every_few_days', 'afternoon', lastShown);

			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(14); // afternoon = 2 PM
		});

		it('calculates next reminder for weekly frequency', () => {
			const lastShown = new Date('2025-01-01T10:00:00');
			const result = calculateNextReminderTime('weekly', 'evening', lastShown);

			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(18); // evening = 6 PM
		});

		it('uses current time when no lastShown provided', () => {
			const result = calculateNextReminderTime('daily', 'morning');

			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(9);
		});

		it('returns a future date', () => {
			const now = new Date();
			const result = calculateNextReminderTime('daily', 'morning');

			expect(result).not.toBeNull();
			// Result should be greater than now (in the future)
			expect(result!.getTime()).toBeGreaterThan(now.getTime() - 1000);
		});

		it('sets correct hour for morning', () => {
			const result = calculateNextReminderTime('daily', 'morning');
			expect(result!.getHours()).toBe(9);
		});

		it('sets correct hour for afternoon', () => {
			const result = calculateNextReminderTime('daily', 'afternoon');
			expect(result!.getHours()).toBe(14);
		});

		it('sets correct hour for evening', () => {
			const result = calculateNextReminderTime('daily', 'evening');
			expect(result!.getHours()).toBe(18);
		});
	});

	describe('getFrequencyDescription', () => {
		it('returns correct description for daily', () => {
			expect(getFrequencyDescription('daily')).toBe('Every day');
		});

		it('returns correct description for every_few_days', () => {
			expect(getFrequencyDescription('every_few_days')).toBe('Every few days');
		});

		it('returns correct description for weekly', () => {
			expect(getFrequencyDescription('weekly')).toBe('Once a week');
		});

		it('returns correct description for none', () => {
			expect(getFrequencyDescription('none')).toBe('No reminders');
		});
	});

	describe('getTimePreferenceDescription', () => {
		it('returns correct description for morning', () => {
			expect(getTimePreferenceDescription('morning')).toBe('Morning (9:00 AM)');
		});

		it('returns correct description for afternoon', () => {
			expect(getTimePreferenceDescription('afternoon')).toBe('Afternoon (2:00 PM)');
		});

		it('returns correct description for evening', () => {
			expect(getTimePreferenceDescription('evening')).toBe('Evening (6:00 PM)');
		});
	});
});
