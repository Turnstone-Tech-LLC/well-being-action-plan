'use client';

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child components and displays a fallback UI
 * instead of crashing the entire application.
 */

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { handleReactError } from '@/lib/errors/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean; // If true, only shows error UI without affecting siblings
  showDetails?: boolean; // If true, shows error details in development
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
    this.previousResetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    const stackInfo = { componentStack: errorInfo.componentStack || '' };
    handleReactError(error, stackInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Auto-reset after 10 seconds if error count is low
    if (this.state.errorCount < 3) {
      this.resetTimeoutId = setTimeout(() => {
        this.reset();
      }, 10000);
    }
  }

  override componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;

    // Reset on props change if enabled
    if (resetOnPropsChange && prevProps.children !== this.props.children) {
      this.reset();
      return;
    }

    // Reset if resetKeys changed
    if (resetKeys && this.previousResetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== this.previousResetKeys[index]
      );
      if (hasResetKeyChanged) {
        this.reset();
        this.previousResetKeys = resetKeys;
      }
    }
  }

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  reset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      // Don't reset errorCount to prevent infinite loops
    });
  };

  handleReset = () => {
    this.reset();
  };

  handleGoHome = () => {
    this.reset();
    window.location.href = '/';
  };

  override render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback, isolate, showDetails } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI
      const errorUI = (
        <Card className="mx-auto max-w-md border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle
                className="h-6 w-6 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
            </div>
            <CardTitle className="text-xl text-red-900 dark:text-red-100">
              Oops! Something went wrong
            </CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              {errorCount >= 3
                ? "We're having trouble recovering. Please refresh the page."
                : "Don't worry, your data is safe. We'll try to recover automatically."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error details in development */}
            {showDetails && process.env.NODE_ENV === 'development' && error && (
              <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/50">
                <p className="mb-1 text-sm font-medium text-red-900 dark:text-red-100">
                  Error Details:
                </p>
                <p className="font-mono text-xs text-red-800 dark:text-red-200">{error.message}</p>
                {errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-red-700 dark:text-red-300">
                      Component Stack
                    </summary>
                    <pre className="mt-1 overflow-x-auto text-xs text-red-700 dark:text-red-300">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={this.handleReset}
                className="w-full"
                variant="outline"
                aria-label="Try again"
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="w-full"
                variant="outline"
                aria-label="Go to home page"
              >
                <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                Go to Home
              </Button>
            </div>

            {/* Auto-recovery message */}
            {errorCount < 3 && (
              <p
                className="text-center text-xs text-red-600 dark:text-red-400"
                role="status"
                aria-live="polite"
              >
                Attempting to recover automatically in a few seconds...
              </p>
            )}
          </CardContent>
        </Card>
      );

      // If isolate is true, return error UI without affecting layout
      if (isolate) {
        return <div className="contents">{errorUI}</div>;
      }

      // Full page error UI
      return (
        <div
          className="flex min-h-screen items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          {errorUI}
        </div>
      );
    }

    // No error, render children normally
    return children;
  }
}

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// /**
//  * Hook to trigger error boundary (for testing)
//  */
// export function useErrorHandler() {
//   const [error, setError] = useState<Error | null>(null);

//   useEffect(() => {
//     if (error) {
//       throw error;
//     }
//   }, [error]);

//   return setError;
// }
