import { browser } from '$app/environment';
import type { NotificationFrequency, NotificationTime } from '$lib/db';
import { updateLastReminderShown } from '$lib/db/profile';

/**
 * Service worker registration path.
 */
const SW_PATH = '/service-worker.js';

/**
 * Check if the Notification API is available.
 */
export function isNotificationSupported(): boolean {
	return browser && 'Notification' in window;
}

/**
 * Check if service workers are supported.
 */
export function isServiceWorkerSupported(): boolean {
	return browser && 'serviceWorker' in navigator;
}

/**
 * Get the current notification permission status.
 */
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
	if (!isNotificationSupported()) {
		return 'unsupported';
	}
	return Notification.permission;
}

/**
 * Request notification permission from the user.
 * Returns true if permission was granted, false otherwise.
 */
export async function requestPermission(): Promise<boolean> {
	if (!isNotificationSupported()) {
		console.warn('Notifications not supported in this browser');
		return false;
	}

	// Already granted
	if (Notification.permission === 'granted') {
		return true;
	}

	// Already denied - can't request again
	if (Notification.permission === 'denied') {
		return false;
	}

	// Request permission
	try {
		const result = await Notification.requestPermission();
		return result === 'granted';
	} catch (error) {
		console.error('Error requesting notification permission:', error);
		return false;
	}
}

/**
 * Register the service worker for push notifications.
 * Returns the registration if successful, null otherwise.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (!isServiceWorkerSupported()) {
		console.warn('Service workers not supported in this browser');
		return null;
	}

	try {
		const registration = await navigator.serviceWorker.register(SW_PATH, {
			scope: '/'
		});
		console.log('Service worker registered:', registration.scope);
		return registration;
	} catch (error) {
		console.error('Service worker registration failed:', error);
		return null;
	}
}

/**
 * Get the active service worker registration.
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
	if (!isServiceWorkerSupported()) {
		return null;
	}

	try {
		return await navigator.serviceWorker.ready;
	} catch (error) {
		console.error('Error getting service worker registration:', error);
		return null;
	}
}

/**
 * Show a local notification using the service worker.
 */
export async function showNotification(
	title: string,
	options?: NotificationOptions
): Promise<boolean> {
	if (!isNotificationSupported()) {
		return false;
	}

	if (Notification.permission !== 'granted') {
		return false;
	}

	try {
		const registration = await getServiceWorkerRegistration();
		if (registration) {
			await registration.showNotification(title, {
				icon: '/icons/icon-192.png',
				badge: '/icons/badge-72.png',
				tag: 'checkin-reminder',
				...options
			});
			return true;
		}

		// Fallback to direct Notification if service worker not available
		new Notification(title, options);
		return true;
	} catch (error) {
		console.error('Error showing notification:', error);
		return false;
	}
}

/**
 * Calculate the next reminder time based on frequency and time preference.
 */
export function calculateNextReminderTime(
	frequency: NotificationFrequency,
	timePreference: NotificationTime,
	lastShown?: Date
): Date | null {
	if (frequency === 'none') {
		return null;
	}

	const now = new Date();
	const baseDate = lastShown ? new Date(lastShown) : now;

	// Calculate days to add based on frequency
	let daysToAdd = 0;
	switch (frequency) {
		case 'daily':
			daysToAdd = 1;
			break;
		case 'every_few_days':
			daysToAdd = 3;
			break;
		case 'weekly':
			daysToAdd = 7;
			break;
	}

	// Calculate target time based on preference
	let targetHour: number;
	switch (timePreference) {
		case 'morning':
			targetHour = 9; // 9 AM
			break;
		case 'afternoon':
			targetHour = 14; // 2 PM
			break;
		case 'evening':
			targetHour = 18; // 6 PM
			break;
	}

	const nextReminder = new Date(baseDate);
	nextReminder.setDate(nextReminder.getDate() + daysToAdd);
	nextReminder.setHours(targetHour, 0, 0, 0);

	// If the calculated time is in the past, move to next applicable day
	if (nextReminder <= now) {
		nextReminder.setDate(now.getDate());
		nextReminder.setHours(targetHour, 0, 0, 0);

		if (nextReminder <= now) {
			nextReminder.setDate(nextReminder.getDate() + 1);
		}
	}

	return nextReminder;
}

