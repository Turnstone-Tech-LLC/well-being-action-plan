import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import NotificationStep from './NotificationStep.svelte';

// Mock the notifications module
vi.mock('$lib/notifications', () => ({
	isNotificationSupported: vi.fn(() => true),
	getPermissionStatus: vi.fn(() => 'default'),
	requestPermission: vi.fn(() => Promise.resolve(true)),
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

// Import mocked module to modify it
import * as notifications from '$lib/notifications';

describe('NotificationStep', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(notifications.isNotificationSupported).mockReturnValue(true);
		vi.mocked(notifications.getPermissionStatus).mockReturnValue('default');
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('renders the notification step heading', async () => {
		const onContinue = vi.fn();
		render(NotificationStep, { onContinue });

		const heading = page.getByRole('heading', { name: 'Stay on track with reminders' });
		await expect.element(heading).toBeInTheDocument();
	});

	it('renders the description text', async () => {
		const onContinue = vi.fn();
		const { container } = render(NotificationStep, { onContinue });

		const description = container.querySelector('.description');
		expect(description?.textContent).toContain('We can send you gentle reminders');
	});

	it('shows frequency select with options', async () => {
		const onContinue = vi.fn();
		render(NotificationStep, { onContinue });

		const frequencyLabel = page.getByText('How often would you like reminders?');
		await expect.element(frequencyLabel).toBeInTheDocument();
	});

	it('shows time select by default', async () => {
		const onContinue = vi.fn();
		render(NotificationStep, { onContinue });

		const timeLabel = page.getByText('What time works best for you?');
		await expect.element(timeLabel).toBeInTheDocument();
	});

	it('shows "Enable Notifications" button when permission not granted', async () => {
		const onContinue = vi.fn();
		vi.mocked(notifications.getPermissionStatus).mockReturnValue('default');
		render(NotificationStep, { onContinue });

		const enableBtn = page.getByRole('button', { name: /Enable Notifications/i });
		await expect.element(enableBtn).toBeInTheDocument();
	});

	it('shows "Finish Setup" button when permission already granted', async () => {
		const onContinue = vi.fn();
		vi.mocked(notifications.getPermissionStatus).mockReturnValue('granted');
		render(NotificationStep, { onContinue });

		const finishBtn = page.getByRole('button', { name: /Finish Setup/i });
		await expect.element(finishBtn).toBeInTheDocument();
	});

	it('shows "Skip for now" link', async () => {
		const onContinue = vi.fn();
		vi.mocked(notifications.getPermissionStatus).mockReturnValue('default');
		render(NotificationStep, { onContinue });

		const skipLink = page.getByRole('button', { name: /Skip for now/i });
		await expect.element(skipLink).toBeInTheDocument();
	});

	it('shows Back button when onBack prop is provided', async () => {
		const onContinue = vi.fn();
		const onBack = vi.fn();
		render(NotificationStep, { onContinue, onBack });

		const backBtn = page.getByRole('button', { name: /Back/i });
		await expect.element(backBtn).toBeInTheDocument();
	});

	it('calls onBack when Back button is clicked', async () => {
		const onContinue = vi.fn();
		const onBack = vi.fn();
		render(NotificationStep, { onContinue, onBack });

		const backBtn = page.getByRole('button', { name: /Back/i });
		await userEvent.click(backBtn);

		expect(onBack).toHaveBeenCalledOnce();
	});

	it('calls onContinue with notifications disabled when skip is clicked', async () => {
		const onContinue = vi.fn();
		vi.mocked(notifications.getPermissionStatus).mockReturnValue('default');
		render(NotificationStep, { onContinue });

		const skipLink = page.getByRole('button', { name: /Skip for now/i });
		await userEvent.click(skipLink);

		expect(onContinue).toHaveBeenCalledWith({
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning'
		});
	});

	it('shows privacy note', async () => {
		const onContinue = vi.fn();
		const { container } = render(NotificationStep, { onContinue });

		const privacyNote = container.querySelector('.privacy-note');
		expect(privacyNote?.textContent).toContain('Your notification preferences stay on your device');
	});

	it('shows unsupported notice when notifications are not supported', async () => {
		const onContinue = vi.fn();
		vi.mocked(notifications.isNotificationSupported).mockReturnValue(false);
		const { container } = render(NotificationStep, { onContinue });

		const unsupportedNotice = container.querySelector('.unsupported-notice');
		expect(unsupportedNotice).not.toBeNull();
		expect(unsupportedNotice?.textContent).toContain('Notifications are not supported');
	});

	it('has accessible form elements', async () => {
		const onContinue = vi.fn();
		const { container } = render(NotificationStep, { onContinue });

		// Check that frequency select has a label
		const frequencyLabel = container.querySelector('label[for^="frequency-"]');
		expect(frequencyLabel).not.toBeNull();

		// Check that time select has a label
		const timeLabel = container.querySelector('label[for^="time-"]');
		expect(timeLabel).not.toBeNull();
	});
});
