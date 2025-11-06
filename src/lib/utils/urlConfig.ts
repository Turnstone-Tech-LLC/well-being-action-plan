/**
 * URL Configuration Utilities
 *
 * This module provides functionality for encoding and decoding configurations into
 * URL-safe strings, supporting two distinct use cases:
 *
 * 1. **Plan Sharing**: Share well-being plan configurations between users
 *    - Uses `plan` URL parameter
 *    - Employs gzip compression via pako
 *    - Validates with Zod schemas
 *    - URL structure: `https://example.com/?plan={encoded_plan}`
 *
 * 2. **Provider Links**: Provider-generated onboarding links for patients
 *    - Uses `config` URL parameter
 *    - Simple base64 encoding
 *    - Contains provider information and preferences
 *    - URL structure: `https://example.com/?config={encoded_config}`
 *
 * ## Size Limitations
 *
 * - Target: Under 2000 characters for broad browser compatibility
 * - Plan sharing uses compression to keep URLs manageable
 * - Large plans may need to be simplified for sharing
 *
 * @module urlConfig
 */

import { z } from 'zod';
import pako from 'pako';
import { ZoneType } from '../types/zone';
import { ProviderLinkConfig, ProviderLinkParseResult } from '@/lib/types';

// ============================================================================
// PLAN SHARING - For sharing well-being plans between users
// ============================================================================

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
 * const encoded = encodePlanConfig(config);
 * // Returns: "eJyLjgUAARUAuQ..."
 * ```
 */
export function encodePlanConfig(config: ShareablePlanConfig): string {
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
 * const result = decodePlanConfig("eJyLjgUAARUAuQ...");
 * if (result.success) {
 *   console.log(result.data.title);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function decodePlanConfig(encoded: string): DecodeResult<ShareablePlanConfig> {
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
  const encoded = encodePlanConfig(config);

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

    return decodePlanConfig(encoded);
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

// ============================================================================
// PROVIDER LINKS - For provider-generated patient onboarding links
// ============================================================================

/**
 * URL parameter name for provider configuration
 */
export const PROVIDER_CONFIG_PARAM = 'config';

/**
 * Converts a string to URL-safe base64
 */
function toUrlSafeBase64(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Converts URL-safe base64 back to regular base64
 */
function fromUrlSafeBase64(str: string): string {
  // Add back padding
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  return str.replace(/-/g, '+').replace(/_/g, '/') + padding;
}

/**
 * Encodes a provider link configuration into a URL-safe string
 *
 * @param config - The provider link configuration to encode
 * @returns URL-safe base64 encoded string
 * @throws Error if the encoded string exceeds MAX_URL_LENGTH
 */
export function encodeProviderConfig(config: ProviderLinkConfig): string {
  try {
    // Serialize to JSON
    const json = JSON.stringify(config);

    // Convert to base64
    const base64 = btoa(json);

    // Make URL-safe
    const urlSafe = toUrlSafeBase64(base64);

    // Check length
    if (urlSafe.length > MAX_URL_LENGTH) {
      throw new Error(
        `Encoded configuration exceeds maximum URL length (${urlSafe.length} > ${MAX_URL_LENGTH})`
      );
    }

    return urlSafe;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to encode configuration: ${error.message}`);
    }
    throw new Error('Failed to encode configuration: Unknown error');
  }
}

/**
 * Decodes a URL-safe base64 string into a provider link configuration
 *
 * @param encoded - The URL-safe base64 encoded string
 * @returns Parsed provider link configuration
 * @throws Error if decoding or parsing fails
 */
export function decodeProviderConfig(encoded: string): ProviderLinkConfig {
  try {
    // Convert from URL-safe base64
    const base64 = fromUrlSafeBase64(encoded);

    // Decode from base64
    const json = atob(base64);

    // Parse JSON
    const config = JSON.parse(json) as ProviderLinkConfig;

    // Validate required fields
    if (!config.provider || !config.provider.id || !config.provider.name) {
      throw new Error('Invalid configuration: missing required provider fields');
    }

    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to decode configuration: ${error.message}`);
    }
    throw new Error('Failed to decode configuration: Unknown error');
  }
}

/**
 * Generates a complete URL with encoded provider configuration
 *
 * @param baseUrl - The base URL (e.g., 'https://example.com')
 * @param config - The provider link configuration
 * @returns Complete URL with encoded configuration parameter
 */
export function generateProviderUrl(baseUrl: string, config: ProviderLinkConfig): string {
  const encoded = encodeProviderConfig(config);
  const url = new URL(baseUrl);
  url.searchParams.set(PROVIDER_CONFIG_PARAM, encoded);
  return url.toString();
}

/**
 * Parses provider configuration from URL search parameters
 *
 * @param searchParams - URLSearchParams or search string (e.g., '?config=...')
 * @returns Parse result with success status and config or error
 */
export function parseProviderUrl(
  searchParams: URLSearchParams | string
): ProviderLinkParseResult {
  try {
    // Handle string input
    const params =
      typeof searchParams === 'string' ? new URLSearchParams(searchParams) : searchParams;

    // Get config parameter
    const encoded = params.get(PROVIDER_CONFIG_PARAM);

    if (!encoded) {
      return {
        success: false,
        error: 'No configuration parameter found in URL',
      };
    }

    // Decode configuration
    const config = decodeProviderConfig(encoded);

    return {
      success: true,
      config,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse provider URL',
    };
  }
}

/**
 * Validates a provider link configuration
 *
 * @param config - The configuration to validate
 * @returns true if valid, false otherwise
 */
export function validateProviderConfig(config: unknown): config is ProviderLinkConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const c = config as Partial<ProviderLinkConfig>;

  // Validate provider info
  if (!c.provider || typeof c.provider !== 'object') {
    return false;
  }

  if (!c.provider.id || typeof c.provider.id !== 'string') {
    return false;
  }

  if (!c.provider.name || typeof c.provider.name !== 'string') {
    return false;
  }

  return true;
}

// ============================================================================
// LEGACY EXPORTS - For backward compatibility
// ============================================================================

/**
 * @deprecated Use `encodePlanConfig` instead
 */
export const encodeConfig = encodePlanConfig;

/**
 * @deprecated Use `decodePlanConfig` instead
 */
export const decodeConfig = decodePlanConfig;
