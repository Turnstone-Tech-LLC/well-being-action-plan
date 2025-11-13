/**
 * Notification Service
 * Handles daily check-in notification scheduling using service workers and IndexedDB
 */

/* eslint-disable no-undef */

import { getUserConfig, setUserConfig } from '../db';

export interface NotificationSchedule {
  enabled: boolean;
  time: string; // Format: "HH:MM" (24-hour format)
  lastScheduled?: string; // ISO timestamp
}

export interface NotificationPreferences {
  enableNotifications: boolean;
  enableCheckInReminders: boolean;
  checkInFrequencyHours: number;
  permissionStatus: string;
  scheduledTime?: string; // Format: "HH:MM"
}

const DEFAULT_NOTIFICATION_TIME = '09:00'; // 9:00 AM

/**
 * Check if notifications are supported in the current browser
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported in this browser');
  }

  return await Notification.requestPermission();
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  return Notification.permission;
}

/**
 * Register the notification service worker
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser');
    return null;
  }

  try {
    // Check if we already have a service worker
    const existingRegistrations = await navigator.serviceWorker.getRegistrations();

    // Look for our notification service worker by checking the script URL
    let registration = existingRegistrations.find(
      (reg) =>
        reg.active?.scriptURL.includes('notification-sw.js') ||
        reg.installing?.scriptURL.includes('notification-sw.js') ||
        reg.waiting?.scriptURL.includes('notification-sw.js')
    );

    if (registration) {
      return registration;
    }

    // Register the notification service worker
    registration = await navigator.serviceWorker.register('/notification-sw.js', {
      scope: '/',
    });

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  } catch (error) {
    console.error('Failed to register notification service worker:', error);
    return null;
  }
}

/**
 * Get the notification schedule from IndexedDB
 */
export async function getNotificationSchedule(
  userId: string
): Promise<NotificationSchedule | null> {
  try {
    const config = await getUserConfig(userId, 'notificationSchedule');

    if (config && typeof config.value === 'object') {
      return config.value as NotificationSchedule;
    }

    return null;
  } catch (error) {
    console.error('Failed to get notification schedule:', error);
    return null;
  }
}

/**
 * Save the notification schedule to IndexedDB
 */
export async function saveNotificationSchedule(
  userId: string,
  schedule: NotificationSchedule
): Promise<void> {
  try {
    await setUserConfig(userId, 'notificationSchedule', schedule);
  } catch (error) {
    console.error('Failed to save notification schedule:', error);
    throw error;
  }
}

/**
 * Schedule a daily notification at the specified time
 */
export async function scheduleDailyNotification(
  userId: string,
  time: string,
  enabled: boolean = true
): Promise<boolean> {
  try {
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new Error('Invalid time format. Expected HH:MM (24-hour format)');
    }

    // Check permission
    const permission = getNotificationPermissionStatus();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    // Register service worker if not already registered
    const registration = await registerNotificationServiceWorker();
    if (!registration) {
      console.error('Failed to register service worker');
      return false;
    }

    // Save schedule to IndexedDB
    const schedule: NotificationSchedule = {
      enabled,
      time,
      lastScheduled: new Date().toISOString(),
    };
    await saveNotificationSchedule(userId, schedule);

    // Send message to service worker to schedule the notification
    if (registration.active) {
      registration.active.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        scheduledTime: time,
        enabled,
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return false;
  }
}

/**
 * Cancel scheduled notifications
 */
export async function cancelScheduledNotifications(userId: string): Promise<void> {
  try {
    // Update schedule in IndexedDB
    const schedule = await getNotificationSchedule(userId);
    if (schedule) {
      schedule.enabled = false;
      await saveNotificationSchedule(userId, schedule);
    }

    // Send message to service worker
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (registration?.active) {
      registration.active.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        enabled: false,
      });
    }
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
}

/**
 * Initialize notification scheduling from stored preferences
 * Should be called when the app loads
 */
export async function initializeNotificationScheduling(userId: string): Promise<void> {
  try {
    // Get stored notification preferences
    const prefsConfig = await getUserConfig(userId, 'notificationPreferences');
    const scheduleConfig = await getNotificationSchedule(userId);

    if (!prefsConfig?.value) {
      return;
    }

    const prefs = prefsConfig.value as NotificationPreferences;

    // Check if notifications are enabled in preferences and permission is granted
    if (
      !prefs.enableNotifications ||
      !prefs.enableCheckInReminders ||
      getNotificationPermissionStatus() !== 'granted'
    ) {
      return;
    }

    // IMPORTANT: Check if the schedule has been explicitly disabled by the user
    // This takes precedence over the preferences
    if (scheduleConfig?.enabled === false) {
      return;
    }

    // Get scheduled time (use stored time or default)
    const scheduledTime = scheduleConfig?.time || prefs.scheduledTime || DEFAULT_NOTIFICATION_TIME;

    // Schedule the notification
    await scheduleDailyNotification(userId, scheduledTime, true);
  } catch (error) {
    console.error('Failed to initialize notification scheduling:', error);
  }
}

/**
 * Update notification time
 * Updates both the notification schedule and preferences to keep them in sync
 */
export async function updateNotificationTime(userId: string, newTime: string): Promise<boolean> {
  try {
    const schedule = await getNotificationSchedule(userId);
    const enabled = schedule?.enabled ?? true;

    // Update the schedule
    const success = await scheduleDailyNotification(userId, newTime, enabled);

    if (success) {
      // Also update the preferences to keep both records in sync
      try {
        const prefsConfig = await getUserConfig(userId, 'notificationPreferences');
        if (prefsConfig?.value) {
          const currentPrefs = prefsConfig.value as NotificationPreferences;
          const updatedPrefs = {
            ...currentPrefs,
            scheduledTime: newTime,
          };
          await setUserConfig(userId, 'notificationPreferences', updatedPrefs);
        }
      } catch (prefError) {
        console.warn('Failed to update notification preferences:', prefError);
        // Don't fail the entire operation if preferences update fails
      }
    }

    return success;
  } catch (error) {
    console.error('Failed to update notification time:', error);
    return false;
  }
}

/**
 * Get the currently scheduled notification time
 */
export async function getScheduledNotificationTime(userId: string): Promise<string | null> {
  const schedule = await getNotificationSchedule(userId);
  return schedule?.time || null;
}

/**
 * Check if daily notifications are currently enabled
 */
export async function areNotificationsEnabled(userId: string): Promise<boolean> {
  try {
    const schedule = await getNotificationSchedule(userId);
    const permission = getNotificationPermissionStatus();

    return schedule?.enabled === true && permission === 'granted';
  } catch (error) {
    console.error('Failed to check notification status:', error);
    return false;
  }
}
