'use client';

/**
 * Error Handling System
 *
 * Centralized error handling, logging, and user-friendly error messages.
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/**
 * Error categories for better organization
 */
export enum ErrorCategory {
  Auth = 'auth',
  Database = 'database',
  Network = 'network',
  Validation = 'validation',
  Permission = 'permission',
  NotFound = 'not_found',
  RateLimit = 'rate_limit',
  Unknown = 'unknown',
}

/**
 * Application error class with additional metadata
 */
export class AppError extends Error {
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly userMessage: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;
  public readonly originalError?: Error;

  constructor(
    message: string,
    options: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      userMessage?: string;
      context?: Record<string, unknown>;
      originalError?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.severity = options.severity || ErrorSeverity.Medium;
    this.category = options.category || ErrorCategory.Unknown;
    this.userMessage = options.userMessage || 'An unexpected error occurred. Please try again.';
    this.timestamp = new Date();
    this.context = options.context;
    this.originalError = options.originalError;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Error logger interface (can be replaced with external service)
 */
export interface ErrorLogger {
  log(error: AppError): void;
  logBatch(errors: AppError[]): void;
}

/**
 * Console error logger (development)
 */
class ConsoleErrorLogger implements ErrorLogger {
  log(error: AppError): void {
    const logData = {
      message: error.message,
      severity: error.severity,
      category: error.category,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack,
    };

    switch (error.severity) {
      case ErrorSeverity.Critical:
      case ErrorSeverity.High:
        console.error('🔴 Critical Error:', logData);
        break;
      case ErrorSeverity.Medium:
        console.warn('🟡 Warning:', logData);
        break;
      case ErrorSeverity.Low:
        console.warn('🔵 Info:', logData);
        break;
    }
  }

  logBatch(errors: AppError[]): void {
    errors.forEach((error) => this.log(error));
  }
}

/**
 * Production error logger (placeholder for Sentry, LogRocket, etc.)
 */
class ProductionErrorLogger implements ErrorLogger {
  log(error: AppError): void {
    // In production, send to error tracking service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Sentry.captureException(error, {
        level: this.mapSeverityToSentryLevel(error.severity),
        tags: {
          category: error.category,
        },
        contexts: {
          app: error.context,
        },
      });
    }

    // Still log to console in production for debugging
    if (error.severity === ErrorSeverity.Critical) {
      console.error('Critical error:', error.userMessage);
    }
  }

  logBatch(errors: AppError[]): void {
    errors.forEach((error) => this.log(error));
  }

  private mapSeverityToSentryLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.Critical:
        return 'fatal';
      case ErrorSeverity.High:
        return 'error';
      case ErrorSeverity.Medium:
        return 'warning';
      case ErrorSeverity.Low:
        return 'info';
      default:
        return 'error';
    }
  }
}

/**
 * Global error logger instance
 */
export const errorLogger: ErrorLogger =
  process.env.NODE_ENV === 'production' ? new ProductionErrorLogger() : new ConsoleErrorLogger();

/**
 * Common error factories
 */
