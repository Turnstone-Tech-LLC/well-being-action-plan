'use client';

import { useRouter } from 'next/navigation';
import { ZoneType } from '@/lib/types/zone';
import { ZoneCard } from '@/components/zone-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePatientAuth } from '@/hooks/usePatientAuth';

/**
 * Zone Selection Interface
 *
 * Primary check-in interface allowing patients to select their current wellbeing zone.
 * Features three large, interactive zone cards with clear visual differentiation
 * using the traffic light metaphor (Green/Yellow/Red).
 *
 * Accessibility:
 * - Touch targets meet 44x44 pixel minimum standards
 * - Color palette accommodates colorblind users
 * - Clear descriptive labels for each zone
 * - Responsive design for mobile and desktop
 *
 * Protected Route: Requires completed onboarding
 */
export default function CheckInPage() {
  const router = useRouter();
  // Patient authentication - redirects to onboarding if not complete
  const { loading: authLoading, isOnboardingComplete } = usePatientAuth();

  const handleZoneSelect = (zone: ZoneType) => {
    router.push(`/check-in/${zone}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  // If onboarding is not complete, the usePatientAuth hook will redirect
  if (!isOnboardingComplete) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 py-12">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                aria-label="Go back to home"
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <CardTitle className="text-2xl">How are you feeling today?</CardTitle>
                <CardDescription className="mt-1">
                  Select the zone that best describes your current emotional state
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Zone Cards */}
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
          {/* Green Zone */}
          <div
            onClick={() => handleZoneSelect(ZoneType.Green)}
            className="cursor-pointer transition-transform focus-within:scale-105 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:scale-105"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleZoneSelect(ZoneType.Green);
              }
            }}
            aria-label="Select Green Zone - Feeling good, stable emotional state"
          >
            <ZoneCard
              zone={ZoneType.Green}
              description="I'm doing well and feeling stable"
              className="h-full min-h-[200px] border-2"
            />
          </div>

          {/* Yellow Zone */}
          <div
            onClick={() => handleZoneSelect(ZoneType.Yellow)}
            className="cursor-pointer transition-transform focus-within:scale-105 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:scale-105"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleZoneSelect(ZoneType.Yellow);
              }
            }}
            aria-label="Select Yellow Zone - Struggling, warning signs present"
          >
            <ZoneCard
              zone={ZoneType.Yellow}
              description="I'm struggling and could use some support"
              className="h-full min-h-[200px] border-2"
            />
          </div>

          {/* Red Zone */}
          <div
            onClick={() => handleZoneSelect(ZoneType.Red)}
            className="cursor-pointer transition-transform focus-within:scale-105 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:scale-105"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleZoneSelect(ZoneType.Red);
              }
            }}
            aria-label="Select Red Zone - Crisis state, immediate support needed"
          >
            <ZoneCard
              zone={ZoneType.Red}
              description="I need immediate support and resources"
              className="h-full min-h-[200px] border-2"
            />
          </div>
        </div>

        {/* Help Text */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Your check-in is private and stored locally on your device. Select the zone that
              matches how you&apos;re feeling right now - there are no wrong answers.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
