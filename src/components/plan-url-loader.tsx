'use client';

/* eslint-disable no-console */

/**
 * PlanUrlLoader Component
 *
 * A client-side component that automatically detects and loads plan configurations
 * from URL parameters when the component mounts. This enables sharing of plans
 * via URLs.
 *
 * @example
 * ```tsx
 * // Add to your root layout or main page:
 * import { PlanUrlLoader } from '@/components/plan-url-loader';
 *
 * export default function Page() {
 *   const handlePlanLoaded = (config) => {
 *     console.log("Loaded plan:", config);
 *     // Apply the configuration to your app state
 *   };
 *
 *   return (
 *     <>
 *       <PlanUrlLoader onPlanLoaded={handlePlanLoaded} />
 *       <YourMainContent />
 *     </>
 *   );
 * }
 * ```
 */

import { useEffect, useState } from 'react';
import { extractConfigFromCurrentUrl, type ShareablePlanConfig } from '@/lib/utils/urlConfig';

export interface PlanUrlLoaderProps {
  /**
   * Callback function called when a plan is successfully loaded from URL
   * @param config - The decoded plan configuration
   */
  onPlanLoaded?: (config: ShareablePlanConfig) => void;

  /**
   * Callback function called when plan loading fails
   * @param error - Error message describing what went wrong
   */
  onError?: (error: string) => void;

  /**
   * Whether to automatically remove the plan parameter from URL after loading
   * This prevents the plan from being loaded again on page refresh
   * @default true
   */
  clearUrlAfterLoad?: boolean;

  /**
   * Whether to show console logs for debugging
   * @default false
   */
  debug?: boolean;
}

/**
 * Component that handles loading plan configurations from URL parameters
 */
export function PlanUrlLoader({
  onPlanLoaded,
  onError,
  clearUrlAfterLoad = true,
  debug = false,
}: PlanUrlLoaderProps) {
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  useEffect(() => {
    // Only run once on mount
    if (loadStatus !== 'idle') return;

    // Use async IIFE to handle async operations in useEffect
    const loadPlan = async () => {
      setLoadStatus('loading');

      if (debug) {
        console.log('[PlanUrlLoader] Checking URL for plan configuration...');
      }

      // Extract plan from URL
      const result = await extractConfigFromCurrentUrl();

      if (result.success) {
        if (debug) {
          console.log('[PlanUrlLoader] Successfully loaded plan:', result.data);
        }

        setLoadStatus('loaded');

        // Notify parent component
        onPlanLoaded?.(result.data);

        // Clear URL parameter if requested
        if (clearUrlAfterLoad && typeof window !== 'undefined') {
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('plan');
            window.history.replaceState({}, '', url.toString());

            if (debug) {
              console.log('[PlanUrlLoader] Cleared plan parameter from URL');
            }
          } catch (error) {
            console.error('[PlanUrlLoader] Failed to clear URL parameter:', error);
          }
        }
      } else {
        // Only treat as error if there was actually a plan parameter that failed to decode
        // If there's no plan parameter, this is normal and not an error
        const urlHasPlanParam =
          typeof window !== 'undefined' && new URL(window.location.href).searchParams.has('plan');

        if (urlHasPlanParam) {
          if (debug) {
            console.error('[PlanUrlLoader] Failed to load plan:', result.error);
          }

          setLoadStatus('error');
          onError?.(result.error);
        } else {
          if (debug) {
            console.log('[PlanUrlLoader] No plan parameter found in URL');
          }
          setLoadStatus('idle');
        }
      }
    };

    loadPlan();
  }, [loadStatus, onPlanLoaded, onError, clearUrlAfterLoad, debug]);

  // This component doesn't render anything
  return null;
}

/**
 * Hook for loading plan configurations from URLs
 * Provides more control than the component for advanced use cases
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { loadedPlan, error, isLoading } = usePlanFromUrl();
 *
 *   if (isLoading) return <div>Loading plan...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (loadedPlan) return <div>Loaded: {loadedPlan.title}</div>;
 *   return <div>No plan in URL</div>;
 * }
 * ```
 */
export function usePlanFromUrl(options?: { clearUrlAfterLoad?: boolean; autoLoad?: boolean }) {
  const { clearUrlAfterLoad = true, autoLoad = true } = options || {};

  const [loadedPlan, setLoadedPlan] = useState<ShareablePlanConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(autoLoad);

  useEffect(() => {
    if (!autoLoad) return;

    // Use async IIFE to handle async operations in useEffect
    const loadPlan = async () => {
      const result = await extractConfigFromCurrentUrl();

      if (result.success) {
        setLoadedPlan(result.data);
        setError(null);

        // Clear URL parameter if requested
        if (clearUrlAfterLoad && typeof window !== 'undefined') {
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('plan');
            window.history.replaceState({}, '', url.toString());
          } catch (err) {
            console.error('Failed to clear URL parameter:', err);
          }
        }
      } else {
        // Only set error if there was actually a plan parameter
        const urlHasPlanParam =
          typeof window !== 'undefined' && new URL(window.location.href).searchParams.has('plan');

        if (urlHasPlanParam) {
          setError(result.error);
        }
      }

      setIsLoading(false);
    };

    loadPlan();
  }, [autoLoad, clearUrlAfterLoad]);

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    setLoadedPlan(null);

    const result = await extractConfigFromCurrentUrl();

    if (result.success) {
      setLoadedPlan(result.data);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return {
    loadedPlan,
    error,
    isLoading,
    reload,
  };
}
