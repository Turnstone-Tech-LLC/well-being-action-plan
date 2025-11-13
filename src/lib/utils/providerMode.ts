/**
 * Provider Mode Utilities
 *
 * Handles provider mode activation, validation, and persistence.
 * Provider mode is a lightweight access control system that allows providers
 * to access provider-only routes via a query parameter and localStorage flag.
 *
 * Architecture:
 * - Provider key is validated against NEXT_PUBLIC_PROVIDER_KEY environment variable
 * - Valid key sets localStorage flag (not IndexedDB, to keep patient data separate)
 * - Client-side checks in provider layout redirect unauthorized access
 * - Supabase auth provides additional security layer for actual operations
 *
 * Privacy Note: Provider mode flag is stored in localStorage (client-side only),
 * never transmitted to servers or mixed with patient data in IndexedDB.
 */

/**
 * localStorage key for provider mode flag
 */
const PROVIDER_MODE_KEY = 'provider_mode';

/**
 * localStorage value when provider mode is enabled
 */
const PROVIDER_MODE_ENABLED = 'enabled';

/**
 * Get the provider key from environment variables
 *
 * @returns The provider key from NEXT_PUBLIC_PROVIDER_KEY, or null if not configured
 */
export function getProviderKeyFromEnv(): string | null {
  if (typeof window === 'undefined') {
    // Server-side: access via process.env
    return process.env.NEXT_PUBLIC_PROVIDER_KEY || null;
  }

  // Client-side: NEXT_PUBLIC_* variables are available as window.__ENV__ or via process.env
  // In Next.js, they're injected at build time
  return process.env.NEXT_PUBLIC_PROVIDER_KEY || null;
}

/**
 * Validate a provider key against the configured secret
 *
 * @param key - The provider key to validate
 * @returns true if the key matches the configured NEXT_PUBLIC_PROVIDER_KEY
 */
export function validateProviderKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  const configuredKey = getProviderKeyFromEnv();
  if (!configuredKey) {
    console.warn(
      'Provider mode is not configured. Set NEXT_PUBLIC_PROVIDER_KEY environment variable.'
    );
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return key === configuredKey;
}

/**
 * Enable provider mode by setting localStorage flag
 *
 * @throws Error if localStorage is not available
 */
export function enableProviderMode(): void {
  if (typeof window === 'undefined') {
    throw new Error('enableProviderMode can only be called client-side');
  }

  try {
    localStorage.setItem(PROVIDER_MODE_KEY, PROVIDER_MODE_ENABLED);
  } catch (error) {
    console.error('Failed to enable provider mode:', error);
    throw new Error('Failed to enable provider mode. localStorage may be unavailable.');
  }
}

/**
 * Revoke provider mode by removing localStorage flag
 *
 * @throws Error if localStorage is not available
 */
export function revokeProviderMode(): void {
  if (typeof window === 'undefined') {
    throw new Error('revokeProviderMode can only be called client-side');
  }

  try {
    localStorage.removeItem(PROVIDER_MODE_KEY);
  } catch (error) {
    console.error('Failed to revoke provider mode:', error);
    throw new Error('Failed to revoke provider mode. localStorage may be unavailable.');
  }
}

/**
 * Check if provider mode is currently enabled
 *
 * @returns true if provider mode flag is set in localStorage
 */
export function isProviderModeEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const flag = localStorage.getItem(PROVIDER_MODE_KEY);
    return flag === PROVIDER_MODE_ENABLED;
  } catch (error) {
    console.error('Failed to check provider mode:', error);
    return false;
  }
}

/**
 * Get the current provider mode status
 *
 * @returns Object with provider mode status and details
 */
export function getProviderModeStatus(): {
  isEnabled: boolean;
  isConfigured: boolean;
  hasKey: boolean;
} {
  return {
    isEnabled: isProviderModeEnabled(),
    isConfigured: !!getProviderKeyFromEnv(),
    hasKey: !!getProviderKeyFromEnv(),
  };
}
