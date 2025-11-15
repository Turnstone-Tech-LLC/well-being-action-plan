'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FlashVariant = 'success' | 'error' | 'info' | 'warning';

export interface FlashProps {
  /**
   * The message to display
   */
  message: string;

  /**
   * The variant/type of flash message
   * @default 'info'
   */
  variant?: FlashVariant;

  /**
   * Whether the flash is visible
   * @default true
   */
  visible?: boolean;

  /**
   * Callback when flash is dismissed
   */
  onDismiss?: () => void;

  /**
   * Auto-dismiss after milliseconds (0 = no auto-dismiss)
   * @default 5000
   */
  autoDismissMs?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable Flash Component
 *
 * Displays temporary notification messages with auto-dismiss capability.
 * Supports multiple variants (success, error, info, warning).
 *
 * Usage:
 * ```tsx
 * const [flash, setFlash] = useState<FlashProps | null>(null);
 *
 * return (
 *   <>
 *     {flash && <Flash {...flash} onDismiss={() => setFlash(null)} />}
 *     <button onClick={() => setFlash({ message: 'Success!', variant: 'success' })}>
 *       Show Flash
 *     </button>
 *   </>
 * );
 * ```
 */
export function Flash({
  message,
  variant = 'info',
  visible = true,
  onDismiss,
  autoDismissMs = 5000,
  className,
}: FlashProps) {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (!isVisible || autoDismissMs === 0) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [isVisible, autoDismissMs, onDismiss]);

  if (!isVisible) return null;

  const variantStyles = {
    success:
      'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100',
    error:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
    info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100',
    warning:
      'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-100',
  };

  const iconStyles = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
  };

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  }[variant];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 duration-300 animate-in fade-in slide-in-from-top-2',
        variantStyles[variant],
        className
      )}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <Icon
        className={cn('mt-0.5 h-5 w-5 flex-shrink-0', iconStyles[variant])}
        aria-hidden="true"
      />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          onDismiss?.();
        }}
        className="flex-shrink-0 text-current opacity-70 transition-opacity hover:opacity-100"
        aria-label={`Dismiss ${variant} message`}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
