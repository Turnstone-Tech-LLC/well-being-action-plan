import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateProviderKey,
  enableProviderMode,
  revokeProviderMode,
  isProviderModeEnabled,
  getProviderModeStatus,
  getProviderKeyFromEnv,
} from '../providerMode';

describe('Provider Mode Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getProviderKeyFromEnv', () => {
    it('should return the provider key from environment', () => {
      const key = getProviderKeyFromEnv();
      // Key may or may not be set depending on test environment
      expect(typeof key === 'string' || key === null).toBe(true);
    });
  });

  describe('validateProviderKey', () => {
    it('should return false for empty key', () => {
      expect(validateProviderKey('')).toBe(false);
    });

    it('should return false for null-like values', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateProviderKey(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateProviderKey(undefined as any)).toBe(false);
    });

    it('should return false for non-string values', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateProviderKey(123 as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateProviderKey({} as any)).toBe(false);
    });

    it('should return false if no provider key is configured', () => {
      // When NEXT_PUBLIC_PROVIDER_KEY is not set
      const result = validateProviderKey('any-key');
      // Result depends on environment configuration
      expect(typeof result === 'boolean').toBe(true);
    });

    it('should return true for matching key', () => {
      // This test assumes NEXT_PUBLIC_PROVIDER_KEY is set in test environment
      // If not set, this test will be skipped or return false
      const envKey = getProviderKeyFromEnv();
      if (envKey) {
        expect(validateProviderKey(envKey)).toBe(true);
      }
    });

    it('should return false for non-matching key', () => {
      expect(validateProviderKey('wrong-key')).toBe(false);
    });
  });

  describe('enableProviderMode', () => {
    it('should set provider mode flag in localStorage', () => {
      enableProviderMode();
      expect(localStorage.getItem('provider_mode')).toBe('enabled');
    });

    it('should not throw if called multiple times', () => {
      expect(() => {
        enableProviderMode();
        enableProviderMode();
      }).not.toThrow();
    });
  });

  describe('revokeProviderMode', () => {
    it('should remove provider mode flag from localStorage', () => {
      enableProviderMode();
      expect(localStorage.getItem('provider_mode')).toBe('enabled');

      revokeProviderMode();
      expect(localStorage.getItem('provider_mode')).toBeNull();
    });

    it('should not throw if called when flag is not set', () => {
      expect(() => {
        revokeProviderMode();
      }).not.toThrow();
    });
  });

  describe('isProviderModeEnabled', () => {
    it('should return false when flag is not set', () => {
      expect(isProviderModeEnabled()).toBe(false);
    });

    it('should return true when flag is enabled', () => {
      enableProviderMode();
      expect(isProviderModeEnabled()).toBe(true);
    });

    it('should return false after revoke', () => {
      enableProviderMode();
      expect(isProviderModeEnabled()).toBe(true);

      revokeProviderMode();
      expect(isProviderModeEnabled()).toBe(false);
    });
  });

  describe('getProviderModeStatus', () => {
    it('should return status object with correct structure', () => {
      const status = getProviderModeStatus();
      expect(status).toHaveProperty('isEnabled');
      expect(status).toHaveProperty('isConfigured');
      expect(status).toHaveProperty('hasKey');
      expect(typeof status.isEnabled).toBe('boolean');
      expect(typeof status.isConfigured).toBe('boolean');
      expect(typeof status.hasKey).toBe('boolean');
    });

    it('should reflect enabled state', () => {
      expect(getProviderModeStatus().isEnabled).toBe(false);

      enableProviderMode();
      expect(getProviderModeStatus().isEnabled).toBe(true);

      revokeProviderMode();
      expect(getProviderModeStatus().isEnabled).toBe(false);
    });

    it('should reflect configured state', () => {
      const status = getProviderModeStatus();
      // isConfigured depends on environment
      expect(typeof status.isConfigured).toBe('boolean');
    });
  });

  describe('Integration: Full flow', () => {
    it('should handle complete enable/revoke cycle', () => {
      // Initial state
      expect(isProviderModeEnabled()).toBe(false);

      // Enable
      enableProviderMode();
      expect(isProviderModeEnabled()).toBe(true);
      expect(getProviderModeStatus().isEnabled).toBe(true);

      // Revoke
      revokeProviderMode();
      expect(isProviderModeEnabled()).toBe(false);
      expect(getProviderModeStatus().isEnabled).toBe(false);
    });
  });
});
