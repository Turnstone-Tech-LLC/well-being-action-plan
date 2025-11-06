/**
 * Provider configuration types for shareable provider links
 */

import { WellBeingPlanConfig } from './well-being-plan';

/**
 * Provider information embedded in shareable links
 */
export interface ProviderInfo {
  id: string;
  name: string;
  organization?: string;
  logoUrl?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

/**
 * Complete provider link configuration
 * This is encoded in the URL and parsed on the landing page
 */
export interface ProviderLinkConfig {
  provider: ProviderInfo;
  planConfig?: Partial<WellBeingPlanConfig>;
  customMessage?: string;
  redirectUrl?: string;
}

/**
 * Result of parsing a provider link
 */
export interface ProviderLinkParseResult {
  success: boolean;
  config?: ProviderLinkConfig;
  error?: string;
}
