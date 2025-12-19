import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import NotificationSettings from './NotificationSettings.svelte';

// Mock the notification module
vi.mock('$lib/notifications', () => ({
	isNotificationSupported: vi.fn().mockReturnValue(true),
	getPermissionStatus: vi.fn().mockReturnValue('default'),
	requestPermission: vi.fn().mockResolvedValue(true),
	getFrequencyDescription: vi.fn((freq: string) => {
		const descriptions: Record<string, string> = {
			daily: 'Every day',
			every_few_days: 'Every few days',
			weekly: 'Once a week',
			none: 'No reminders'
		};
		return descriptions[freq] || freq;
	}),
	getTimePreferenceDescription: vi.fn((time: string) => {
		const descriptions: Record<string, string> = {
			morning: 'Morning (9:00 AM)',
			afternoon: 'Afternoon (2:00 PM)',
			evening: 'Evening (6:00 PM)'
		};
		return descriptions[time] || time;
	})
}));

// Mock the stores
vi.mock('$lib/stores/patientProfile', () => ({
	patientProfileStore: {
		updateNotificationPreferences: vi.fn().mockResolvedValue(undefined)
	}
}));

vi.mock('$lib/stores/toast', () => ({
	toastStore: {
		success: vi.fn(),
		error: vi.fn(),
		warning: vi.fn()
	}
}));

describe('NotificationSettings', () => {
	it('renders section heading', async () => {
		render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning'
		});

		const heading = page.getByRole('heading', { name: 'Notifications' });
		await expect.element(heading).toBeInTheDocument();
	});

	it('renders notification toggle', async () => {
		render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning'
		});

		const toggle = page.getByRole('switch');
		await expect.element(toggle).toBeInTheDocument();
	});

	it('shows toggle as unchecked when notifications disabled', async () => {
		render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning'
		});

		const toggle = page.getByRole('switch');
		await expect.element(toggle).toHaveAttribute('aria-checked', 'false');
	});

	it('shows toggle as checked when notifications enabled', async () => {
		render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: true,
			notificationFrequency: 'daily',
			notificationTime: 'morning'
		});

		const toggle = page.getByRole('switch');
		await expect.element(toggle).toHaveAttribute('aria-checked', 'true');
	});

	it('displays correct description when notifications are off', async () => {
		render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning'
		});

		const description = page.getByText('Reminders are currently off');
		await expect.element(description).toBeInTheDocument();
	});

	it('displays correct description when notifications are on', async () => {
		render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: true,
			notificationFrequency: 'daily',
			notificationTime: 'morning'
		});

		const description = page.getByText('Get reminded to check in with yourself');
		await expect.element(description).toBeInTheDocument();
	});

	it('shows frequency selector when notifications are enabled', async () => {
		render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: true,
			notificationFrequency: 'daily',
			notificationTime: 'morning'
		});

		const frequencyLabel = page.getByText('How often?');
		await expect.element(frequencyLabel).toBeInTheDocument();
	});

	it('shows time selector when notifications are enabled', async () => {
		render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: true,
			notificationFrequency: 'daily',
			notificationTime: 'morning'
		});

		const timeLabel = page.getByText('Preferred time');
		await expect.element(timeLabel).toBeInTheDocument();
	});

	it('hides frequency and time selectors when notifications are disabled', async () => {
		const { container } = render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning'
		});

		const selects = container.querySelectorAll('select');
		expect(selects.length).toBe(0);
	});

	it('has aria-labelledby on section', async () => {
		const { container } = render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning'
		});

		const section = container.querySelector('section[aria-labelledby="notifications-heading"]');
		expect(section).not.toBeNull();
	});

	it('renders Reminders label', async () => {
		const { container } = render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning'
		});

		const label = container.querySelector('.setting-label-main');
		expect(label?.textContent).toBe('Reminders');
	});
});

describe('NotificationSettings - unsupported browser', () => {
	it('shows unsupported notice when notifications not supported', async () => {
		// Override mock for this test
		const { isNotificationSupported } = await import('$lib/notifications');
		vi.mocked(isNotificationSupported).mockReturnValueOnce(false);

		render(NotificationSettings, {
			actionPlanId: 'test-plan-123',
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning'
		});

		const notice = page.getByText('Notifications are not supported in this browser.');
		await expect.element(notice).toBeInTheDocument();
	});
});
