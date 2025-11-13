'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { getUserConfig, setUserConfig, clearAllData } from '@/lib/db';
import { usePatientAuth } from '@/hooks/usePatientAuth';
import { exportDataToFile } from '@/lib/services/dataPortabilityService';
import { ConfirmationDialog } from '@/components/confirmation-dialog';

/**
 * Settings Page
 *
 * Protected Route: Requires completed onboarding
 */
export default function SettingsPage() {
  const router = useRouter();
  // Patient authentication - redirects to onboarding if not complete
  const { loading: authLoading, isOnboardingComplete } = usePatientAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('');
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  const loadSettings = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // Only load settings if onboarding is complete
    if (!authLoading && isOnboardingComplete) {
      loadSettings();
    }
  }, [authLoading, isOnboardingComplete, loadSettings]);

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
        // Update notification preferences in the database
        const currentPrefs = await getUserConfig('patient', 'notificationPreferences');
        const updatedPrefs = {
          enableNotifications: true,
          enableCheckInReminders: true,
          checkInFrequencyHours:
            (currentPrefs?.value as { checkInFrequencyHours?: number })?.checkInFrequencyHours ||
            24,
          permissionStatus,
          scheduledTime: notificationTime,
        };
        await setUserConfig('patient', 'notificationPreferences', updatedPrefs);

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

      // Update notification preferences in the database
      const currentPrefs = await getUserConfig('patient', 'notificationPreferences');
      const updatedPrefs = {
        enableNotifications: false,
        enableCheckInReminders: false,
        checkInFrequencyHours:
          (currentPrefs?.value as { checkInFrequencyHours?: number })?.checkInFrequencyHours || 24,
        permissionStatus,
        scheduledTime: notificationTime,
      };
      await setUserConfig('patient', 'notificationPreferences', updatedPrefs);

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

  const handleExportData = async () => {
    try {
      setError(null);
      setExportingData(true);

      await exportDataToFile();

      setSuccess('Data exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to export data:', err);
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setExportingData(false);
    }
  };

  const handleClearData = async () => {
    try {
      setClearingData(true);
      setError(null);

      await clearAllData();

      setSuccess('All data cleared successfully');
      setTimeout(() => {
        // Redirect to home page after clearing data
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Failed to clear data:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear data');
      setClearingData(false);
      setShowClearDataDialog(false);
    }
  };

  // Show loading state while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-morning-fog to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-catamount-green" />
          <p className="text-vermont-slate dark:text-[#A8D5FF]">
            {authLoading ? 'Checking authentication...' : 'Loading settings...'}
          </p>
        </div>
      </div>
    );
  }

  // If onboarding is not complete, the usePatientAuth hook will redirect
  if (!isOnboardingComplete) {
    return null;
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

        {/* Data Management Card */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Data Management</h2>
          <p className="mb-6 text-sm text-gray-600">
            Export your data for backup or clear all data from this device
          </p>

          {/* Export Data */}
          <div className="mb-6">
            <div className="mb-3">
              <p className="font-medium text-gray-900">Export Your Data</p>
              <p className="mt-1 text-sm text-gray-600">
                Download all your check-ins, coping strategies, and settings as a JSON file
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={exportingData}
              className="w-full rounded-lg bg-catamount-green px-4 py-2 text-white transition-colors hover:bg-[#0F3428] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportingData ? 'Exporting...' : 'Export Data'}
            </button>
          </div>

          {/* Clear All Data */}
          <div>
            <div className="mb-3">
              <p className="font-medium text-red-zone">Clear All Data</p>
              <p className="mt-1 text-sm text-gray-600">
                Permanently delete all your data from this device. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowClearDataDialog(true)}
              disabled={clearingData}
              className="w-full rounded-lg border-2 border-red-zone px-4 py-2 text-red-zone transition-colors hover:bg-red-zone hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear All Data
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Privacy First:</strong> All your data is stored locally on this device only.
              When you export data, it's saved as a file on your device. No data is sent to external
              servers.
            </p>
          </div>
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

      {/* Clear Data Confirmation Dialog */}
      <ConfirmationDialog
        open={showClearDataDialog}
        onOpenChange={setShowClearDataDialog}
        title="Clear All Data?"
        description="This will permanently delete all your check-ins, coping strategies, and settings from this device. This action cannot be undone."
        confirmText="Clear All Data"
        cancelText="Cancel"
        destructive
        loading={clearingData}
        onConfirm={handleClearData}
      >
        <div className="rounded-lg border border-uvm-gold bg-uvm-gold/10 p-4">
          <p className="text-sm font-medium text-uvm-gold">⚠️ Before you proceed:</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Consider exporting your data first as a backup</li>
            <li>• All your check-in history will be lost</li>
            <li>• All your coping strategies will be deleted</li>
            <li>• You'll need a new access code to start over</li>
          </ul>
        </div>
      </ConfirmationDialog>
    </div>
  );
}