export const ErrorFactories = {
  // Authentication errors
  unauthorized: (context?: Record<string, unknown>) =>
    new AppError('Unauthorized access attempted', {
      severity: ErrorSeverity.High,
      category: ErrorCategory.Auth,
      userMessage: 'Please sign in to continue.',
      context,
    }),

  sessionExpired: () =>
    new AppError('Session expired', {
      severity: ErrorSeverity.Medium,
      category: ErrorCategory.Auth,
      userMessage: 'Your session has expired. Please sign in again.',
    }),

  // Database errors
  databaseConnection: (originalError?: Error) =>
    new AppError('Database connection failed', {
      severity: ErrorSeverity.Critical,
      category: ErrorCategory.Database,
      userMessage: 'Unable to access your data. Please check your connection.',
      originalError,
    }),

  dataNotFound: (resource: string) =>
    new AppError(`Resource not found: ${resource}`, {
      severity: ErrorSeverity.Low,
      category: ErrorCategory.NotFound,
      userMessage: `The requested ${resource} could not be found.`,
    }),

  saveFailed: (resource: string, originalError?: Error) =>
    new AppError(`Failed to save ${resource}`, {
      severity: ErrorSeverity.High,
      category: ErrorCategory.Database,
      userMessage: `Unable to save your ${resource}. Please try again.`,
      originalError,
    }),

  // Network errors
  networkError: (originalError?: Error) =>
    new AppError('Network request failed', {
      severity: ErrorSeverity.Medium,
      category: ErrorCategory.Network,
      userMessage: 'Connection error. Please check your internet and try again.',
      originalError,
    }),

  rateLimited: (retryAfter?: number) =>
    new AppError('Rate limit exceeded', {
      severity: ErrorSeverity.Low,
      category: ErrorCategory.RateLimit,
      userMessage: `Too many requests. Please wait ${retryAfter || 60} seconds.`,
      context: { retryAfter },
    }),

  // Validation errors
  validationFailed: (field: string, reason?: string) =>
    new AppError(`Validation failed for ${field}`, {
      severity: ErrorSeverity.Low,
      category: ErrorCategory.Validation,
      userMessage: reason || `Please check your input for ${field}.`,
      context: { field, reason },
    }),

  // Permission errors
  insufficientPermissions: (action: string) =>
    new AppError(`Insufficient permissions for ${action}`, {
      severity: ErrorSeverity.High,
      category: ErrorCategory.Permission,
      userMessage: `You don't have permission to ${action}.`,
    }),
};

/**
 * Error handler for async functions
 */
export async function handleAsync<T>(
  fn: () => Promise<T>,
  options: {
    fallback?: T;
    onError?: (error: AppError) => void;
    rethrow?: boolean;
  } = {}
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const appError =
      error instanceof AppError
        ? error
        : new AppError((error as Error).message, {
            originalError: error as Error,
          });

    errorLogger.log(appError);
    options.onError?.(appError);

    if (options.rethrow) {
      throw appError;
    }

    return options.fallback;
  }
}

/**
 * Error boundary handler for React
 */
export function handleReactError(error: Error, errorInfo: { componentStack: string }): void {
  const appError = new AppError('React component error', {
    severity: ErrorSeverity.High,
    category: ErrorCategory.Unknown,
    userMessage: 'Something went wrong. Please refresh the page.',
    originalError: error,
    context: {
      componentStack: errorInfo.componentStack,
    },
  });

  errorLogger.log(appError);
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('network')) {
      return 'Connection error. Please check your internet.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (error.message.includes('permission') || error.message.includes('denied')) {
      return "You don't have permission for this action.";
    }
    if (error.message.includes('not found')) {
      return 'The requested item could not be found.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Retry logic for transient errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = (error) => {
      // Retry on network errors and timeouts
      return (
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('fetch')
      );
    },
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!shouldRetry(lastError) || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This line should never be reached, but TypeScript doesn't know that
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  throw lastError!;
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  /**
   * Clear corrupted local data and reload
   */
  async clearAndReload(): Promise<void> {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'We need to clear your local data to recover. Your saved information will be lost. Continue?'
      );

      if (confirmed) {
        localStorage.clear();
        sessionStorage.clear();

        // Clear IndexedDB
        if ('indexedDB' in window) {
          const databases = await window.indexedDB.databases();
          await Promise.all(
            databases.map((db) => db.name && window.indexedDB.deleteDatabase(db.name))
          );
        }

        window.location.reload();
      }
    }
  },

  /**
   * Attempt to recover from auth error
   */
  async recoverAuth(): Promise<void> {
    try {
      // Dynamically import to avoid circular dependencies with server-only code
      const { signOutCompletely } = await import('@/lib/auth/authUtils');
      await signOutCompletely();
    } catch (error) {
      console.error('Error during auth recovery:', error);
    }
    // Always redirect to home, even if signOut fails
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },

  /**
   * Show user-friendly error UI
   */
  showErrorUI(error: AppError): void {
    // This would integrate with your toast/notification system
    console.error('Show error UI:', error.userMessage);
  },
};
