'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';
import { AlertCircle, Building2, Mail, Phone, Globe, X } from 'lucide-react';
import type { ProviderLinkConfig } from '@/lib/types/provider';
import { getStoredProviderConfig, clearOnboardingSession } from '@/lib/utils/linkHelpers';
import { isProviderModeEnabled } from '@/lib/utils/providerMode';

/**
 * Onboarding Step 1: Collect patient's preferred name
 *
 * Features:
 * - Youth-friendly welcoming copy
 * - Name input with validation
 * - Data persistence to IndexedDB
 * - Progress tracking (Step 1 of 3)
 * - Navigation to Step 2
 * - Validates presence of provider access code
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasValidConfig, setHasValidConfig] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [providerInfo, setProviderInfo] = useState<ProviderLinkConfig['provider'] | null>(null);

  /**
   * Check for provider config on mount
   */
  useEffect(() => {
    const checkProviderConfig = () => {
      try {
        // Check if in provider mode - redirect to provider portal
        if (isProviderModeEnabled()) {
          router.push('/provider?error=cannot_access_patient_onboarding');
          return;
        }

        // Check if config exists in localStorage
        const storedConfig = getStoredProviderConfig();
        if (storedConfig) {
          setProviderInfo(storedConfig.provider);
          setHasValidConfig(true);
        } else {
          setHasValidConfig(false);
        }
      } catch (err) {
        console.error('Error checking provider config:', err);
        setHasValidConfig(false);
      } finally {
        setCheckingConfig(false);
      }
    };

    checkProviderConfig();
  }, [router]);

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

      // Store name in sessionStorage (don't write to IndexedDB yet)
      // This data will be saved to IndexedDB only when onboarding is completed
      sessionStorage.setItem('onboarding_preferredName', trimmedName);

      // Navigate to step 2
      router.push('/onboarding/step-2');
    } catch (err) {
      console.error('Failed to save name:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  /**
   * Cancel onboarding and return to home page
   * Clears all onboarding session data including provider config
   */
  const handleCancel = () => {
    clearOnboardingSession();
    router.push('/');
  };

  // Show loading state while checking config
  if (checkingConfig) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-morning-fog to-[#F0F8FF] p-4 dark:from-gray-900 dark:to-gray-800 md:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-catamount-green" />
          <p className="text-vermont-slate">Checking configuration...</p>
        </div>
      </main>
    );
  }

  // Show error if no valid config
  if (!hasValidConfig) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-morning-fog to-[#F0F8FF] p-4 dark:from-gray-900 dark:to-gray-800 md:p-8">
        <div className="w-full max-w-md">
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-destructive">Access Code Required</CardTitle>
              </div>
              <CardDescription>
                You need a valid provider access code to start onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please return to the home page and enter your access code, or contact your mental
                health provider to get one.
              </p>
              <Button onClick={() => router.push('/')} className="w-full">
                Go to Home Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-morning-fog to-[#F0F8FF] p-4 dark:from-gray-900 dark:to-gray-800 md:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* UVM Branding Header */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-catamount-green">Well-Being Action Plan</h2>
          <p className="text-xs text-vermont-slate">
            Developed in collaboration with The University of Vermont Children&apos;s Hospital
          </p>
        </div>

        {/* Progress indicator */}
        <ProgressIndicator currentStep={1} totalSteps={3} />

        {/* Provider Info Card (if available) */}
        {providerInfo && (
          <Card className="border-catamount-green/20 bg-catamount-green/5">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-1 h-5 w-5 flex-shrink-0 text-catamount-green" />
                  <div className="flex-1">
                    <p className="font-semibold text-vermont-slate">{providerInfo.name}</p>
                    {providerInfo.organization && (
                      <p className="text-sm text-muted-foreground">{providerInfo.organization}</p>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                {providerInfo.contactInfo && (
                  <div className="space-y-2 border-t border-catamount-green/10 pt-3">
                    {providerInfo.contactInfo.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${providerInfo.contactInfo.email}`}
                          className="text-clear-sky hover:underline"
                        >
                          {providerInfo.contactInfo.email}
                        </a>
                      </div>
                    )}
                    {providerInfo.contactInfo.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${providerInfo.contactInfo.phone}`}
                          className="text-clear-sky hover:underline"
                        >
                          {providerInfo.contactInfo.phone}
                        </a>
                      </div>
                    )}
                    {providerInfo.contactInfo.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={providerInfo.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-clear-sky hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-center text-3xl">Welcome! 👋</CardTitle>
                <CardDescription className="text-center text-base">
                  We&apos;re glad you&apos;re here. Let&apos;s get started by learning a bit about
                  you.
                </CardDescription>
              </div>
              <button
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Cancel onboarding"
                title="Cancel and return to home"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
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
