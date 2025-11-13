import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isProviderModeEnabled,
  revokeProviderMode,
  enableProviderMode,
} from '@/lib/utils/providerMode';

/**
 * Hook tests for useProviderMode
 *
 * Note: Full hook testing with redirect behavior requires React Testing Library
 * or similar. These tests verify the underlying utilities that the hook uses.
 * E2E tests will verify the complete hook behavior with routing.
 */
describe('useProviderMode Hook - Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should have revokeProviderMode function available', () => {
    expect(typeof revokeProviderMode).toBe('function');
  });

  it('should have enableProviderMode function available', () => {
    expect(typeof enableProviderMode).toBe('function');
  });

  it('should have isProviderModeEnabled function available', () => {
    expect(typeof isProviderModeEnabled).toBe('function');
  });

  describe('Provider mode state management', () => {
    it('should start with provider mode disabled', () => {
      expect(isProviderModeEnabled()).toBe(false);
    });

    it('should enable provider mode', () => {
      enableProviderMode();
      expect(isProviderModeEnabled()).toBe(true);
    });

    it('should revoke provider mode', () => {
      enableProviderMode();
      expect(isProviderModeEnabled()).toBe(true);

      revokeProviderMode();
      expect(isProviderModeEnabled()).toBe(false);
    });

    it('should handle multiple enable/revoke cycles', () => {
      for (let i = 0; i < 3; i++) {
        enableProviderMode();
        expect(isProviderModeEnabled()).toBe(true);

        revokeProviderMode();
        expect(isProviderModeEnabled()).toBe(false);
      }
    });
  });

  describe('localStorage persistence', () => {
    it('should persist provider mode flag in localStorage', () => {
      enableProviderMode();
      expect(localStorage.getItem('provider_mode')).toBe('enabled');
    });

    it('should remove provider mode flag from localStorage on revoke', () => {
      enableProviderMode();
      expect(localStorage.getItem('provider_mode')).toBe('enabled');

      revokeProviderMode();
      expect(localStorage.getItem('provider_mode')).toBeNull();
    });
  });
});
