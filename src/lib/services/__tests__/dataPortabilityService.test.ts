/**
 * Unit tests for Data Portability Service
 *
 * Tests export/import functionality for user data
 */

import { describe, it, expect } from 'vitest';
import { validateImportData, getDataSummary, type ExportDataFile } from '../dataPortabilityService';
import { ZoneType } from '@/lib/types/zone';
import { CopingStrategyCategory } from '@/lib/types/coping-strategy';

describe('Data Portability Service', () => {
  const validExportData: ExportDataFile = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    appVersion: '0.1.0',
    data: {
      checkIns: [
        {
          id: 'check-in-1',
          userId: 'patient',
          zone: ZoneType.Green,
          notes: 'Feeling good',
          timestamp: new Date(),
          copingStrategyIds: [],
          triggerIds: [],
        },
      ],
      copingStrategies: [
        {
          id: 'strategy-1',
          title: 'Deep Breathing',
          description: 'Take slow, deep breaths',
          category: CopingStrategyCategory.Breathing,
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      userConfig: [
        {
          id: 'config-1',
          userId: 'patient',
          key: 'preferredName',
          value: 'John',
          updatedAt: new Date(),
        },
      ],
    },
  };

  describe('validateImportData', () => {
    it('should validate correct export data', () => {
      const result = validateImportData(validExportData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject data without version', () => {
      const invalid = { ...validExportData, version: undefined };
      const result = validateImportData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept data without exportDate (optional field)', () => {
      const invalid = { ...validExportData, exportDate: undefined };
      const result = validateImportData(invalid);
      // exportDate is optional, so this should still be valid if other fields are present
      expect(result.isValid).toBe(true);
    });

    it('should reject data without data field', () => {
      const invalid = { ...validExportData, data: undefined };
      const result = validateImportData(invalid);
      expect(result.isValid).toBe(false);
    });

    it('should accept data with empty arrays', () => {
      const emptyData: ExportDataFile = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appVersion: '0.1.0',
        data: {
          checkIns: [],
          copingStrategies: [],
          userConfig: [],
        },
      };
      const result = validateImportData(emptyData);
      expect(result.isValid).toBe(true);
    });

    it('should reject non-object data', () => {
      const result = validateImportData('not an object');
      expect(result.isValid).toBe(false);
    });

    it('should reject null data', () => {
      const result = validateImportData(null);
      expect(result.isValid).toBe(false);
    });
  });

  describe('getDataSummary', () => {
    it('should generate summary for valid export data', () => {
      const summary = getDataSummary(validExportData);
      expect(summary).toBeDefined();
      expect(summary.checkInsCount).toBe(1);
      expect(summary.copingStrategiesCount).toBe(1);
      expect(summary.userConfigCount).toBe(1);
    });

    it('should handle empty data', () => {
      const emptyData: ExportDataFile = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appVersion: '0.1.0',
        data: {
          checkIns: [],
          copingStrategies: [],
          userConfig: [],
        },
      };
      const summary = getDataSummary(emptyData);
      expect(summary.checkInsCount).toBe(0);
      expect(summary.copingStrategiesCount).toBe(0);
      expect(summary.userConfigCount).toBe(0);
    });

    it('should include export metadata in summary', () => {
      const summary = getDataSummary(validExportData);
      expect(summary.exportDate).toBe(validExportData.exportDate);
      expect(summary.version).toBe(validExportData.version);
    });

    it('should count multiple items correctly', () => {
      const baseCheckIn = validExportData.data.checkIns[0];
      if (!baseCheckIn) {
        throw new Error('Base check-in not found');
      }

      const multiData: ExportDataFile = {
        ...validExportData,
        data: {
          checkIns: [
            { ...baseCheckIn, id: 'check-in-1' },
            { ...baseCheckIn, id: 'check-in-2' },
            { ...baseCheckIn, id: 'check-in-3' },
          ],
          copingStrategies: validExportData.data.copingStrategies,
          userConfig: validExportData.data.userConfig,
        },
      };
      const summary = getDataSummary(multiData);
      expect(summary.checkInsCount).toBe(3);
    });
  });
});
