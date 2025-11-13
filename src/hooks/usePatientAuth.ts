/**
 * Patient Authentication Hook
 *
 * Provides client-side route protection for patient-facing pages.
 * Checks if patient has completed onboarding and redirects if necessary.
 *
 * This is separate from provider authentication (Supabase) and uses
 * local IndexedDB validation to maintain privacy-first architecture.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  checkPatientOnboarding,
  getOnboardingRedirectPath,
  type PatientOnboardingStatus,
} from '@/lib/utils/patientAuth';
import { isProviderModeEnabled } from '@/lib/utils/providerMode';

/**
 * Hook options for customizing behavior
 */
export interface UsePatientAuthOptions {
  /**
   * Whether to redirect if onboarding is not complete
   * @default true
   */
  redirectIfIncomplete?: boolean;

  /**
   * Custom redirect path (overrides default logic)
   */
  redirectPath?: string;

  /**
   * User ID to check (default: 'patient')
   */
  userId?: string;
}

/**
 * Hook return value
 */
export interface UsePatientAuthReturn {
  /**
   * Whether onboarding check is in progress
   */
  loading: boolean;

  /**
   * Whether patient has completed onboarding
   */
  isOnboardingComplete: boolean;

  /**
   * Detailed onboarding status
   */
  status: PatientOnboardingStatus | null;

  /**
   * Function to manually recheck onboarding status
   */
  recheckOnboarding: () => Promise<void>;
}

/**
 * Patient authentication hook for route protection
 *
 * Usage:
 * ```tsx
 * function DashboardPage() {
 *   const { loading, isOnboardingComplete } = usePatientAuth();
 *
 *   if (loading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   // Component will auto-redirect if onboarding not complete
 *   return <Dashboard />;
 * }
 * ```
 *
 * @param options - Configuration options
 * @returns UsePatientAuthReturn - Auth state and utilities
 */
export function usePatientAuth(options: UsePatientAuthOptions = {}): UsePatientAuthReturn {
  const { redirectIfIncomplete = true, redirectPath, userId = 'patient' } = options;

  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PatientOnboardingStatus | null>(null);

  const checkOnboarding = async () => {
    try {
      setLoading(true);

      // Check if in provider mode - patient routes should be blocked
      if (isProviderModeEnabled()) {
        const isOnProviderPage = pathname?.startsWith('/provider');
        // If not on provider page, redirect to provider portal
        if (!isOnProviderPage) {
          router.push('/provider?error=cannot_access_patient_routes');
          return;
        }
      }

      const onboardingStatus = await checkPatientOnboarding(userId);
      setStatus(onboardingStatus);

      // Redirect if onboarding is not complete and we're not already on an allowed page
      if (redirectIfIncomplete && !onboardingStatus.isComplete) {
        // Don't redirect if we're already on onboarding pages or home page
        const isOnOnboardingPage = pathname?.startsWith('/onboarding');
        const isOnHomePage = pathname === '/';
        const isOnProviderPage = pathname?.startsWith('/provider');

        if (!isOnOnboardingPage && !isOnHomePage && !isOnProviderPage) {
          const targetPath = redirectPath || getOnboardingRedirectPath();
          router.push(targetPath);
        }
      }
    } catch (error) {
      console.error('Error checking patient onboarding:', error);
      // On error, assume onboarding is not complete
      setStatus({
        isComplete: false,
        hasPreferredName: false,
        hasOnboardingFlag: false,
        hasCopingStrategies: false,
        missingSteps: ['Error checking onboarding status'],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Recheck when pathname changes

  return {
    loading,
    isOnboardingComplete: status?.isComplete ?? false,
    status,
    recheckOnboarding: checkOnboarding,
  };
}
