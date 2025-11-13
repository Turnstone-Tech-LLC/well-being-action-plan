'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isProviderModeEnabled, revokeProviderMode as revokeMode } from '@/lib/utils/providerMode';

/**
 * Hook options for customizing behavior
 */
export interface UseProviderModeOptions {
  /**
   * Whether to redirect if provider mode is not enabled
   * @default true
   */
  redirectIfDisabled?: boolean;

  /**
   * Custom redirect path (overrides default)
   * @default '/'
   */
  redirectPath?: string;
}

/**
 * Hook return value
 */
export interface UseProviderModeReturn {
  /**
   * Whether provider mode check is in progress
   */
  loading: boolean;

  /**
   * Whether provider mode is currently enabled
   */
  isProviderMode: boolean;

  /**
   * Function to revoke provider mode and redirect
   */
  revokeProviderMode: () => void;
}

/**
 * Provider Mode Hook
 *
 * Provides client-side route protection for provider-only pages.
 * Checks if provider mode is enabled and redirects if necessary.
 *
 * This is separate from Supabase authentication. Provider mode is a prerequisite
 * to access provider routes, then Supabase auth protects actual functionality.
 *
 * Usage:
 * ```tsx
 * function ProviderPage() {
 *   const { loading, isProviderMode } = useProviderMode();
 *
 *   if (loading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   // Component will auto-redirect if provider mode not enabled
 *   return <ProviderContent />;
 * }
 * ```
 *
 * @param options - Configuration options
 * @returns UseProviderModeReturn - Provider mode state and utilities
 */
export function useProviderMode(options: UseProviderModeOptions = {}): UseProviderModeReturn {
  const { redirectIfDisabled = true, redirectPath = '/' } = options;
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [isProviderMode, setIsProviderMode] = useState(false);

  useEffect(() => {
    const checkProviderMode = async () => {
      try {
        setLoading(true);
        const enabled = isProviderModeEnabled();
        setIsProviderMode(enabled);

        // Redirect if provider mode is not enabled and we're on a provider route
        if (redirectIfDisabled && !enabled) {
          // Don't redirect if we're already on the redirect path
          if (pathname !== redirectPath) {
            router.push(redirectPath);
          }
        }
      } catch (error) {
        console.error('Error checking provider mode:', error);
        setIsProviderMode(false);

        // Redirect on error if redirectIfDisabled is true
        if (redirectIfDisabled && pathname !== redirectPath) {
          router.push(redirectPath);
        }
      } finally {
        setLoading(false);
      }
    };

    checkProviderMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Recheck when pathname changes

  const handleRevokeProviderMode = () => {
    try {
      revokeMode();
      setIsProviderMode(false);
      router.push(redirectPath);
    } catch (error) {
      console.error('Error revoking provider mode:', error);
    }
  };

  return {
    loading,
    isProviderMode,
    revokeProviderMode: handleRevokeProviderMode,
  };
}
