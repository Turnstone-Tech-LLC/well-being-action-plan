/**
 * URL Configuration Utility
 *
 * This module provides functionality for encoding and decoding well-being plan
 * configurations into URL-safe strings, enabling sharing of plan configurations
 * through URLs.
 *
 * ## URL Structure
 *
 * Plans are shared using the following URL structure:
 * ```
 * https://example.com/?plan={encoded_config}
 * ```
 *
 * Where `{encoded_config}` is a URL-safe base64-encoded, compressed JSON string
 * containing the shareable plan configuration.
 *
 * ## Encoding Process
 *
 * 1. Extract shareable fields from WellBeingPlan
 * 2. Convert to JSON string
 * 3. Compress using pako (gzip compression)
 * 4. Encode to base64 (URL-safe)
 * 5. Add as query parameter
 *
 * ## Decoding Process
 *
 * 1. Extract query parameter from URL
 * 2. Decode from base64
 * 3. Decompress using pako
 * 4. Parse JSON
 * 5. Validate against Zod schema
 * 6. Return validated configuration
 *
 * ## Size Limitations
 *
 * - Target: Under 2000 characters for broad browser compatibility
 * - Compression helps keep URLs manageable
 * - Large plans may need to be simplified for sharing
 *
 * @module urlConfig
 */

import { z } from 'zod';
import pako from 'pako';
import { ZoneType } from '../types/zone';

/**
 * Zod schema for ZoneType enum
 */
const ZoneTypeSchema = z.nativeEnum(ZoneType);

/**
 * Zod schema for Trigger
 */
const TriggerSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  zone: ZoneTypeSchema,
  createdAt: z.date().optional(),
});

/**
 * Zod schema for ZoneStrategies
 */
const ZoneStrategiesSchema = z.object({
  zone: ZoneTypeSchema,
  copingStrategyIds: z.array(z.string()),
  triggers: z.array(TriggerSchema),
  notes: z.string().optional(),
});

/**
 * Zod schema for WellBeingPlanConfig (shareable subset)
 * Excludes sensitive fields like sharedUserIds and shareWithSupporters
 */
const ShareableConfigSchema = z.object({
  enableNotifications: z.boolean(),
  enableCheckInReminders: z.boolean(),
  checkInFrequencyHours: z.number().optional(),
  reminderTimes: z.array(z.string()).optional(),
  enableDataSync: z.boolean(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
});

/**
 * Zod schema for the complete shareable plan configuration
 */
const ShareablePlanConfigSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  zoneStrategies: z.array(ZoneStrategiesSchema),
  config: ShareableConfigSchema,
});

/**
 * Type for shareable plan configuration
 * This is a subset of WellBeingPlan that excludes user-specific and sensitive data
 */
export type ShareablePlanConfig = z.infer<typeof ShareablePlanConfigSchema>;

/**
 * Result type for decode operations
 */
export type DecodeResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Query parameter name used for encoded plan configuration
 */
export const PLAN_PARAM_NAME = 'plan';

/**
 * Maximum recommended URL length in characters
 */
export const MAX_URL_LENGTH = 2000;

/**
 * Encodes a plan configuration into a URL-safe string
 *
 * @param config - The shareable plan configuration to encode
 * @returns URL-safe base64-encoded compressed string
 * @throws Error if encoding fails
 *
 * @example
 * ```typescript
 * const config: ShareablePlanConfig = {
 *   title: "My Well-Being Plan",
 *   zoneStrategies: [...],
 *   config: { enableNotifications: true, ... }
 * };
 * const encoded = encodeConfig(config);
 * // Returns: "eJyLjgUAARUAuQ..."
 * ```
 */
