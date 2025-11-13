/**
 * Patient Authentication Utilities
 *
 * Provides client-side validation for patient onboarding completion.
 * Unlike provider authentication (Supabase), patient authentication is based
 * on local IndexedDB data to maintain privacy-first architecture.
 *
 * Patient data NEVER leaves the device - all validation is local-only.
 */

import { getUserConfig, getAllCopingStrategies } from '@/lib/db';

/**
 * Validation result for patient onboarding status
 */
export interface PatientOnboardingStatus {
  isComplete: boolean;
  hasPreferredName: boolean;
  hasOnboardingFlag: boolean;
  hasCopingStrategies: boolean;
  missingSteps: string[];
}

/**
 * Check if patient has completed the onboarding workflow
 *
 * Validates that the patient has:
 * 1. Set a preferred name
 * 2. Marked onboarding as complete
 * 3. Selected at least one coping strategy
 *
 * This function is used for client-side route protection to ensure
 * patients complete the initial setup before accessing the app.
 *
 * @param userId - User ID (default: 'patient')
 * @returns Promise<PatientOnboardingStatus> - Detailed onboarding status
 */
export async function checkPatientOnboarding(
  userId: string = 'patient'
): Promise<PatientOnboardingStatus> {
  const missingSteps: string[] = [];

  try {
    // Check 1: Preferred name is set
    const nameConfig = await getUserConfig(userId, 'preferredName');
    const hasPreferredName = !!(nameConfig && nameConfig.value);
    if (!hasPreferredName) {
      missingSteps.push('Set preferred name');
    }

    // Check 2: Onboarding completed flag is set
    const onboardingConfig = await getUserConfig(userId, 'onboardingCompleted');
    const hasOnboardingFlag = !!(onboardingConfig && onboardingConfig.value === true);
    if (!hasOnboardingFlag) {
      missingSteps.push('Complete onboarding workflow');
    }

    // Check 3: At least one coping strategy exists
    const strategies = await getAllCopingStrategies({ limit: 1 });
    const hasCopingStrategies = strategies.length > 0;
    if (!hasCopingStrategies) {
      missingSteps.push('Select coping strategies');
    }

    // All checks must pass for onboarding to be complete
    const isComplete = hasPreferredName && hasOnboardingFlag && hasCopingStrategies;

    return {
      isComplete,
      hasPreferredName,
      hasOnboardingFlag,
      hasCopingStrategies,
      missingSteps,
    };
  } catch (error) {
    console.error('Error checking patient onboarding status:', error);
    // If there's an error accessing IndexedDB, assume onboarding is not complete
    return {
      isComplete: false,
      hasPreferredName: false,
      hasOnboardingFlag: false,
      hasCopingStrategies: false,
      missingSteps: ['Database error - please try again'],
    };
  }
}

/**
 * Simple boolean check for onboarding completion
 *
 * Convenience wrapper around checkPatientOnboarding for cases where
 * you only need to know if onboarding is complete or not.
 *
 * @param userId - User ID (default: 'patient')
 * @returns Promise<boolean> - True if onboarding is complete
 */
export async function isPatientOnboardingComplete(userId: string = 'patient'): Promise<boolean> {
  const status = await checkPatientOnboarding(userId);
  return status.isComplete;
}

/**
 * Get the appropriate redirect path based on onboarding status
 *
 * Determines where to redirect a patient who hasn't completed onboarding.
 * Checks for provider config link in URL to preserve onboarding flow.
 *
 * @returns string - Path to redirect to (either '/' or '/onboarding')
 */
export function getOnboardingRedirectPath(): string {
  // Check if there's a provider config link in the URL
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    const hasProviderLink = searchParams.has('config');

    // If there's a provider link, redirect to home page which will handle the config
    // Otherwise, redirect to onboarding start
    return hasProviderLink ? '/' : '/onboarding';
  }

  // Default to onboarding if window is not available (SSR)
  return '/onboarding';
}
