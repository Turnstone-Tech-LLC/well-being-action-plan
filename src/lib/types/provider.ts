/**
 * Provider configuration types for shareable provider links
 */

import { WellBeingPlanConfig } from './well-being-plan';
import { CopingStrategy } from './coping-strategy';

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
  copingStrategies?: CopingStrategy[];
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

/**
 * Provider profile stored in Supabase database
 * This represents the authenticated provider's account information
 */
export interface ProviderProfile {
  id: string; // Matches Supabase auth.users.id
  email: string;
  name: string;
  organization?: string;
  logoUrl?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  settings?: {
    defaultMessage?: string;
    defaultStrategies?: string[];
    theme?: 'light' | 'dark' | 'auto';
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider link tracking for analytics and management
 * Stores information about generated links and their usage
 */
export interface ProviderLink {
  id: string;
  provider_id: string;
  link_config: ProviderLinkConfig;
  slug: string;
  qr_code_url?: string;
  created_at: Date;
  expires_at?: Date;
  is_active: boolean;
  metadata?: {
    patientCount?: number;
    lastAccessedAt?: string;
    notes?: string;
  };
}
