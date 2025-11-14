'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect online/offline status
 * @returns {boolean} true if online, false if offline
 */
export function useOnlineStatus(): boolean {
  // Initialize with navigator.onLine if available (SSR-safe)
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Update online status
    function handleOnline() {
      setIsOnline(true);
    }

    // Update offline status
    function handleOffline() {
      setIsOnline(false);
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
