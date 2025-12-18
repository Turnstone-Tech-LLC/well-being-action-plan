import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the getDB function
const mockPatientProfiles = {
	where: vi.fn().mockReturnThis(),
	equals: vi.fn().mockReturnThis(),
	first: vi.fn(),
	modify: vi.fn(),
	add: vi.fn(),
	delete: vi.fn(),
	clear: vi.fn(),
	orderBy: vi.fn().mockReturnThis(),
	reverse: vi.fn().mockReturnThis(),
	update: vi.fn()
};

const mockDB = {
	patientProfiles: mockPatientProfiles
};

vi.mock('./index', () => ({
	getDB: () => mockDB
}));

// Import after mocking
import {
	hasPatientProfile,
	getPatientProfile,
	getCurrentPatientProfile,
	createPatientProfile,
	updateDisplayName,
	completeOnboarding,
	isOnboardingComplete,
	deletePatientProfile,
	clearPatientProfiles,
	updateNotificationPreferences,
	updateLastReminderShown
} from './profile';

describe('profile utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('hasPatientProfile', () => {
		it('returns true when profile exists', async () => {
			mockPatientProfiles.first.mockResolvedValue({ id: 1, actionPlanId: 'test-id' });

			const result = await hasPatientProfile('test-id');

			expect(result).toBe(true);
			expect(mockPatientProfiles.where).toHaveBeenCalledWith('actionPlanId');
			expect(mockPatientProfiles.equals).toHaveBeenCalledWith('test-id');
		});

		it('returns false when profile does not exist', async () => {
			mockPatientProfiles.first.mockResolvedValue(undefined);

			const result = await hasPatientProfile('test-id');

			expect(result).toBe(false);
		});
	});

	describe('getPatientProfile', () => {
		it('returns profile when it exists', async () => {
			const mockProfile = {
				id: 1,
				actionPlanId: 'test-id',
				displayName: 'Test User',
				onboardingComplete: true,
				createdAt: new Date(),
				updatedAt: new Date()
			};
			mockPatientProfiles.first.mockResolvedValue(mockProfile);

			const result = await getPatientProfile('test-id');

			expect(result).toEqual(mockProfile);
		});

		it('returns null when profile does not exist', async () => {
			mockPatientProfiles.first.mockResolvedValue(undefined);

			const result = await getPatientProfile('test-id');

			expect(result).toBeNull();
		});
	});

	describe('getCurrentPatientProfile', () => {
		it('returns the most recent profile', async () => {
			const mockProfile = {
				id: 1,
				actionPlanId: 'test-id',
				displayName: 'Test User',
				onboardingComplete: true,
				createdAt: new Date(),
				updatedAt: new Date()
			};
			mockPatientProfiles.first.mockResolvedValue(mockProfile);

			const result = await getCurrentPatientProfile();

			expect(result).toEqual(mockProfile);
			expect(mockPatientProfiles.orderBy).toHaveBeenCalledWith('createdAt');
			expect(mockPatientProfiles.reverse).toHaveBeenCalled();
		});

		it('returns null when no profiles exist', async () => {
			mockPatientProfiles.first.mockResolvedValue(undefined);

			const result = await getCurrentPatientProfile();

			expect(result).toBeNull();
		});
	});

	describe('createPatientProfile', () => {
		it('creates a new profile when none exists', async () => {
			mockPatientProfiles.first.mockResolvedValue(undefined);
			mockPatientProfiles.add.mockResolvedValue(1);

			await createPatientProfile({
				actionPlanId: 'test-id',
				displayName: 'Test User'
			});

			expect(mockPatientProfiles.add).toHaveBeenCalledWith(
				expect.objectContaining({
					actionPlanId: 'test-id',
					displayName: 'Test User',
					onboardingComplete: false
				})
			);
		});

		it('updates existing profile when one exists', async () => {
			mockPatientProfiles.first.mockResolvedValue({
				id: 1,
				actionPlanId: 'test-id',
				displayName: 'Old Name'
			});
			mockPatientProfiles.update.mockResolvedValue(1);

			await createPatientProfile({
				actionPlanId: 'test-id',
				displayName: 'New Name'
			});

			expect(mockPatientProfiles.update).toHaveBeenCalledWith(
				1,
				expect.objectContaining({
					displayName: 'New Name'
				})
			);
		});
	});

	describe('updateDisplayName', () => {
		it('updates the display name', async () => {
			mockPatientProfiles.modify.mockResolvedValue(1);

			await updateDisplayName('test-id', 'New Name');

			expect(mockPatientProfiles.where).toHaveBeenCalledWith('actionPlanId');
			expect(mockPatientProfiles.equals).toHaveBeenCalledWith('test-id');
			expect(mockPatientProfiles.modify).toHaveBeenCalledWith(
				expect.objectContaining({
					displayName: 'New Name'
				})
			);
		});
	});

	describe('completeOnboarding', () => {
		it('sets onboardingComplete to true', async () => {
			mockPatientProfiles.modify.mockResolvedValue(1);

			await completeOnboarding('test-id');

			expect(mockPatientProfiles.modify).toHaveBeenCalledWith(
				expect.objectContaining({
					onboardingComplete: true
				})
			);
		});
	});

	describe('isOnboardingComplete', () => {
		it('returns true when onboarding is complete', async () => {
			mockPatientProfiles.first.mockResolvedValue({
				id: 1,
				actionPlanId: 'test-id',
				onboardingComplete: true
			});

			const result = await isOnboardingComplete('test-id');

			expect(result).toBe(true);
		});

		it('returns false when onboarding is not complete', async () => {
			mockPatientProfiles.first.mockResolvedValue({
				id: 1,
				actionPlanId: 'test-id',
				onboardingComplete: false
			});

			const result = await isOnboardingComplete('test-id');

			expect(result).toBe(false);
		});

		it('returns false when profile does not exist', async () => {
			mockPatientProfiles.first.mockResolvedValue(undefined);

			const result = await isOnboardingComplete('test-id');

			expect(result).toBe(false);
		});
	});

	describe('deletePatientProfile', () => {
		it('deletes the profile', async () => {
			mockPatientProfiles.delete.mockResolvedValue(1);

			await deletePatientProfile('test-id');

			expect(mockPatientProfiles.where).toHaveBeenCalledWith('actionPlanId');
			expect(mockPatientProfiles.equals).toHaveBeenCalledWith('test-id');
			expect(mockPatientProfiles.delete).toHaveBeenCalled();
		});
	});

	describe('clearPatientProfiles', () => {
		it('clears all profiles', async () => {
			mockPatientProfiles.clear.mockResolvedValue(undefined);

			await clearPatientProfiles();

			expect(mockPatientProfiles.clear).toHaveBeenCalled();
		});
	});

	describe('updateNotificationPreferences', () => {
		it('updates notification preferences', async () => {
			mockPatientProfiles.modify.mockResolvedValue(1);

			await updateNotificationPreferences({
				actionPlanId: 'test-id',
				notificationsEnabled: true,
				notificationFrequency: 'daily',
				notificationTime: 'morning'
			});

			expect(mockPatientProfiles.where).toHaveBeenCalledWith('actionPlanId');
			expect(mockPatientProfiles.equals).toHaveBeenCalledWith('test-id');
			expect(mockPatientProfiles.modify).toHaveBeenCalledWith(
				expect.objectContaining({
					notificationsEnabled: true,
					notificationFrequency: 'daily',
					notificationTime: 'morning'
				})
			);
		});
	});

	describe('updateLastReminderShown', () => {
		it('updates the last reminder shown timestamp', async () => {
			mockPatientProfiles.modify.mockResolvedValue(1);

			await updateLastReminderShown('test-id');

			expect(mockPatientProfiles.where).toHaveBeenCalledWith('actionPlanId');
			expect(mockPatientProfiles.equals).toHaveBeenCalledWith('test-id');
			expect(mockPatientProfiles.modify).toHaveBeenCalledWith(
				expect.objectContaining({
					lastReminderShown: expect.any(Date),
					updatedAt: expect.any(Date)
				})
			);
		});
	});
});
