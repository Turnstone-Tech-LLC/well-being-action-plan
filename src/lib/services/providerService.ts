/**
 * Provider Service
 *
 * Handles provider-specific operations including link management,
 * profile updates, and state persistence in Supabase.
 */

import { createClient } from '@/lib/supabase/client';
import type { ProviderProfile, ProviderLink, ProviderLinkConfig } from '@/lib/types/provider';

/**
 * Database row type with snake_case columns
 */
interface ProviderLinkRow {
  id: string;
  provider_id: string;
  link_config: ProviderLinkConfig;
  encoded_url: string;
  qr_code_url?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  metadata?: {
    patientCount?: number;
    lastAccessedAt?: string;
    notes?: string;
  };
}

/**
 * Convert database row to ProviderLink object
 */
function mapRowToProviderLink(row: ProviderLinkRow): ProviderLink {
  return {
    id: row.id,
    providerId: row.provider_id,
    linkConfig: row.link_config,
    encodedUrl: row.encoded_url,
    qrCodeUrl: row.qr_code_url,
    createdAt: new Date(row.created_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    isActive: row.is_active,
    metadata: row.metadata,
  };
}

export class ProviderService {
  private supabase = createClient();

  /**
   * Create or update a provider profile
   */
  async upsertProfile(profile: Omit<ProviderProfile, 'createdAt' | 'updatedAt'>): Promise<ProviderProfile> {
    const { data, error } = await this.supabase
      .from('provider_profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get provider profile by ID
   */
  async getProfile(providerId: string): Promise<ProviderProfile | null> {
    const { data, error } = await this.supabase
      .from('provider_profiles')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Create a new provider link
   */
  async createLink(
    providerId: string,
    linkConfig: ProviderLinkConfig,
    encodedUrl: string,
    options?: {
      qrCodeUrl?: string;
      expiresAt?: Date;
      metadata?: ProviderLink['metadata'];
    }
  ): Promise<ProviderLink> {
    const { data, error } = await this.supabase
      .from('provider_links')
      .insert({
        provider_id: providerId,
        link_config: linkConfig,
        encoded_url: encodedUrl,
        qr_code_url: options?.qrCodeUrl,
        expires_at: options?.expiresAt?.toISOString(),
        is_active: true,
        metadata: options?.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return mapRowToProviderLink(data as ProviderLinkRow);
  }

  /**
   * Get all active links for a provider
   */
  async getActiveLinks(providerId: string): Promise<ProviderLink[]> {
    const { data, error } = await this.supabase
      .from('provider_links')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as ProviderLinkRow[] || []).map(mapRowToProviderLink);
  }

  /**
   * Get all links for a provider (including inactive)
   */
  async getAllLinks(providerId: string): Promise<ProviderLink[]> {
    const { data, error } = await this.supabase
      .from('provider_links')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as ProviderLinkRow[] || []).map(mapRowToProviderLink);
  }

  /**
   * Update a link's status
   */
  async updateLinkStatus(linkId: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('provider_links')
      .update({ is_active: isActive })
      .eq('id', linkId);

    if (error) throw error;
  }

  /**
   * Update link metadata (e.g., patient count, last accessed)
   */
  async updateLinkMetadata(linkId: string, metadata: ProviderLink['metadata']): Promise<void> {
    const { error } = await this.supabase
      .from('provider_links')
      .update({ metadata })
      .eq('id', linkId);

    if (error) throw error;
  }

  /**
   * Delete a link
   */
  async deleteLink(linkId: string): Promise<void> {
    const { error } = await this.supabase
      .from('provider_links')
      .delete()
      .eq('id', linkId);

    if (error) throw error;
  }

  /**
   * Get link statistics for a provider
   */
  async getLinkStats(providerId: string): Promise<{
    totalLinks: number;
    activeLinks: number;
    totalPatients: number;
  }> {
    const links = await this.getAllLinks(providerId);

    const totalLinks = links.length;
    const activeLinks = links.filter(link => link.isActive).length;
    const totalPatients = links.reduce(
      (sum, link) => sum + (link.metadata?.patientCount || 0),
      0
    );

    return {
      totalLinks,
      activeLinks,
      totalPatients,
    };
  }

  /**
   * Update provider settings
   */
  async updateSettings(
    providerId: string,
    settings: ProviderProfile['settings']
  ): Promise<void> {
    const { error } = await this.supabase
      .from('provider_profiles')
      .update({
        settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', providerId);

    if (error) throw error;
  }
}

// Export singleton instance
export const providerService = new ProviderService();
