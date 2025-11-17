'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ZoneType } from '@/lib/types/zone';
import { createCheckIn } from '@/lib/db';
import { getUserIdentity } from '@/lib/services/userIdentityService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CircleCheck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZONE_COLORS, getZoneLabel } from '@/lib/utils/zoneUtils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineIndicator } from '@/components/OfflineIndicator';

/**
 * Green Zone Check-In Screen
 *
 * Check-in interface for patients in the Green (doing well) zone.
 * Features a positive user experience with minimal interaction steps.
 *
 * Features:
 * - Large, clear "Green Zone" visual indicator
 * - Positive affirmation message
 * - Quick mood confirmation with optional sub-zone selector
 * - "Save Check-In" button that persists data to IndexedDB
 * - Success confirmation message
 * - Navigation back to home screen
 */
function GreenZoneCheckInContent() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sub-zones for Green mood (1-3 scale, all positive)
  const moodOptions = [
    { value: 8, label: 'Good', emoji: '😊' },
    { value: 9, label: 'Great', emoji: '😄' },
    { value: 10, label: 'Excellent', emoji: '🌟' },
  ];

  // Get user identity on mount
  useEffect(() => {
    getUserIdentity()
      .then((identity) => setUserId(identity.userId))
      .catch((err) => {
        console.error('Failed to get user identity:', err);
        setError('Unable to identify user. Please refresh the page.');
      });
  }, []);

  const handleSaveCheckIn = async () => {
    if (!userId) {
      setError('User identity not established. Please refresh the page.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Create check-in entry with unique user ID
      await createCheckIn({
        userId,
        zone: ZoneType.Green,
        moodRating: selectedMood || 9, // Default to "Great" if not specified
      });

      setSaved(true);

      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to save check-in:', error);
      setError('Failed to save check-in. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/check-in');
  };

  const greenColors = ZONE_COLORS[ZoneType.Green];

  if (saved) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <Card
          className={cn('w-full max-w-2xl border-2', greenColors.border, greenColors.background)}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className={cn(
                'mb-6 flex h-20 w-20 items-center justify-center rounded-full',
                greenColors.background
              )}
              aria-hidden="true"
            >
              <Check className={cn('h-10 w-10', greenColors.text)} />
            </div>
            <div role="status" aria-live="polite">
              <h2 className={cn('mb-2 text-2xl font-bold', greenColors.text)}>Check-In Saved!</h2>
              <p className={greenColors.text}>
                Great to hear you&apos;re doing well. Keep up the positive momentum!
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 py-12">
      <OfflineIndicator />
      <div className="w-full max-w-2xl space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Go back to zone selection"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Green Zone Indicator */}
        <Card className={cn('border-2', greenColors.border, greenColors.background)}>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div
                className={cn(
                  'flex h-24 w-24 items-center justify-center rounded-full',
                  greenColors.background
                )}
              >
                <CircleCheck className={cn('h-12 w-12', greenColors.text)} />
              </div>
            </div>
            <div className="mb-2 flex justify-center">
              <Badge className={cn(greenColors.background, greenColors.text)}>
                {getZoneLabel(ZoneType.Green)}
              </Badge>
            </div>
            <CardTitle className={cn('text-3xl', greenColors.text)}>
              You&apos;re Doing Great! 🌱
            </CardTitle>
            <CardDescription className={cn('text-lg', greenColors.text)}>
              It&apos;s wonderful to see you in a positive place. Keep nurturing your well-being!
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Mood Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">How good are you feeling?</CardTitle>
            <CardDescription>Optional - Select the option that fits best</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedMood(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:scale-105',
                    selectedMood === option.value
                      ? cn(greenColors.border, greenColors.background)
                      : 'border-border hover:border-green-zone/50'
                  )}
                  aria-label={`Select ${option.label} mood`}
                  aria-pressed={selectedMood === option.value}
                >
                  <span className="text-4xl" role="img" aria-label={option.label}>
                    {option.emoji}
                  </span>
                  <span className="font-medium">{option.label}</span>
                  {selectedMood === option.value && (
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <CardContent className="py-4">
              <p className="text-center text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Positive Affirmation */}
        <Card className="bg-muted/50">
          <CardContent className="py-6">
            <p className="text-center text-sm text-muted-foreground">
              Remember: Taking time to check in with yourself is an important part of maintaining
              your mental health. You&apos;re doing a great job!
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleSaveCheckIn}
            disabled={saving}
            size="lg"
            className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
            aria-busy={saving}
          >
            {saving ? (
              <>
                <span
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" aria-hidden="true" />
                Save Check-In
              </>
            )}
          </Button>
          <Button onClick={handleBack} variant="outline" size="lg" className="sm:w-32">
            Cancel
          </Button>
        </div>
      </div>
    </main>
  );
}

/**
 * Wrapped with ErrorBoundary to catch and handle rendering errors
 */
export default function GreenZoneCheckIn() {
  return (
    <ErrorBoundary>
      <GreenZoneCheckInContent />
    </ErrorBoundary>
  );
}
