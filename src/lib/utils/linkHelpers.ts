/**
 * Link Helpers
 *
 * Utilities for working with provider link slugs and fetching
 * provider configurations from the API.
 *
 * @module linkHelpers
 */

import { ProviderLinkConfig } from '@/lib/types';

/**
 * Regular expression pattern for valid slugs
 * Format: word-word-word (e.g., "green-mountain-trail")
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+){2,}$/;

/**
 * Checks if a string matches the slug format
 *
 * @param input - The string to validate
 * @returns true if the input is a valid slug format
 *
 * @example
 * ```typescript
 * isSlugFormat('green-mountain-trail') // true
 * isSlugFormat('abc-123-xyz') // true
 * isSlugFormat('invalid') // false
 * isSlugFormat('UPPERCASE-NOT-ALLOWED') // false
 * ```
 */
export function isSlugFormat(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  return SLUG_PATTERN.test(input.trim().toLowerCase());
}

/**
 * Result type for slug-based config fetching
 */
export type FetchConfigResult =
  | { success: true; config: ProviderLinkConfig }
  | { success: false; error: string; status?: number };

/**
 * Fetches a provider configuration from the API using a slug
 *
 * @param slug - The provider link slug
 * @returns Promise resolving to FetchConfigResult
 *
 * @example
 * ```typescript
 * const result = await fetchProviderConfigBySlug('green-mountain-trail');
 * if (result.success) {
 *   console.log('Provider:', result.config.provider.name);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export async function fetchProviderConfigBySlug(slug: string): Promise<FetchConfigResult> {
  try {
    // Validate slug format first
    if (!isSlugFormat(slug)) {
      return {
        success: false,
        error: 'Invalid access code format. Please check and try again.',
      };
    }

    // Fetch from API
    const response = await fetch(`/api/provider-link/${encodeURIComponent(slug)}`);

    // Handle non-OK responses
    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'Access code not found. Please check that you entered it correctly.',
          status: 404,
        };
      }

      if (response.status === 410) {
        const data = await response.json().catch(() => ({}));
        return {
          success: false,
          error: data.error || 'This link has expired or is no longer active.',
          status: 410,
        };
      }

      return {
        success: false,
        error: 'Failed to retrieve provider information. Please try again.',
        status: response.status,
      };
    }

    // Parse response
    const data = await response.json();

    // Validate response structure
    if (!data.config || !data.config.provider) {
      return {
        success: false,
        error: 'Invalid response from server. Please try again.',
      };
    }

    return {
      success: true,
      config: data.config,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Network error: ${error.message}`
          : 'Failed to connect to server. Please check your internet connection.',
    };
  }
}

/**
 * Stores provider config in sessionStorage temporarily during onboarding
 *
 * Note: Provider config is stored in sessionStorage (not localStorage) during the
 * onboarding process. It will only be persisted to localStorage when the user
 * completes onboarding in step 3.
 *
 * @param config - The provider link configuration to store
 */
export function storeProviderConfig(config: ProviderLinkConfig): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('providerConfig', JSON.stringify(config));
  }
}

/**
 * Retrieves provider config from sessionStorage
 *
 * Note: During onboarding, the config is stored in sessionStorage. After onboarding
 * completion, it's moved to localStorage by the onboarding step 3 component.
 *
 * @returns The stored provider configuration or null if not found
 */
export function getStoredProviderConfig(): ProviderLinkConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Check sessionStorage first (during onboarding)
    const sessionStored = sessionStorage.getItem('providerConfig');
    if (sessionStored) {
      const config = JSON.parse(sessionStored) as ProviderLinkConfig;
      if (config.provider?.id && config.provider?.name) {
        return config;
      }
    }

    // Fallback to localStorage (after onboarding completion)
    const localStored = localStorage.getItem('providerConfig');
    if (localStored) {
      const config = JSON.parse(localStored) as ProviderLinkConfig;
      if (config.provider?.id && config.provider?.name) {
        return config;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clears provider config from both sessionStorage and localStorage
 */
export function clearProviderConfig(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('providerConfig');
    localStorage.removeItem('providerConfig');
  }
}

/**
 * Clears all onboarding session data
 *
 * This removes all temporary data stored during the onboarding process:
 * - Provider configuration
 * - Preferred name
 * - Selected coping strategies
 * - Any other onboarding-related session data
 *
 * Used when user cancels the onboarding flow.
 */
export function clearOnboardingSession(): void {
  if (typeof window !== 'undefined') {
    // Clear provider config
    clearProviderConfig();

    // Clear onboarding-specific session data
    sessionStorage.removeItem('onboarding_preferredName');
    sessionStorage.removeItem('onboarding_selectedCopingStrategyIds');
    sessionStorage.removeItem('onboarding_selectedCopingStrategies');
  }
}
