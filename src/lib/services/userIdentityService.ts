/**
 * User Identity Service
 *
 * Manages unique user identification for patient data isolation.
 * Uses a combination of browser fingerprinting and session storage
 * to maintain consistent user identity without server transmission.
 */

import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'wbap_user_id';
const SESSION_KEY = 'wbap_session_id';

export interface UserIdentity {
  userId: string;
  sessionId: string;
  createdAt: Date;
  fingerprint?: string;
}

/**
 * Generate a browser fingerprint for additional identity verification
 * This is privacy-preserving as it stays local
 */
async function generateFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'no-canvas';

  // Simple canvas fingerprinting
  ctx.textBaseline = 'top';
  ctx.font = '14px "Arial"';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('WBAP User Identity', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('WBAP User Identity', 4, 17);

  const dataURL = canvas.toDataURL();

  // Combine with other browser properties
  const features = [
    dataURL,
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency,
    new Date().getTimezoneOffset(),
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
  ].join('|');

  // Hash the features
  const encoder = new TextEncoder();
  const data = encoder.encode(features);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex.substring(0, 16); // Use first 16 chars
}

/**
 * Get or create a persistent user ID for this browser/device
 */
export async function getUserIdentity(): Promise<UserIdentity> {
  if (typeof window === 'undefined') {
    throw new Error('getUserIdentity can only be called in browser environment');
  }

  // Check for existing user ID in localStorage
  let userId = localStorage.getItem(USER_ID_KEY);
  let createdAt = new Date();

  if (!userId) {
    // Generate new user ID
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
    localStorage.setItem(`${USER_ID_KEY}_created`, createdAt.toISOString());
  } else {
    // Retrieve creation date
    const storedDate = localStorage.getItem(`${USER_ID_KEY}_created`);
    if (storedDate) {
      createdAt = new Date(storedDate);
    }
  }

  // Generate or retrieve session ID
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  // Generate fingerprint for additional verification
  let fingerprint: string | undefined;
  try {
    fingerprint = await generateFingerprint();
  } catch (error) {
    console.warn('Failed to generate fingerprint:', error);
  }

  return {
    userId,
    sessionId,
    createdAt,
    fingerprint,
  };
}

/**
 * Clear user identity (for logout/reset)
 */
export function clearUserIdentity(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(`${USER_ID_KEY}_created`);
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Check if user has an established identity
 */
export function hasUserIdentity(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(USER_ID_KEY) !== null;
}

/**
 * Hook for React components
 */
export function useUserIdentity() {
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userIdentity = await getUserIdentity();
        if (!cancelled) {
          setIdentity(userIdentity);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { identity, loading, error };
}

// Add missing imports at the top of the file
import { useState, useEffect } from 'react';