export function encodeConfig(config: ShareablePlanConfig): string {
  try {
    // Validate the input against schema
    ShareablePlanConfigSchema.parse(config);

    // Convert to JSON string
    const jsonString = JSON.stringify(config);

    // Convert string to Uint8Array for compression
    const uint8Array = new TextEncoder().encode(jsonString);

    // Compress using gzip
    const compressed = pako.gzip(uint8Array);

    // Convert to base64 (URL-safe)
    const base64 = btoa(String.fromCharCode(...compressed))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return base64;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues?.map((e) => e.message).join(', ') || 'Validation failed';
      throw new Error(`Invalid plan configuration: ${errorMessages}`);
    }
    throw new Error(
      `Failed to encode configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Decodes a URL-safe string into a plan configuration
 *
 * @param encoded - URL-safe base64-encoded compressed string
 * @returns DecodeResult with either the decoded config or an error message
 *
 * @example
 * ```typescript
 * const result = decodeConfig("eJyLjgUAARUAuQ...");
 * if (result.success) {
 *   console.log(result.data.title);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function decodeConfig(encoded: string): DecodeResult<ShareablePlanConfig> {
  try {
    // Validate input
    if (!encoded || typeof encoded !== 'string') {
      return {
        success: false,
        error: 'Invalid input: encoded string is required',
      };
    }

    // Restore base64 padding if needed
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    // Decode from base64
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decompress
    const decompressed = pako.ungzip(bytes);

    // Convert back to string
    const jsonString = new TextDecoder().decode(decompressed);

    // Parse JSON
    const parsed = JSON.parse(jsonString);

    // Validate against schema
    const validated = ShareablePlanConfigSchema.parse(parsed);

    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages =
        error.issues?.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') ||
        'Schema validation failed';
      return {
        success: false,
        error: `Invalid plan structure: ${errorMessages}`,
      };
    }
    return {
      success: false,
      error: `Failed to decode configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Generates a shareable URL with the encoded plan configuration
 *
 * @param config - The shareable plan configuration
 * @param baseUrl - Base URL (defaults to current location if in browser)
 * @returns Complete URL with encoded plan parameter
 * @throws Error if URL generation fails or exceeds recommended length
 *
 * @example
 * ```typescript
 * const url = generateShareableUrl(config, "https://myapp.com");
 * // Returns: "https://myapp.com?plan=eJyLjgUAARUAuQ..."
 * ```
 */
export function generateShareableUrl(
  config: ShareablePlanConfig,
  baseUrl?: string
): string {
  const encoded = encodeConfig(config);

  // Use provided baseUrl or current location
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  if (!base) {
    throw new Error('Base URL is required when not running in browser');
  }

  // Create URL object
  const url = new URL(base);
  url.searchParams.set(PLAN_PARAM_NAME, encoded);

  const fullUrl = url.toString();

  // Warn if URL exceeds recommended length
  if (fullUrl.length > MAX_URL_LENGTH) {
    console.warn(
      `Generated URL length (${fullUrl.length}) exceeds recommended maximum (${MAX_URL_LENGTH}). ` +
        'Some browsers may have issues with long URLs.'
    );
  }

  return fullUrl;
}

/**
 * Extracts and decodes plan configuration from a URL
 *
 * @param url - URL string or URL object containing the plan parameter
 * @returns DecodeResult with either the decoded config or an error message
 *
 * @example
 * ```typescript
 * const result = extractConfigFromUrl("https://myapp.com?plan=eJyLjgUAARUAuQ...");
 * if (result.success) {
 *   console.log("Loaded plan:", result.data.title);
 * } else {
 *   console.error("Failed to load plan:", result.error);
 * }
 * ```
 */
export function extractConfigFromUrl(
  url: string | URL
): DecodeResult<ShareablePlanConfig> {
  try {
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    const encoded = urlObj.searchParams.get(PLAN_PARAM_NAME);

    if (!encoded) {
      return {
        success: false,
        error: `No plan configuration found in URL (missing '${PLAN_PARAM_NAME}' parameter)`,
      };
    }

    return decodeConfig(encoded);
  } catch (error) {
    return {
      success: false,
      error: `Invalid URL: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Extracts plan configuration from the current browser URL
 *
 * @returns DecodeResult with either the decoded config or an error message
 * @throws Error if called outside of browser environment
 *
 * @example
 * ```typescript
 * // In browser with URL: https://myapp.com?plan=eJyLjgUAARUAuQ...
 * const result = extractConfigFromCurrentUrl();
 * if (result.success) {
 *   console.log("Loaded plan from URL:", result.data.title);
 * }
 * ```
 */
export function extractConfigFromCurrentUrl(): DecodeResult<ShareablePlanConfig> {
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'Cannot extract from current URL outside of browser environment',
    };
  }

  return extractConfigFromUrl(window.location.href);
}

/**
 * Estimates the URL length that would be generated for a given config
 *
 * @param config - The shareable plan configuration
 * @param baseUrl - Base URL (defaults to current location if in browser)
 * @returns Estimated URL length in characters
 *
 * @example
 * ```typescript
 * const length = estimateUrlLength(config);
 * if (length > MAX_URL_LENGTH) {
 *   console.warn("Plan may be too large to share via URL");
 * }
 * ```
 */
export function estimateUrlLength(config: ShareablePlanConfig, baseUrl?: string): number {
  try {
    const url = generateShareableUrl(config, baseUrl);
    return url.length;
  } catch {
    return -1; // Return -1 if estimation fails
  }
}

/**
 * Checks if a plan configuration can be safely shared via URL
 *
 * @param config - The shareable plan configuration
 * @param baseUrl - Base URL (defaults to current location if in browser)
 * @returns Object with validity status and details
 *
 * @example
 * ```typescript
 * const check = canShareViaUrl(config);
 * if (!check.canShare) {
 *   console.error(check.reason);
 * }
 * ```
 */
export function canShareViaUrl(
  config: ShareablePlanConfig,
  baseUrl?: string
): {
  canShare: boolean;
  estimatedLength: number;
  reason?: string;
} {
  try {
    ShareablePlanConfigSchema.parse(config);
    const length = estimateUrlLength(config, baseUrl);

    if (length === -1) {
      return {
        canShare: false,
        estimatedLength: -1,
        reason: 'Failed to estimate URL length',
      };
    }

    if (length > MAX_URL_LENGTH) {
      return {
        canShare: false,
        estimatedLength: length,
        reason: `URL length (${length}) exceeds recommended maximum (${MAX_URL_LENGTH})`,
      };
    }

    return {
      canShare: true,
      estimatedLength: length,
    };
  } catch (error) {
    let reason = 'Invalid configuration';

    if (error instanceof z.ZodError) {
      const errorMessages =
        error.issues?.map((e) => e.message).join(', ') || 'Schema validation failed';
      reason = `Invalid configuration: ${errorMessages}`;
    }

    return {
      canShare: false,
      estimatedLength: -1,
      reason,
    };
  }
}
