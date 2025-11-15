/**
 * Root Providers Component
 *
 * Wraps the entire application with necessary providers including
 * error boundaries for graceful error handling.
 */

'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface RootProvidersProps {
  children: ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Could send to error tracking service here
        console.error('Root error boundary caught:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Route-level error boundary wrapper
 * Use this to wrap individual routes for isolated error handling
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      isolate
      resetOnPropsChange
      fallback={
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="text-center">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Unable to load this section
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please try refreshing the page or navigating to a different section.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Component-level error boundary wrapper
 * Use this for individual components that might fail independently
 */
export function ComponentErrorBoundary({
  children,
  componentName = 'Component',
}: {
  children: ReactNode;
  componentName?: string;
}) {
  return (
    <ErrorBoundary
      isolate
      resetOnPropsChange
      fallback={
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {componentName} is temporarily unavailable
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
