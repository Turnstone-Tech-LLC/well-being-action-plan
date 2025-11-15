/**
 * Data Portability Service
 *
 * Provides functionality for exporting and importing user data to/from JSON files.
 * All operations are client-side only - no data is transmitted to servers.
 *
 * Privacy-First: Patient data never leaves the device.
 */

import { exportData, importData, type UserConfig } from '@/lib/db';
import type { CheckIn } from '@/lib/types/check-in';
import type { CopingStrategy } from '@/lib/types/coping-strategy';

/**
 * Version of the export data format
 * Increment this when making breaking changes to the export format
 */
const EXPORT_FORMAT_VERSION = '1.0';

/**
 * Structure of exported data file
 */
export interface ExportDataFile {
  version: string;
  exportDate: string;
  appVersion: string;
  data: {
    checkIns: CheckIn[];
    copingStrategies: CopingStrategy[];
    userConfig: UserConfig[];
  };
}

/**
 * Result of data validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Exports all user data to a JSON file and triggers download
 *
 * @returns Promise that resolves when download is triggered
 * @throws Error if export fails
 */
export async function exportDataToFile(): Promise<void> {
  try {
    // Get all data from IndexedDB
    const data = await exportData();

    // Create export file structure
    const exportFile: ExportDataFile = {
      version: EXPORT_FORMAT_VERSION,
      exportDate: new Date().toISOString(),
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      data,
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(exportFile, null, 2);

    // Create blob
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `wbap-data-${timestamp}.json`;

    // Trigger download
    downloadDataFile(blob, filename);
  } catch (error) {
    throw new Error(
      `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Reads and parses a data file from user upload
 *
 * @param file - The uploaded file
 * @returns Promise that resolves to parsed export data
 * @throws Error if file reading or parsing fails
 */
export async function readDataFile(file: File): Promise<ExportDataFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) {
          reject(new Error('File is empty'));
          return;
        }

        const parsed = JSON.parse(content) as ExportDataFile;
        resolve(parsed);
      } catch (error) {
        reject(
          new Error(
            `Failed to parse file: ${error instanceof Error ? error.message : 'Invalid JSON'}`
          )
        );
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validates imported data structure
 *
 * @param data - The data to validate
 * @returns Validation result with errors and warnings
 */
export function validateImportData(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    errors.push('Invalid data format: expected an object');
    return { isValid: false, errors, warnings };
  }

  const exportFile = data as Partial<ExportDataFile>;

  // Check version
  if (!exportFile.version) {
    errors.push('Missing version field');
  } else if (exportFile.version !== EXPORT_FORMAT_VERSION) {
    warnings.push(
      `Data was exported with version ${exportFile.version}, current version is ${EXPORT_FORMAT_VERSION}`
    );
  }

  // Check data field
  if (!exportFile.data || typeof exportFile.data !== 'object') {
    errors.push('Missing or invalid data field');
    return { isValid: false, errors, warnings };
  }

  const { data: importData } = exportFile;

  // Validate checkIns
  if (importData.checkIns !== undefined && !Array.isArray(importData.checkIns)) {
    errors.push('checkIns must be an array');
  }

  // Validate copingStrategies
  if (importData.copingStrategies !== undefined && !Array.isArray(importData.copingStrategies)) {
    errors.push('copingStrategies must be an array');
  }

  // Validate userConfig
  if (importData.userConfig !== undefined && !Array.isArray(importData.userConfig)) {
    errors.push('userConfig must be an array');
  }

  // Check if at least one data type is present
  const hasData =
    (importData.checkIns && importData.checkIns.length > 0) ||
    (importData.copingStrategies && importData.copingStrategies.length > 0) ||
    (importData.userConfig && importData.userConfig.length > 0);

  if (!hasData) {
    warnings.push('No data found in import file');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Imports data from a parsed export file into IndexedDB
 *
 * @param exportFile - The parsed export file
 * @returns Promise that resolves when import is complete
 * @throws Error if import fails or validation fails
 */
export async function importDataFromFile(exportFile: ExportDataFile): Promise<void> {
  // Validate data first
  const validation = validateImportData(exportFile);

  if (!validation.isValid) {
    throw new Error(`Invalid import data: ${validation.errors.join(', ')}`);
  }

  try {
    // Import data into IndexedDB
    await importData(exportFile.data);
  } catch (error) {
    throw new Error(
      `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Triggers browser download of a data file
 *
 * @param blob - The blob containing the file data
 * @param filename - The filename for the download
 */
export function downloadDataFile(blob: Blob, filename: string): void {
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gets a summary of data in an export file
 *
 * @param exportFile - The parsed export file
 * @returns Summary object with counts
 */
export function getDataSummary(exportFile: ExportDataFile): {
  checkInsCount: number;
  copingStrategiesCount: number;
  userConfigCount: number;
  exportDate: string;
  version: string;
} {
  return {
    checkInsCount: exportFile.data.checkIns?.length || 0,
    copingStrategiesCount: exportFile.data.copingStrategies?.length || 0,
    userConfigCount: exportFile.data.userConfig?.length || 0,
    exportDate: exportFile.exportDate,
    version: exportFile.version,
  };
}
