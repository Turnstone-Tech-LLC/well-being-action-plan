'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useEffect, useState } from 'react';

/**
 * Non-intrusive banner showing connectivity status
 * Displays when offline and auto-hides when back online
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // Show offline banner immediately using setTimeout to avoid direct setState
      const timer = setTimeout(() => {
        setShowBanner(true);
        setJustReconnected(false);
      }, 0);

      return () => clearTimeout(timer);
    } else if (showBanner && isOnline) {
      // Just reconnected - show success message briefly
      const reconnectTimer = setTimeout(() => {
        setJustReconnected(true);
      }, 0);

      // Hide success message after 3 seconds
      const hideTimer = setTimeout(() => {
        setShowBanner(false);
        setJustReconnected(false);
      }, 3000);

      return () => {
        clearTimeout(reconnectTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isOnline, showBanner]);

  // Don't render anything if online and never went offline
  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 transform transition-transform duration-300 ${
        showBanner ? 'translate-y-0' : '-translate-y-full'
      }`}
      role={justReconnected ? 'status' : 'alert'}
      aria-live={justReconnected ? 'polite' : 'assertive'}
    >
      {justReconnected ? (
        // Back online banner (success)
        <div className="bg-green-600 px-4 py-3 text-white shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium">Back online! Your data will sync automatically.</p>
          </div>
        </div>
      ) : (
        // Offline banner (warning)
        <div className="bg-yellow-500 px-4 py-3 text-white shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <p className="text-sm font-medium">You&apos;re offline.</p>
              <p className="text-sm opacity-90">
                Your well-being plan and check-ins still work offline.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
