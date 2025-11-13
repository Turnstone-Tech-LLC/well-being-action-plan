/**
 * Provider Service
 *
 * Handles provider-specific operations including link management,
 * profile updates, and state persistence in Supabase.
 */

import { createClient } from '@/lib/supabase/client';
import type { ProviderProfile, ProviderLink, ProviderLinkConfig } from '@/lib/types/provider';
import { generateUniqueSlug, normalizeSlug } from '@/lib/utils/slugGenerator';

export class ProviderService {
  private supabase = createClient();

  /**
   * Create or update a provider profile
   */
  async upsertProfile(
    profile: Omit<ProviderProfile, 'createdAt' | 'updatedAt'>
  ): Promise<ProviderProfile> {
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
   * Create a new provider link with slug
   * Generates a unique Vermont-inspired slug and saves the link to the database
   */
  async createLink(
    providerId: string,
    linkConfig: ProviderLinkConfig,
    encodedUrl: string,
    options?: {
      slug?: string;
      qrCodeUrl?: string;
      expiresAt?: Date;
      metadata?: ProviderLink['metadata'];
    }
  ): Promise<ProviderLink> {
    // Generate or validate slug
    let slug = options?.slug;
    if (slug) {
      const normalized = normalizeSlug(slug);
      if (!normalized) {
        throw new Error(`Invalid slug format: ${slug}`);
      }
      slug = normalized;
    } else {
      // Generate unique slug
      slug = await generateUniqueSlug((s) => this.slugExists(s));
    }

    const { data, error } = await this.supabase
      .from('provider_links')
      .insert({
        provider_id: providerId,
        link_config: linkConfig,
        encoded_url: encodedUrl,
        slug,
        qr_code_url: options?.qrCodeUrl,
        expires_at: options?.expiresAt?.toISOString(),
        is_active: true,
        metadata: options?.metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error details:', {
        message: error.message,
        code: (error as unknown as Record<string, unknown>).code,
        details: (error as unknown as Record<string, unknown>).details,
        hint: (error as unknown as Record<string, unknown>).hint,
        fullError: error,
      });
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`Failed to create provider link: ${errorMessage}`);
    }
    return data;
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

    if (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`Failed to fetch active links: ${errorMessage}`);
    }
    return data || [];
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

    if (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`Failed to fetch all links: ${errorMessage}`);
    }
    return data || [];
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
    const { error } = await this.supabase.from('provider_links').delete().eq('id', linkId);

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
    const activeLinks = links.filter((link) => link.is_active).length;
    const totalPatients = links.reduce((sum, link) => sum + (link.metadata?.patientCount || 0), 0);

    return {
      totalLinks,
      activeLinks,
      totalPatients,
    };
  }

  /**
   * Update provider settings
   */
  async updateSettings(providerId: string, settings: ProviderProfile['settings']): Promise<void> {
    const { error } = await this.supabase
      .from('provider_profiles')
      .update({
        settings,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', providerId);

    if (error) throw error;
  }

  /**
   * Get a provider link by ID
   * Used by detail page to retrieve full link information
   */
  async getLinkById(linkId: string): Promise<ProviderLink | null> {
    const { data, error } = await this.supabase
      .from('provider_links')
      .select('*')
      .eq('id', linkId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Get a provider link by slug
   * Used by public API to retrieve link configuration
   */
  async getLinkBySlug(slug: string): Promise<ProviderLink | null> {
    const { data, error } = await this.supabase
      .from('provider_links')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Check if a slug already exists
   */
  private async slugExists(slug: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('provider_links')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error && error.code === 'PGRST116') return false; // Not found
    return !!data;
  }

  /**
   * Update a link's slug
   */
  async updateLinkSlug(linkId: string, newSlug: string): Promise<void> {
    const normalized = normalizeSlug(newSlug);
    if (!normalized) {
      throw new Error(`Invalid slug format: ${newSlug}`);
    }

    const { error } = await this.supabase
      .from('provider_links')
      .update({ slug: normalized })
      .eq('id', linkId);

    if (error) throw error;
  }

  /**
   * Update a link's expiration date
   */
  async updateLinkExpiration(linkId: string, expiresAt: Date | null): Promise<void> {
    const { error } = await this.supabase
      .from('provider_links')
      .update({ expires_at: expiresAt?.toISOString() || null })
      .eq('id', linkId);

    if (error) throw error;
  }

  /**
   * Renew a link (extend expiration by 30 days)
   */
  async renewLink(linkId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.updateLinkExpiration(linkId, expiresAt);
  }

  /**
   * Increment patient count for a link
   */
  async incrementPatientCount(linkId: string): Promise<void> {
    const link = await this.supabase
      .from('provider_links')
      .select('metadata')
      .eq('id', linkId)
      .single();

    if (link.error) throw link.error;

    const metadata = link.data?.metadata || {};
    const patientCount = (metadata.patientCount || 0) + 1;

    await this.updateLinkMetadata(linkId, {
      ...metadata,
      patientCount,
      lastAccessedAt: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const providerService = new ProviderService();
