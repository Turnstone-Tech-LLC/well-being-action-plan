'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ZoneType } from '@/lib/types/zone';
import { createCheckIn } from '@/lib/db';
import { getUserIdentity } from '@/lib/services/userIdentityService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertCircle, Phone, MessageSquare, Check, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZONE_COLORS, getZoneLabel } from '@/lib/utils/zoneUtils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineIndicator } from '@/components/OfflineIndicator';

/**
 * Red Zone Check-In Screen
 *
 * Check-in interface for crisis situations that prioritizes access to
 * mental health support services while maintaining a calm user experience.
 *
 * Features:
 * - Prominent "Red Zone" indicator with urgent yet soothing aesthetics
 * - Direct calling capability for 988 (Suicide & Crisis Lifeline)
 * - One-tap texting to 741741 (Crisis Text Line)
 * - Brief reassuring message with guided breathing exercise
 * - "I'm Safe Now" button to document user status
 * - Crisis resources remain visible throughout interface
 * - Calming color palette
 * - Tested on iOS and Android platforms
 */
function RedZoneCheckInContent() {
  const router = useRouter();
  const [showBreathing, setShowBreathing] = useState(false);
  const [isSafe, setIsSafe] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get user identity on mount
  useEffect(() => {
    getUserIdentity()
      .then((identity) => setUserId(identity.userId))
      .catch((err) => {
        console.error('Failed to get user identity:', err);
        setError('Unable to identify user. Please refresh the page.');
      });
  }, []);

  const handleCallCrisisLine = () => {
    // tel: URI scheme for direct calling on mobile devices
    window.location.href = 'tel:988';
  };

  const handleTextCrisisLine = () => {
    // sms: URI scheme for direct texting on mobile devices
    window.location.href = 'sms:741741';
  };

  const handleMarkSafe = async () => {
    if (!userId) {
      setError('User identity not established. Please refresh the page.');
      return;
    }

    setIsSafe(true);
    setSaving(true);
    setError(null);

    try {
      // Create check-in entry documenting the crisis check-in
      await createCheckIn({
        userId,
        zone: ZoneType.Red,
        notes: 'User marked themselves as safe',
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

  const redColors = ZONE_COLORS[ZoneType.Red];

  if (saved) {
    return (
      <main
        className={cn(
          'flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-6',
          redColors.background,
          'from-[#DC582A]/10 to-white dark:from-[#DC582A]/20 dark:to-background'
        )}
      >
        <Card
          className={cn(
            'w-full max-w-2xl border-2 bg-white/80 backdrop-blur dark:bg-background/80',
            redColors.border
          )}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className={cn(
                'mb-6 flex h-20 w-20 items-center justify-center rounded-full',
                redColors.background
              )}
              aria-hidden="true"
            >
              <Check className={cn('h-10 w-10', redColors.text)} />
            </div>
            <div role="status" aria-live="polite">
              <h2 className={cn('mb-2 text-2xl font-bold', redColors.text)}>
                Thank You for Checking In
              </h2>
              <p className={redColors.text}>
                We&apos;re glad you&apos;re here. Remember, help is always available if you need it.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#DC582A]/10 to-white p-6 py-12 dark:from-[#DC582A]/20 dark:to-background">
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

        {/* Red Zone Indicator */}
        <Card
          className={cn(
            'border-2 bg-white/80 backdrop-blur dark:bg-background/80',
            redColors.border
          )}
        >
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div
                className={cn(
                  'flex h-24 w-24 items-center justify-center rounded-full',
                  redColors.background
                )}
              >
                <Heart className={cn('h-12 w-12', redColors.text)} />
              </div>
            </div>
            <div className="mb-2 flex justify-center">
              <Badge className={cn(redColors.background, redColors.text)}>
                {getZoneLabel(ZoneType.Red)}
              </Badge>
            </div>
            <CardTitle className={cn('text-2xl', redColors.text)}>
              You Matter, and Help is Available
            </CardTitle>
            <CardDescription className={cn('text-base leading-relaxed', redColors.text)}>
              If you&apos;re in crisis or having thoughts of self-harm, please reach out to a crisis
              support service immediately. You don&apos;t have to face this alone.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Crisis Hotlines - Most Important */}
        <Card className={cn('border-2', redColors.border)}>
          <CardHeader>
            <CardTitle className={cn('flex items-center gap-2 text-xl', redColors.text)}>
              <AlertCircle className="h-6 w-6" />
              Immediate Support
            </CardTitle>
            <CardDescription>
              These services are free, confidential, and available 24/7
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 988 Crisis Line */}
            <Button
              onClick={handleCallCrisisLine}
              size="lg"
              className={cn(
                'w-full text-lg',
                redColors.backgroundSolid,
                redColors.textContrast,
                redColors.hover
              )}
              aria-label="Call 988 Suicide and Crisis Lifeline - Free, confidential support 24/7"
              role="link"
            >
              <Phone className="mr-3 h-6 w-6" aria-hidden="true" />
              <div className="flex flex-col items-start">
                <span className="font-bold">Call 988</span>
                <span className="text-xs font-normal opacity-90">Suicide & Crisis Lifeline</span>
              </div>
            </Button>

            {/* Crisis Text Line */}
            <Button
              onClick={handleTextCrisisLine}
              size="lg"
              variant="outline"
              className={cn('w-full border-2 text-lg', redColors.border, redColors.hover)}
              aria-label="Text 741741 Crisis Text Line - Free, confidential support 24/7"
              role="link"
            >
              <MessageSquare className="mr-3 h-6 w-6" aria-hidden="true" />
              <div className="flex flex-col items-start">
                <span className="font-bold">Text 741741</span>
                <span className="text-xs font-normal opacity-90">Crisis Text Line</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Breathing Exercise */}
        <Card className="bg-white/80 backdrop-blur dark:bg-background/80">
          <CardHeader>
            <CardTitle className="text-lg">Take a Moment to Breathe</CardTitle>
            <CardDescription>A simple exercise to help ground yourself right now</CardDescription>
          </CardHeader>
          <CardContent>
            {!showBreathing ? (
              <Button onClick={() => setShowBreathing(true)} variant="outline" className="w-full">
                Start Breathing Exercise
              </Button>
            ) : (
              <div className="space-y-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-6 text-center dark:from-blue-950 dark:to-purple-950">
                <div className="relative mx-auto h-32 w-32">
                  <div className="absolute inset-0 animate-[ping_4s_ease-in-out_infinite] rounded-full bg-blue-400 opacity-75" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Breathe in slowly for 4 counts...
                    <br />
                    Hold for 4 counts...
                    <br />
                    Breathe out slowly for 4 counts...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Repeat this cycle a few times until you feel calmer
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reassurance Message */}
        <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20">
          <CardContent className="py-6">
            <p className="text-center text-sm leading-relaxed text-rose-700 dark:text-rose-300">
              <strong>You are not alone.</strong> Many people have felt this way and found help.
              Things can get better, and there are people who want to support you through this
              difficult time. Please reach out - your life matters.
            </p>
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

        {/* I'm Safe Now Button */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleMarkSafe}
            disabled={saving || isSafe}
            size="lg"
            variant="outline"
            className="flex-1 border-2 border-green-500 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-950"
            aria-busy={saving}
          >
            {saving ? (
              <>
                <span
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"
                  aria-hidden="true"
                />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" aria-hidden="true" />
                I&apos;m Safe Now
              </>
            )}
          </Button>
          <Button onClick={handleBack} variant="ghost" size="lg" className="sm:w-32">
            Go Back
          </Button>
        </div>

        {/* Additional Resources */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <p className="text-center text-xs text-muted-foreground">
              If you&apos;re experiencing a medical emergency, please call 911 or go to your nearest
              emergency room immediately.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

/**
 * Wrapped with ErrorBoundary to catch and handle rendering errors
 */
export default function RedZoneCheckIn() {
  return (
    <ErrorBoundary>
      <RedZoneCheckInContent />
    </ErrorBoundary>
  );
}
