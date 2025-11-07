/**
 * Provider Service
 *
 * Handles provider-specific operations including link management,
 * profile updates, and state persistence in Supabase.
 */

import { createClient } from '@/lib/supabase/client';
import type { ProviderProfile, ProviderLink, ProviderLinkConfig } from '@/lib/types/provider';

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
        updatedAt: new Date().toISOString(),
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
        providerId,
        linkConfig,
        encodedUrl,
        qrCodeUrl: options?.qrCodeUrl,
        expiresAt: options?.expiresAt?.toISOString(),
        isActive: true,
        metadata: options?.metadata || {},
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all active links for a provider
   */
  async getActiveLinks(providerId: string): Promise<ProviderLink[]> {
    const { data, error } = await this.supabase
      .from('provider_links')
      .select('*')
      .eq('providerId', providerId)
      .eq('isActive', true)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all links for a provider (including inactive)
   */
  async getAllLinks(providerId: string): Promise<ProviderLink[]> {
    const { data, error } = await this.supabase
      .from('provider_links')
      .select('*')
      .eq('providerId', providerId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update a link's status
   */
  async updateLinkStatus(linkId: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('provider_links')
      .update({ isActive })
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
        updatedAt: new Date().toISOString(),
      })
      .eq('id', providerId);

    if (error) throw error;
  }
}

// Export singleton instance
export const providerService = new ProviderService();
