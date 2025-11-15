/**
 * Unified Data Access Layer
 *
 * Central module for all data operations, providing a consistent
 * interface for both Supabase (provider) and IndexedDB (patient) operations.
 */

import { getUserIdentity } from './userIdentityService';
import type { CheckIn, CopingStrategy } from '@/lib/types';
import type { UserConfig } from '@/lib/db';

// Re-export database functions with user identity integration
export * from '@/lib/db';

/**
 * Data source types
 */
export enum DataSource {
  IndexedDB = 'indexeddb',
  Supabase = 'supabase',
  Hybrid = 'hybrid', // Future: sync between sources
}

/**
 * Unified data operation result
 */
export interface DataResult<T> {
  data: T | null;
  error: Error | null;
  source: DataSource;
}

/**
 * Unified data access interface
 */
export interface DataAccessLayer {
  // Check-in operations
  createCheckIn(checkIn: Omit<CheckIn, 'id' | 'userId'>): Promise<DataResult<CheckIn>>;
  getCheckIns(options?: { limit?: number; zone?: string }): Promise<DataResult<CheckIn[]>>;
  getCheckInById(id: string): Promise<DataResult<CheckIn>>;
  deleteCheckIn(id: string): Promise<DataResult<void>>;

  // Coping strategy operations
  createCopingStrategy(
    strategy: Omit<CopingStrategy, 'id' | 'userId'>
  ): Promise<DataResult<CopingStrategy>>;
  getCopingStrategies(options?: { zone?: string }): Promise<DataResult<CopingStrategy[]>>;
  updateCopingStrategy(id: string, updates: Partial<CopingStrategy>): Promise<DataResult<void>>;
  deleteCopingStrategy(id: string): Promise<DataResult<void>>;

  // User config operations
  getUserConfig(): Promise<DataResult<UserConfig>>;
  updateUserConfig(updates: Partial<UserConfig>): Promise<DataResult<void>>;

  // Sync operations (future)
  syncToCloud?(): Promise<DataResult<void>>;
  syncFromCloud?(): Promise<DataResult<void>>;
}

/**
 * Patient Data Access Layer (IndexedDB only)
 */
export class PatientDataAccess implements DataAccessLayer {
  private userId: string | null = null;

  async initialize(): Promise<void> {
    const { userId } = await getUserIdentity();
    this.userId = userId;
  }

  private async ensureInitialized(): Promise<string> {
    if (!this.userId) {
      await this.initialize();
    }
    if (!this.userId) {
      throw new Error('Failed to initialize user identity');
    }
    return this.userId;
  }

  async createCheckIn(checkIn: Omit<CheckIn, 'id' | 'userId'>): Promise<DataResult<CheckIn>> {
    try {
      const userId = await this.ensureInitialized();
      const { createCheckIn } = await import('@/lib/db');

      const result = await createCheckIn({
        ...checkIn,
        userId,
      } as CheckIn);

      return {
        data: result,
        error: null,
        source: DataSource.IndexedDB,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        source: DataSource.IndexedDB,
      };
    }
  }

  async getCheckIns(options?: { limit?: number; zone?: string }): Promise<DataResult<CheckIn[]>> {
    try {
      const userId = await this.ensureInitialized();
      const { getCheckInsByUser } = await import('@/lib/db');

      const checkIns = await getCheckInsByUser(userId, options);

      return {
        data: checkIns,
        error: null,
        source: DataSource.IndexedDB,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        source: DataSource.IndexedDB,
      };
    }
  }

  async getCheckInById(id: string): Promise<DataResult<CheckIn>> {
    try {
      const { getCheckIn } = await import('@/lib/db');
      const checkIn = await getCheckIn(id);

      return {
        data: checkIn ?? null,
        error: null,
        source: DataSource.IndexedDB,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        source: DataSource.IndexedDB,
      };
    }
  }

  async deleteCheckIn(id: string): Promise<DataResult<void>> {
    try {
      const { deleteCheckIn } = await import('@/lib/db');
      await deleteCheckIn(id);

      return {
        data: undefined,
        error: null,
        source: DataSource.IndexedDB,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        source: DataSource.IndexedDB,
      };
    }
  }

  async createCopingStrategy(
    strategy: Omit<CopingStrategy, 'id' | 'userId'>
  ): Promise<DataResult<CopingStrategy>> {
    try {
      await this.ensureInitialized();
      const { createCopingStrategy } = await import('@/lib/db');

      const result = await createCopingStrategy(strategy as CopingStrategy);

      return {
        data: result,
        error: null,
        source: DataSource.IndexedDB,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        source: DataSource.IndexedDB,
      };
    }
  }

