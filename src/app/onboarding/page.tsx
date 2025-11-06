'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';
import { setUserConfig } from '@/lib/db';

/**
 * Onboarding Step 1: Collect patient's preferred name
 *
 * Features:
 * - Youth-friendly welcoming copy
 * - Name input with validation
 * - Data persistence to IndexedDB
 * - Progress tracking (Step 1 of 3)
 * - Navigation to Step 2
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validates and saves the patient's name
   * Navigates to step 2 on success
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation: name is required
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    try {
      setIsLoading(true);

      // Save name to IndexedDB
      // Using 'patient' as default userId for now since we're in a single-user context
      await setUserConfig('patient', 'preferredName', trimmedName);

      // Navigate to step 2
      // TODO: Update this path when step 2 is implemented
      router.push('/onboarding/step-2');
    } catch (err) {
      console.error('Failed to save name:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<React.ElementRef<'input'>>) => {
    setName(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Progress indicator */}
        <ProgressIndicator currentStep={1} totalSteps={3} />

        {/* Welcome card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-3xl">Welcome! 👋</CardTitle>
            <CardDescription className="text-center text-base">
              We&apos;re glad you&apos;re here. Let&apos;s get started by learning a bit about you.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name input field */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  What should we call you?
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={handleNameChange}
                  disabled={isLoading}
                  className={error ? 'border-destructive' : ''}
                  autoComplete="given-name"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'name-error' : undefined}
                />
                {error && (
                  <p id="name-error" className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  This is just for us - use whatever name you&apos;re most comfortable with!
                </p>
              </div>

              {/* Submit button */}
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Next'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Supportive footer message */}
        <p className="text-center text-sm text-muted-foreground">
          This well-being plan is yours - we&apos;re here to support you every step of the way.
        </p>
      </div>
    </main>
  );
}