/**
 * Check if a reminder is due based on frequency, time preference, and last shown.
 */
export function isReminderDue(
	frequency: NotificationFrequency,
	timePreference: NotificationTime,
	lastShown?: Date
): boolean {
	if (frequency === 'none') {
		return false;
	}

	const nextReminder = calculateNextReminderTime(frequency, timePreference, lastShown);
	if (!nextReminder) {
		return false;
	}

	const now = new Date();
	return now >= nextReminder;
}

/**
 * Check if a reminder should be shown and show it if due.
 * Updates the lastReminderShown timestamp if a reminder is shown.
 */
export async function checkAndShowReminder(
	actionPlanId: string,
	notificationsEnabled: boolean,
	frequency: NotificationFrequency,
	timePreference: NotificationTime,
	lastShown?: Date
): Promise<boolean> {
	// Check if notifications are enabled and permission granted
	if (!notificationsEnabled || Notification.permission !== 'granted') {
		return false;
	}

	// Check if reminder is due
	if (!isReminderDue(frequency, timePreference, lastShown)) {
		return false;
	}

	// Show the notification
	const shown = await showNotification('Well-Being Check-In', {
		body: 'How are you feeling today? Take a moment to check in with yourself.',
		tag: 'checkin-reminder',
		data: { url: '/app/checkin' }
	});

	if (shown) {
		await updateLastReminderShown(actionPlanId);
	}

	return shown;
}

/**
 * Schedule local reminders using the Notification API.
 * Note: This uses a simple polling approach when the app is open.
 * For background notifications, the service worker handles periodic sync.
 */
export function scheduleReminder(
	frequency: NotificationFrequency,
	timePreference: NotificationTime
): number | null {
	if (!browser || frequency === 'none') {
		return null;
	}

	// Calculate next reminder time
	const nextTime = calculateNextReminderTime(frequency, timePreference);
	if (!nextTime) {
		return null;
	}

	// Calculate delay in milliseconds
	const delay = nextTime.getTime() - Date.now();
	if (delay <= 0) {
		return null;
	}

	// Schedule the reminder using setTimeout
	// Note: This only works while the app is open
	return window.setTimeout(async () => {
		await showNotification('Well-Being Check-In', {
			body: 'How are you feeling today? Take a moment to check in with yourself.',
			data: { url: '/app/checkin' }
		});
	}, delay);
}

/**
 * Cancel a scheduled reminder.
 */
export function cancelReminder(timerId: number | null): void {
	if (timerId !== null && browser) {
		window.clearTimeout(timerId);
	}
}

/**
 * Cancel all notifications for this app.
 */
export async function cancelAllNotifications(): Promise<void> {
	const registration = await getServiceWorkerRegistration();
	if (registration) {
		const notifications = await registration.getNotifications();
		notifications.forEach((notification) => notification.close());
	}
}

/**
 * Get hours until a specific time preference.
 */
export function getTimePreferenceDescription(time: NotificationTime): string {
	switch (time) {
		case 'morning':
			return 'Morning (9:00 AM)';
		case 'afternoon':
			return 'Afternoon (2:00 PM)';
		case 'evening':
			return 'Evening (6:00 PM)';
	}
}

/**
 * Get a human-readable description of the frequency.
 */
export function getFrequencyDescription(frequency: NotificationFrequency): string {
	switch (frequency) {
		case 'daily':
			return 'Every day';
		case 'every_few_days':
			return 'Every few days';
		case 'weekly':
			return 'Once a week';
		case 'none':
			return 'No reminders';
	}
}