  async getCopingStrategies(options?: { zone?: string }): Promise<DataResult<CopingStrategy[]>> {
    try {
      await this.ensureInitialized();
      const { getAllCopingStrategies } = await import('@/lib/db');

      // Map zone to category if provided
      const dbOptions = options?.zone ? { category: options.zone } : undefined;
      const strategies = await getAllCopingStrategies(dbOptions);

      return {
        data: strategies,
        error: null,
        source: DataSource.IndexedDB,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        source: DataSource.IndexedDB,
      };
    }
  }

  async updateCopingStrategy(
    id: string,
    updates: Partial<CopingStrategy>
  ): Promise<DataResult<void>> {
    try {
      const { updateCopingStrategy } = await import('@/lib/db');
      await updateCopingStrategy(id, updates);

      return {
        data: undefined,
        error: null,
        source: DataSource.IndexedDB,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        source: DataSource.IndexedDB,
      };
    }
  }

  async deleteCopingStrategy(id: string): Promise<DataResult<void>> {
    try {
      const { deleteCopingStrategy } = await import('@/lib/db');
      await deleteCopingStrategy(id);

      return {
        data: undefined,
        error: null,
        source: DataSource.IndexedDB,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        source: DataSource.IndexedDB,
      };
    }
  }

  async getUserConfig(): Promise<DataResult<UserConfig>> {
    try {
      const userId = await this.ensureInitialized();
      const { getAllUserConfig } = await import('@/lib/db');

      const configs = await getAllUserConfig(userId);
      // Combine all configs into a single object
      const configObj = configs.reduce((acc, config) => {
        return { ...acc, [config.key]: config.value };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, {} as any);

      return {
        data: configObj as UserConfig,
        error: null,
        source: DataSource.IndexedDB,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        source: DataSource.IndexedDB,
      };
    }
  }

  async updateUserConfig(updates: Partial<UserConfig>): Promise<DataResult<void>> {
    try {
      const userId = await this.ensureInitialized();
      const { setUserConfig } = await import('@/lib/db');

      // Update each config key
      await Promise.all(
        Object.entries(updates).map(([key, value]) => setUserConfig(userId, key, value))
      );

      return {
        data: undefined,
        error: null,
        source: DataSource.IndexedDB,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        source: DataSource.IndexedDB,
      };
    }
  }
}

/**
 * Provider Data Access Layer (Supabase)
 * Note: Provider data is separate from patient data
 */
export class ProviderDataAccess {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any = null;

  async initialize(): Promise<void> {
    const { createClient } = await import('@/lib/supabase/client');
    this.supabase = createClient();
  }

  async getProviderProfile(providerId: string) {
    if (!this.supabase) await this.initialize();
    if (!this.supabase) throw new Error('Failed to initialize Supabase client');

    const { data, error } = await this.supabase
      .from('provider_profiles')
      .select('*')
      .eq('id', providerId)
      .single();

    return { data, error };
  }

  async getProviderLinks(providerId: string) {
    if (!this.supabase) await this.initialize();
    if (!this.supabase) throw new Error('Failed to initialize Supabase client');

    const { data, error } = await this.supabase
      .from('provider_links')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async createProviderLink(link: {
    provider_id: string;
    name: string;
    config: Record<string, unknown>;
  }) {
    if (!this.supabase) await this.initialize();
    if (!this.supabase) throw new Error('Failed to initialize Supabase client');

    const { data, error } = await this.supabase
      .from('provider_links')
      .insert(link)
      .select()
      .single();

    return { data, error };
  }

  async recordOnboardingCompletion(providerLinkId: string) {
    if (!this.supabase) await this.initialize();
    if (!this.supabase) throw new Error('Failed to initialize Supabase client');

    const { data, error } = await this.supabase.from('onboarding_completions').insert({
      provider_link_id: providerLinkId,
      completed_at: new Date().toISOString(),
    });

    return { data, error };
  }
}

/**
 * Factory function to get appropriate data access layer
 */
export function getDataAccess(
  mode: 'patient' | 'provider'
): PatientDataAccess | ProviderDataAccess {
  if (mode === 'patient') {
    return new PatientDataAccess();
  } else {
    return new ProviderDataAccess();
  }
}

/**
 * Hook for patient data access
 */
export function usePatientData() {
  const [dataAccess] = useState(() => new PatientDataAccess());
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    dataAccess
      .initialize()
      .then(() => setInitialized(true))
      .catch(setError);
  }, [dataAccess]);

  return { dataAccess, initialized, error };
}

/**
 * Hook for provider data access
 */
export function useProviderData() {
  const [dataAccess] = useState(() => new ProviderDataAccess());
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    dataAccess
      .initialize()
      .then(() => setInitialized(true))
      .catch(setError);
  }, [dataAccess]);

  return { dataAccess, initialized, error };
}

// Add missing imports
import { useState, useEffect } from 'react';
