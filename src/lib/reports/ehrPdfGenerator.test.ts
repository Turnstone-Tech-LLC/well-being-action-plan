import { describe, it, expect } from 'vitest';
import { generateEhrFilename } from './ehrPdfGenerator';
import type { PatientProfile } from '$lib/db/index';
import type { DateRange } from './pdfGenerator';

describe('ehrPdfGenerator', () => {
	describe('generateEhrFilename', () => {
		const mockProfile: PatientProfile = {
			id: 1,
			actionPlanId: 'test-plan-id',
			displayName: 'Test Patient',
			onboardingComplete: true,
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning',
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01')
		};

		it('generates filename with patient name and end date', () => {
			const dateRange: DateRange = {
				start: new Date('2024-01-01'),
				end: new Date('2024-01-31')
			};

			const filename = generateEhrFilename(mockProfile, dateRange);

			expect(filename).toBe('wbap-ehr-test-patient-2024-01-31.pdf');
		});

		it('sanitizes special characters in patient name', () => {
			const profileWithSpecialChars: PatientProfile = {
				...mockProfile,
				displayName: "John O'Brien Jr."
			};
			const dateRange: DateRange = {
				start: new Date('2024-01-01'),
				end: new Date('2024-12-15')
			};

			const filename = generateEhrFilename(profileWithSpecialChars, dateRange);

			expect(filename).toBe('wbap-ehr-john-o-brien-jr--2024-12-15.pdf');
		});

		it('handles names with spaces correctly', () => {
			const profileWithSpaces: PatientProfile = {
				...mockProfile,
				displayName: 'Mary Jane Watson'
			};
			const dateRange: DateRange = {
				start: new Date('2024-06-01'),
				end: new Date('2024-06-30')
			};

			const filename = generateEhrFilename(profileWithSpaces, dateRange);

			expect(filename).toBe('wbap-ehr-mary-jane-watson-2024-06-30.pdf');
		});

		it('converts names to lowercase', () => {
			const profileUpperCase: PatientProfile = {
				...mockProfile,
				displayName: 'UPPERCASE NAME'
			};
			const dateRange: DateRange = {
				start: new Date('2024-03-01'),
				end: new Date('2024-03-15')
			};

			const filename = generateEhrFilename(profileUpperCase, dateRange);

			expect(filename).toBe('wbap-ehr-uppercase-name-2024-03-15.pdf');
		});

		it('handles end-of-year dates correctly', () => {
			const dateRange: DateRange = {
				start: new Date('2024-12-01'),
				end: new Date('2024-12-31')
			};

			const filename = generateEhrFilename(mockProfile, dateRange);

			expect(filename).toBe('wbap-ehr-test-patient-2024-12-31.pdf');
		});
	});
});
