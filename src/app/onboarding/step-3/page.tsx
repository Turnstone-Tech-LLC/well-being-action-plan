'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';
import { setUserConfig } from '@/lib/db';
import { ChevronLeft, Loader2, Bell, Clock, AlertCircle } from 'lucide-react';

/**
 * Onboarding Step 3: Notification Preferences
 *
 * This step allows patients to:
 * - Enable/disable push notifications
 * - Configure check-in reminders
 * - Set reminder frequency
 * - Complete the onboarding process
 */
export default function OnboardingStep3Page() {
  const router = useRouter();
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableCheckInReminders, setEnableCheckInReminders] = useState(true);
  const [checkInFrequencyHours, setCheckInFrequencyHours] = useState(24);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'default' | 'unsupported'
  >('default');

  // Check notification permission status on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(window.Notification.permission as 'granted' | 'denied' | 'default');
    } else {
      setPermissionStatus('unsupported');
    }
  }, []);

  /**
   * Request notification permission from the browser
   */
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setError('Notifications are not supported by your browser');
      return false;
    }

    try {
      const permission = await window.Notification.requestPermission();
      setPermissionStatus(permission as 'granted' | 'denied' | 'default');

      if (permission === 'granted') {
        return true;
      } else if (permission === 'denied') {
        setError(
          'Notification permission denied. You can change this in your browser settings later.'
        );
        return false;
      }
      return false;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setError('Failed to request notification permission');
      return false;
    }
  };

  /**
   * Handle enabling/disabling notifications
   */
  const handleNotificationToggle = async (checked: boolean) => {
    if (checked && permissionStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      if (granted) {
        setEnableNotifications(true);
      } else {
        setEnableNotifications(false);
      }
    } else {
      setEnableNotifications(checked);
      if (!checked) {
        // If disabling notifications, also disable check-in reminders
        setEnableCheckInReminders(false);
      }
    }
  };

  /**
   * Navigate back to Step 2
   */
  const handleBack = () => {
    router.push('/onboarding/step-2');
  };

  /**
   * Save notification preferences and complete onboarding
   */
  const handleComplete = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save notification preferences to userConfig
      const notificationPreferences = {
        enableNotifications,
        enableCheckInReminders: enableNotifications && enableCheckInReminders,
        checkInFrequencyHours,
        permissionStatus,
      };

      await setUserConfig('patient', 'notificationPreferences', notificationPreferences);

      // Mark onboarding as complete
      await setUserConfig('patient', 'onboardingCompleted', true);
      await setUserConfig('patient', 'onboardingCompletedAt', new Date().toISOString());

      // Navigate to patient dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
      setError('Failed to save your preferences. Please try again.');
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-6">
        <ProgressIndicator currentStep={3} totalSteps={3} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you&apos;d like to be reminded to check in and manage your well-being.
              You can change these settings anytime.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Notification permission warning */}
            {permissionStatus === 'unsupported' && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  Your browser doesn&apos;t support notifications. You can still use the app, but
                  you won&apos;t receive reminders.
                </p>
              </div>
            )}

            {permissionStatus === 'denied' && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  Notifications are currently blocked. To enable them, please update your browser
                  settings.
                </p>
              </div>
            )}

            {/* Enable Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="enable-notifications" className="flex flex-col space-y-1">
                  <span>Enable Notifications</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Receive reminders and updates from the app
                  </span>
                </Label>
                <Switch
                  id="enable-notifications"
                  checked={enableNotifications}
                  onCheckedChange={handleNotificationToggle}
                  disabled={permissionStatus === 'unsupported' || saving}
                />
              </div>

              <Separator />

              {/* Check-in Reminders */}
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="enable-check-in-reminders" className="flex flex-col space-y-1">
                  <span>Check-in Reminders</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Get reminded to check in on your well-being
                  </span>
                </Label>
                <Switch
                  id="enable-check-in-reminders"
                  checked={enableCheckInReminders}
                  onCheckedChange={setEnableCheckInReminders}
                  disabled={!enableNotifications || saving}
                />
              </div>

              {/* Reminder Frequency */}
              {enableCheckInReminders && (
                <div className="space-y-3 rounded-lg bg-muted p-4">
                  <Label htmlFor="check-in-frequency" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Reminder Frequency</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { hours: 12, label: 'Twice daily' },
                      { hours: 24, label: 'Daily' },
                      { hours: 48, label: 'Every 2 days' },
                    ].map((option) => (
                      <button
                        key={option.hours}
                        type="button"
                        onClick={() => setCheckInFrequencyHours(option.hours)}
                        disabled={saving}
                        className={`rounded-md border-2 px-3 py-2 text-sm font-medium transition-all ${
                          checkInFrequencyHours === option.hours
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background hover:border-primary/50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You&apos;ll receive a friendly reminder to check in every{' '}
                    {checkInFrequencyHours === 12 && '12 hours'}
                    {checkInFrequencyHours === 24 && 'day'}
                    {checkInFrequencyHours === 48 && '2 days'}.
                  </p>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Privacy note */}
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
              <p className="font-medium">Your privacy matters</p>
              <p className="mt-1 text-xs">
                All your data stays on your device. Notifications are sent locally and never share
                your personal information.
              </p>
            </div>

            {/* Navigation buttons */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={saving}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleComplete} size="lg" className="flex-1" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Supportive footer message */}
        <p className="text-center text-sm text-muted-foreground">
          You&apos;re all set! Let&apos;s start supporting your well-being journey.
        </p>
      </div>
    </main>
  );
}
