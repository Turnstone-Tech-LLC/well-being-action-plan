'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';

/**
 * Onboarding Step 2: Placeholder
 *
 * TODO: Implement step 2 of the onboarding flow
 * This is a placeholder page to allow navigation from step 1
 */
export default function OnboardingStep2Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-6">
        <ProgressIndicator currentStep={2} totalSteps={3} />

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Step 2</CardTitle>
            <CardDescription className="text-center">
              Coming soon! This step will be implemented next.
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center text-sm text-muted-foreground">
            <p>Onboarding step 2 is under construction.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
