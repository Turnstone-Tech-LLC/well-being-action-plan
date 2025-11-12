'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  areNotificationsEnabled,
  getNotificationPermissionStatus,
  getScheduledNotificationTime,
  requestNotificationPermission,
  scheduleDailyNotification,
  cancelScheduledNotifications,
  updateNotificationTime,
  registerNotificationServiceWorker,
} from '@/lib/services/notificationService';
import { getUserConfig } from '@/lib/db';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load patient name
      const nameConfig = await getUserConfig('patient', 'preferredName');
      if (nameConfig && typeof nameConfig.value === 'string') {
        setPatientName(nameConfig.value);
      }

      // Get notification permission status
      const permission = getNotificationPermissionStatus();
      setPermissionStatus(permission);

      // Get current notification settings
      const enabled = await areNotificationsEnabled('patient');
      setNotificationsEnabled(enabled);

      // Get scheduled time
      const scheduledTime = await getScheduledNotificationTime('patient');
      if (scheduledTime) {
        setNotificationTime(scheduledTime);
      }

      // Register service worker
      await registerNotificationServiceWorker();
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setError(null);
      setSaving(true);

      if (permissionStatus !== 'granted') {
        const permission = await requestNotificationPermission();
        setPermissionStatus(permission);

        if (permission !== 'granted') {
          setError('Notification permission denied. Please enable it in your browser settings.');
          return;
        }
      }

      const success = await scheduleDailyNotification('patient', notificationTime, true);
      if (success) {
        setNotificationsEnabled(true);
        setSuccess('Daily notifications enabled successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to enable notifications');
      }
    } catch (err) {
      console.error('Failed to enable notifications:', err);
      setError('Failed to enable notifications');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      setError(null);
      setSaving(true);

      await cancelScheduledNotifications('patient');
      setNotificationsEnabled(false);
      setSuccess('Daily notifications disabled');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to disable notifications:', err);
      setError('Failed to disable notifications');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (newTime: string) => {
    setNotificationTime(newTime);

    if (notificationsEnabled) {
      try {
        setError(null);
        const success = await updateNotificationTime('patient', newTime);
        if (success) {
          setSuccess('Notification time updated successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError('Failed to update notification time');
        }
      } catch (err) {
        console.error('Failed to update time:', err);
        setError('Failed to update notification time');
      }
    }
  };

  const handleTestNotification = async () => {
    try {
      setError(null);

      if (permissionStatus !== 'granted') {
        const permission = await requestNotificationPermission();
        setPermissionStatus(permission);

        if (permission !== 'granted') {
          setError('Notification permission denied');
          return;
        }
      }

      // Register service worker
      const registration = await registerNotificationServiceWorker();

      if (registration) {
        await registration.showNotification('Test Notification', {
          body: 'Your daily check-in notifications are working!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'test-notification',
        });
        setSuccess('Test notification sent!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to send test notification');
      }
    } catch (err) {
      console.error('Failed to send test notification:', err);
      setError('Failed to send test notification');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-morning-fog to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-catamount-green" />
          <p className="text-vermont-slate dark:text-[#A8D5FF]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-morning-fog to-white dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 flex items-center gap-2 text-catamount-green hover:text-[#0F3428] dark:hover:text-[#7FD4B8]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-catamount-green dark:text-[#7FD4B8]">Settings</h1>
          {patientName && (
            <p className="mt-2 text-vermont-slate dark:text-[#A8D5FF]">Hello, {patientName}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-zone bg-[#DC582A]/10 p-4 text-red-zone dark:bg-[#DC582A]/20 dark:text-[#FF9B7F]">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-zone bg-[#154734]/10 p-4 text-green-zone dark:bg-[#154734]/20 dark:text-[#7FD4B8]">
            {success}
          </div>
        )}

        {/* Notification Settings Card */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Daily Check-In Notifications</h2>

          {/* Permission Status */}
          <div className="mb-6 rounded-lg bg-morning-fog p-4 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-catamount-green dark:text-[#7FD4B8]">
                  Permission Status
                </p>
                <p className="mt-1 text-sm text-vermont-slate dark:text-[#A8D5FF]">
                  {permissionStatus === 'granted' && 'Notifications are allowed'}
                  {permissionStatus === 'denied' && 'Notifications are blocked'}
                  {permissionStatus === 'default' && 'Permission not yet requested'}
                  {permissionStatus === 'unsupported' && 'Notifications not supported'}
                </p>
              </div>
              <div className="flex-shrink-0">
                {permissionStatus === 'granted' && (
                  <span className="inline-flex items-center rounded-full bg-[#154734]/10 px-3 py-1 text-sm font-medium text-green-zone dark:bg-[#154734]/30 dark:text-[#7FD4B8]">
                    Enabled
                  </span>
                )}
                {permissionStatus === 'denied' && (
                  <span className="inline-flex items-center rounded-full bg-[#DC582A]/10 px-3 py-1 text-sm font-medium text-red-zone dark:bg-[#DC582A]/30 dark:text-[#FF9B7F]">
                    Blocked
                  </span>
                )}
                {permissionStatus === 'default' && (
                  <span className="inline-flex items-center rounded-full bg-[#FFD100]/10 px-3 py-1 text-sm font-medium text-[#B39D00] dark:bg-[#FFD100]/20 dark:text-[#FFE066]">
                    Not Set
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Enable Daily Reminders</p>
                <p className="mt-1 text-sm text-gray-600">
                  Receive a daily notification to check in on your well-being
                </p>
              </div>
              <button
                onClick={
                  notificationsEnabled ? handleDisableNotifications : handleEnableNotifications
                }
                disabled={saving || permissionStatus === 'unsupported'}
                aria-label="Toggle daily reminders"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-catamount-green' : 'bg-gray-300'
                } ${saving ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Time Picker */}
          {permissionStatus !== 'unsupported' && (
            <div className="mb-6">
              <label htmlFor="notification-time" className="mb-2 block font-medium text-gray-900">
                Notification Time
              </label>
              <p className="mb-3 text-sm text-gray-600">
                Choose what time you'd like to receive your daily check-in reminder
              </p>
              <input
                id="notification-time"
                type="time"
                value={notificationTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                disabled={saving}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Test Notification Button */}
          {permissionStatus !== 'unsupported' && (
            <button
              onClick={handleTestNotification}
              disabled={saving}
              className="w-full rounded-lg border border-blue-600 px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Test Notification
            </button>
          )}

          {/* Unsupported Message */}
          {permissionStatus === 'unsupported' && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                Notifications are not supported in your current browser. Please try using a modern
                browser like Chrome, Firefox, or Safari.
              </p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 font-medium text-blue-900">About Daily Check-Ins</h3>
          <p className="text-sm text-blue-800">
            Daily check-ins help you stay connected with your emotional well-being. Taking a moment
            each day to reflect on how you're feeling can help you identify patterns, recognize
            triggers, and practice coping strategies before challenges become overwhelming.
          </p>
        </div>
      </div>
    </div>
  );
}
