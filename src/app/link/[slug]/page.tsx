/**
 * Public Provider Link Handler
 *
 * This page handles patient access to provider-generated onboarding links.
 * It fetches the provider configuration from the API and redirects to onboarding.
 *
 * Flow:
 * 1. Patient visits /link/[slug]
 * 2. Page fetches provider config from /api/provider-link/[slug]
 * 3. Config is stored in sessionStorage
 * 4. Patient is redirected to /onboarding
 * 5. Onboarding flow uses the stored config
 *
 * Error Handling:
 * - Provider mode: Cannot access patient links while in provider mode
 * - 404: Link not found
 * - 410: Link expired or inactive
 * - 500: Server error
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Home } from 'lucide-react';
import { isProviderModeEnabled } from '@/lib/utils/providerMode';

interface LinkError {
  status: number;
  message: string;
  description: string;
}

export default function LinkPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [error, setError] = useState<LinkError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        setLoading(true);

        // Check if in provider mode - providers cannot access patient onboarding links
        if (isProviderModeEnabled()) {
          setError({
            status: 403,
            message: 'Cannot Access Patient Link',
            description:
              'You are currently in provider mode. Patient onboarding links cannot be accessed while in provider mode. Please exit provider mode to continue.',
          });
          // Redirect to provider dashboard after a short delay
          setTimeout(() => {
            router.push('/provider?error=cannot_access_patient_link_in_provider_mode');
          }, 3000);
          return;
        }

        // Fetch provider config from API
        const response = await fetch(`/api/provider-link/${slug}`);

        if (!response.ok) {
          const data = await response.json();

          // Handle different error statuses
          if (response.status === 404) {
            setError({
              status: 404,
              message: 'Link Not Found',
              description:
                'This provider link does not exist. Please check the link and try again.',
            });
          } else if (response.status === 410) {
            setError({
              status: 410,
              message: 'Link Expired or Inactive',
              description:
                'This provider link has expired or been deactivated. Please contact your provider for a new link.',
            });
          } else {
            setError({
              status: response.status,
              message: 'Error Loading Link',
              description: data.error || 'An unexpected error occurred. Please try again.',
            });
          }
          return;
        }

        const { config } = await response.json();

        // Store config in sessionStorage temporarily (not localStorage yet)
        // It will be moved to localStorage only when onboarding completes in step 3
        sessionStorage.setItem('providerConfig', JSON.stringify(config));

        // Redirect to onboarding
        router.push('/onboarding');
      } catch (err) {
        console.error('Error fetching provider link:', err);
        setError({
          status: 500,
          message: 'Connection Error',
          description:
            'Failed to connect to the server. Please check your internet connection and try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchAndRedirect();
    }
  }, [slug, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-sm text-muted-foreground">
              Loading your provider link...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {error.message}
            </CardTitle>
            <CardDescription>{error.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error.status === 403 && (
              <>
                <p className="text-xs text-muted-foreground">
                  Error Code: {error.status} - Provider mode active
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to provider dashboard...
                </p>
              </>
            )}
            {error.status === 404 && (
              <p className="text-xs text-muted-foreground">
                Error Code: {error.status} - Link not found
              </p>
            )}
            {error.status === 410 && (
              <p className="text-xs text-muted-foreground">
                Error Code: {error.status} - Link expired or inactive
              </p>
            )}
            {error.status === 500 && (
              <p className="text-xs text-muted-foreground">
                Error Code: {error.status} - Server error
              </p>
            )}

            {error.status !== 403 && (
              <Button onClick={() => router.push('/')} className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
