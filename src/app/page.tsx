'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parseProviderUrl, parseAccessCode, decodeProviderConfig } from '@/lib/utils';
import { ProviderLinkConfig } from '@/lib/types';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { getUserConfig } from '@/lib/db';
import { WelcomeScreen } from '@/components/welcome-screen';
import { ImportDataDialog } from '@/components/import-data-dialog';

/**
 * Landing page component with provider link detection
 *
 * This component handles:
 * - Redirecting returning patients to their dashboard
 * - URL parameter parsing for provider-generated access codes
 * - Welcome screen for new patients without access codes
 * - Data import functionality for returning users
 * - Customized welcome messages with provider-specific content
 * - Loading states during configuration parsing
 * - Error handling for invalid or missing links
 * - Responsive design for mobile compatibility
 */
export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ProviderLinkConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    checkOnboardingAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkOnboardingAndRedirect = async () => {
    try {
      // Check if user has completed onboarding (active session)
      const onboardingConfig = await getUserConfig('patient', 'onboardingCompleted');
      const hasActiveSession = onboardingConfig && onboardingConfig.value === true;

      // Get URL search params
      const searchParams = new URLSearchParams(window.location.search);

      // Check for access code in URL (supports both 'access_code' and 'config' params)
      const accessCode = parseAccessCode(searchParams);
      const hasAccessCode = !!accessCode;

      // If there's an access code, try to parse it
      if (hasAccessCode) {
        // If user already has an active session, redirect to dashboard with message
        if (hasActiveSession) {
          router.push('/dashboard?message=session_exists');
          return;
        }

        // Parse the access code
        const result = parseProviderUrl(searchParams);

        if (result.success && result.config) {
          setConfig(result.config);
          setError(null);
          setShowWelcomeScreen(false);
        } else {
          // Invalid access code
          setError(result.error || 'Invalid access code');
          setConfig(null);
          setShowWelcomeScreen(false);
        }
      } else {
        // No access code in URL
        if (hasActiveSession) {
          // User has completed onboarding and is just visiting the home page
          router.push('/dashboard');
          return;
        }

        // New user without access code - show welcome screen
        setShowWelcomeScreen(true);
        setConfig(null);
        setError(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    // Store provider config to localStorage for persistence across onboarding
    if (config) {
      localStorage.setItem('providerConfig', JSON.stringify(config));
    }

    // Navigate to onboarding flow
    router.push('/onboarding');
  };

  const handleAccessCodeSubmit = async (accessCode: string) => {
    setLoading(true);
    setError(null);

    try {
      // Try to decode the access code
      const providerConfig = decodeProviderConfig(accessCode);

      // If successful, set config and show the provider welcome view
      setConfig(providerConfig);
      setShowWelcomeScreen(false);
      setLoading(false);
    } catch (err) {
      // Invalid access code
      setError(err instanceof Error ? err.message : 'Invalid access code');
      setLoading(false);
    }
  };

  const handleImportData = () => {
    setShowImportDialog(true);
  };

  const handleImportSuccess = () => {
    // After successful import, redirect to dashboard
    router.push('/dashboard');
  };

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading configuration...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Show welcome screen for new users without access code
  if (showWelcomeScreen) {
    return (
      <>
        <WelcomeScreen
          onAccessCodeSubmit={handleAccessCodeSubmit}
          onImportData={handleImportData}
          loading={loading}
          error={error}
        />
        <ImportDataDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImportSuccess={handleImportSuccess}
        />
      </>
    );
  }

  // Error state - invalid access code
  if (error && !showWelcomeScreen) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Invalid Access Code</CardTitle>
            </div>
            <CardDescription>We couldn&apos;t validate the access code provided.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">What to do:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Check that you copied the complete URL from your provider</li>
                <li>Make sure the access code hasn&apos;t been modified</li>
                <li>Contact your mental health provider for a new access code</li>
              </ul>
            </div>
            <Button onClick={() => router.push('/')} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Config is null but no error and not showing welcome screen - shouldn't happen
  if (!config) {
    return null;
  }

  // Success state - valid provider link detected
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      {/* UVM Branding Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-catamount-green">Well-Being Action Plan</h1>
        <p className="mt-2 text-sm text-vermont-slate">
          Developed in collaboration with The University of Vermont Children's Hospital
        </p>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-zone dark:text-[#7FD4B8]" />
            <CardTitle>Welcome to Your Well-Being Action Plan</CardTitle>
          </div>
          <CardDescription>
            {config.customMessage ||
              `You've been invited by ${config.provider.name} to create your personalized mental health support plan.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Information */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="mb-2 text-sm font-semibold">Your Provider</h3>
            <div className="space-y-1">
              <p className="text-base font-medium">{config.provider.name}</p>
              {config.provider.organization && (
                <p className="text-sm text-muted-foreground">{config.provider.organization}</p>
              )}
              {config.provider.contactInfo && (
                <div className="mt-3 space-y-1 border-t pt-2">
                  {config.provider.contactInfo.phone && (
                    <p className="text-sm text-muted-foreground">
                      Phone: {config.provider.contactInfo.phone}
                    </p>
                  )}
                  {config.provider.contactInfo.email && (
                    <p className="text-sm text-muted-foreground">
                      Email: {config.provider.contactInfo.email}
                    </p>
                  )}
                  {config.provider.contactInfo.website && (
                    <p className="text-sm text-muted-foreground">
                      Website:{' '}
                      <a
                        href={config.provider.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {config.provider.contactInfo.website}
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* What's Next */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">What&apos;s Next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  1
                </span>
                <span>Create your personalized well-being action plan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  2
                </span>
                <span>Identify your coping strategies for different emotional states</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  3
                </span>
                <span>Track your mental health journey with regular check-ins</span>
              </li>
            </ul>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button onClick={handleGetStarted} size="lg" className="flex-1">
              Get Started
            </Button>
            <Button variant="outline" size="lg" className="flex-1" asChild>
              <a
                href="https://github.com/Turnstone-Tech-LLC/well-being-action-plan"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn More
              </a>
            </Button>
          </div>

          {/* Privacy Notice */}
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium">Privacy First</p>
            <p className="mt-1">
              Your mental health data stays private on your device. We use local storage only and
              never send your personal information to external servers.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
