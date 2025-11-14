'use client';

import { useEffect, useState } from 'react';
import { getPatientConfig, updatePatientConfig } from '@/lib/db';

// BeforeInstallPromptEvent is not in TypeScript lib.dom.d.ts yet
// eslint-disable-next-line no-undef
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Custom PWA install prompt
 * Shows installation banner for users who haven't installed the app yet
 * Respects user dismissal and platform differences (iOS vs Android)
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(standalone);
    };

    // Detect iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const iOS = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(iOS);
    };

    checkStandalone();
    checkIOS();

    // Check if user previously dismissed the prompt
    const checkDismissalStatus = async () => {
      try {
        const config = await getPatientConfig();
        const dismissed = config.pwaInstallDismissed ?? false;

        // Only show if not dismissed and not in standalone mode
        if (!dismissed && !isStandalone) {
          setShowPrompt(true);
        }
      } catch (error) {
        console.error('Error checking PWA install dismissal status:', error);
      }
    };

    checkDismissalStatus();

    // Listen for the beforeinstallprompt event (Chromium browsers)
    // eslint-disable-next-line no-undef
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();

      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    // Track installation (void to satisfy linter)
    void outcome;

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = async () => {
    try {
      // Save dismissal to IndexedDB
      await updatePatientConfig({ pwaInstallDismissed: true });
      setShowPrompt(false);
    } catch (error) {
      console.error('Error saving PWA install dismissal:', error);
    }
  };

  // Don't show if already installed, user dismissed, or no prompt capability
  if (isStandalone || !showPrompt) {
    return null;
  }

  // iOS-specific instructions (no beforeinstallprompt event)
  if (isIOS && !deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Install Well-Being Action Plan</h3>
            <p className="mt-1 text-sm text-gray-600">
              Tap the share button{' '}
              <svg
                className="inline h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
              </svg>{' '}
              then "Add to Home Screen"
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss install prompt"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Standard install prompt (Chromium browsers)
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Install Well-Being Action Plan</h3>
            <p className="mt-1 text-sm text-gray-600">
              Access your well-being plan anytime, even offline
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
