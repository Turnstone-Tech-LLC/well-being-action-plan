/**
 * Unit tests for patient authentication utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkPatientOnboarding,
  isPatientOnboardingComplete,
  getOnboardingRedirectPath,
} from '../patientAuth';
import { setUserConfig, createCopingStrategy, clearAllData } from '@/lib/db';
import { CopingStrategyCategory } from '@/lib/types';

describe('Patient Authentication Utilities', () => {
  beforeEach(async () => {
    // Clear all data before each test
    await clearAllData();
  });

  describe('checkPatientOnboarding', () => {
    it('should return incomplete status when no data exists', async () => {
      const status = await checkPatientOnboarding('patient');

      expect(status.isComplete).toBe(false);
      expect(status.hasPreferredName).toBe(false);
      expect(status.hasOnboardingFlag).toBe(false);
      expect(status.hasCopingStrategies).toBe(false);
      expect(status.missingSteps.length).toBeGreaterThan(0);
    });

    it('should return incomplete status when only name is set', async () => {
      await setUserConfig('patient', 'preferredName', 'Test User');

      const status = await checkPatientOnboarding('patient');

      expect(status.isComplete).toBe(false);
      expect(status.hasPreferredName).toBe(true);
      expect(status.hasOnboardingFlag).toBe(false);
      expect(status.hasCopingStrategies).toBe(false);
    });

    it('should return incomplete status when name and flag are set but no strategies', async () => {
      await setUserConfig('patient', 'preferredName', 'Test User');
      await setUserConfig('patient', 'onboardingCompleted', true);

      const status = await checkPatientOnboarding('patient');

      expect(status.isComplete).toBe(false);
      expect(status.hasPreferredName).toBe(true);
      expect(status.hasOnboardingFlag).toBe(true);
      expect(status.hasCopingStrategies).toBe(false);
    });

    it('should return complete status when all requirements are met', async () => {
      // Set up complete onboarding
      await setUserConfig('patient', 'preferredName', 'Test User');
      await setUserConfig('patient', 'onboardingCompleted', true);
      await createCopingStrategy({
        title: 'Deep Breathing',
        description: 'Take slow, deep breaths',
        category: CopingStrategyCategory.Physical,
        isFavorite: false,
      });

      const status = await checkPatientOnboarding('patient');

      expect(status.isComplete).toBe(true);
      expect(status.hasPreferredName).toBe(true);
      expect(status.hasOnboardingFlag).toBe(true);
      expect(status.hasCopingStrategies).toBe(true);
      expect(status.missingSteps.length).toBe(0);
    });
  });

  describe('isPatientOnboardingComplete', () => {
    it('should return false when onboarding is not complete', async () => {
      const isComplete = await isPatientOnboardingComplete('patient');
      expect(isComplete).toBe(false);
    });

    it('should return true when onboarding is complete', async () => {
      // Set up complete onboarding
      await setUserConfig('patient', 'preferredName', 'Test User');
      await setUserConfig('patient', 'onboardingCompleted', true);
      await createCopingStrategy({
        title: 'Deep Breathing',
        description: 'Take slow, deep breaths',
        category: CopingStrategyCategory.Physical,
        isFavorite: false,
      });

      const isComplete = await isPatientOnboardingComplete('patient');
      expect(isComplete).toBe(true);
    });
  });

  describe('getOnboardingRedirectPath', () => {
    it('should return /onboarding when no provider link is present', () => {
      const path = getOnboardingRedirectPath();
      expect(path).toBe('/onboarding');
    });

    // Note: Testing with provider link would require mocking window.location
    // which is more complex in a unit test environment
  });
});
