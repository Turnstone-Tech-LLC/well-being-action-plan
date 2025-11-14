/**
 * IndexedDB Database Setup using Dexie.js
 *
 * This module configures the client-side database for the Well-Being Action Plan app.
 * It provides offline-first data persistence with type-safe CRUD operations.
 *
 * @module db
 */

import Dexie, { type EntityTable } from 'dexie';
import type { CheckIn } from '@/lib/types/check-in';
import type { CopingStrategy } from '@/lib/types/coping-strategy';
import type { ProviderProfile, ProviderLink } from '@/lib/types/provider';

/**
 * User configuration interface for storing app-level settings and preferences
 */
export interface UserConfig {
  id: string;
  userId: string;
  key: string;
  value: string | number | boolean | object;
  updatedAt: Date;
}

/**
 * Cached provider profile for offline access
 * Extends ProviderProfile with cache metadata
 */
export interface CachedProviderProfile extends ProviderProfile {
  cachedAt: Date;
}

/**
 * Cached provider link for offline access
 * Extends ProviderLink with cache metadata
 */
export interface CachedProviderLink extends ProviderLink {
  cachedAt: Date;
}

/**
 * Pending change operation for sync queue
 * Tracks operations to be synced when connection is restored
 */
export interface PendingChange {
  id: string;
  timestamp: Date;
  operation: 'create' | 'update' | 'delete';
  entity: 'profile' | 'link';
  entityId: string;
  data: ProviderProfile | ProviderLink | { id: string };
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  lastError?: string;
}

/**
 * Database schema version history and migration guide:
 *
 * Version 2 (Current):
 * - Added provider offline support tables:
 *   - providerProfiles: Cached provider account data
 *     - Indexed by: id (primary), cachedAt
 *   - providerLinks: Cached provider-generated patient links
 *     - Indexed by: id (primary), provider_id, cachedAt, is_active
 *   - pendingChanges: Sync queue for offline operations
 *     - Indexed by: id (primary), status, timestamp, entity
 *
 * Version 1:
 * - checkIns: Core emotional state tracking
 *   - Indexed by: id (primary), userId, timestamp, zone
 *   - Multi-entry indexes: triggerIds, copingStrategyIds (for array searches)
 *
 * - copingStrategies: Coping strategy library
 *   - Indexed by: id (primary), category, isFavorite
 *
 * - userConfig: Application configuration and preferences
 *   - Indexed by: id (primary), userId, key
 *   - Compound index: [userId+key] for efficient user-specific config lookups
 *
 * ## Migration Strategy for Future Schema Changes
 *
 * When updating the schema:
 * 1. Increment the version number in db.version()
 * 2. Add a new .stores() call with the updated schema
 * 3. Use .upgrade() hook for data migrations
 *
 * Example:
 * ```typescript
 * db.version(2).stores({
 *   checkIns: '&id, userId, timestamp, zone, *triggerIds, *copingStrategyIds, newField',
 *   // ... other tables
 * }).upgrade(tx => {
 *   return tx.table('checkIns').toCollection().modify(checkIn => {
 *     checkIn.newField = 'defaultValue';
 *   });
 * });
 * ```
 *
 * For breaking changes, create a new version and migrate data:
 * - Version N: Old schema
 * - Version N+1: New schema with migration logic
 *
 * Dexie automatically handles:
 * - Adding new tables
 * - Adding new indexes to existing tables
 * - Creating databases on first access
 *
 * Manual migration needed for:
 * - Removing indexes (just omit from new schema)
 * - Changing index types
 * - Transforming existing data
 * - Renaming fields (requires .upgrade() hook)
 */

/**
 * WellBeingDB - Main database class
 *
 * Extends Dexie to provide type-safe access to application data stores.
 * Stores are automatically typed as EntityTable<T> for compile-time safety.
 */
class WellBeingDB extends Dexie {
  checkIns!: EntityTable<CheckIn, 'id'>;
  copingStrategies!: EntityTable<CopingStrategy, 'id'>;
  userConfig!: EntityTable<UserConfig, 'id'>;
  providerProfiles!: EntityTable<CachedProviderProfile, 'id'>;
  providerLinks!: EntityTable<CachedProviderLink, 'id'>;
  pendingChanges!: EntityTable<PendingChange, 'id'>;

  constructor() {
    super('WellBeingActionPlanDB');

    // Version 1: Initial schema
    this.version(1).stores({
      // CheckIns table with indexes for efficient querying
      // &id: Primary key (unique)
      // userId: Index for filtering by user
      // timestamp: Index for time-based queries
      // zone: Index for filtering by emotional zone
      // *triggerIds, *copingStrategyIds: Multi-entry indexes for array fields
      checkIns: '&id, userId, timestamp, zone, *triggerIds, *copingStrategyIds',

      // CopingStrategies table
      // &id: Primary key (unique)
      // category: Index for filtering by category
      // isFavorite: Index for quickly finding favorites
      copingStrategies: '&id, category, isFavorite',

      // UserConfig table
      // &id: Primary key (unique)
      // [userId+key]: Compound index for efficient user-specific config lookups
      // userId: Index for filtering by user
      // key: Index for filtering by config key
      userConfig: '&id, [userId+key], userId, key',
    });

    // Version 2: Provider offline support
    this.version(2).stores({
      // Keep existing tables (Dexie auto-copies from previous version)
      checkIns: '&id, userId, timestamp, zone, *triggerIds, *copingStrategyIds',
      copingStrategies: '&id, category, isFavorite',
      userConfig: '&id, [userId+key], userId, key',

      // New provider tables
      // ProviderProfiles: Cached provider account data
      // &id: Primary key (provider ID from Supabase auth)
      // cachedAt: Index for cache expiration queries
      providerProfiles: '&id, cachedAt',

      // ProviderLinks: Cached provider-generated patient links
      // &id: Primary key (link ID)
      // provider_id: Index for filtering by provider
      // cachedAt: Index for cache expiration queries
      // is_active: Index for filtering active/inactive links
      providerLinks: '&id, provider_id, cachedAt, is_active',

      // PendingChanges: Sync queue for offline operations
      // &id: Primary key (change ID)
      // status: Index for filtering by sync status
      // timestamp: Index for chronological processing
      // entity: Index for filtering by entity type
      pendingChanges: '&id, status, timestamp, entity',
    });
  }
}

// Create and export singleton database instance
export const db = new WellBeingDB();

/**
 * Helper function to generate a unique ID
 * Uses crypto.randomUUID() if available, falls back to timestamp-based ID
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// =============================================================================
// CheckIn CRUD Operations
// =============================================================================

/**
 * Create a new check-in entry
 *
 * @param checkIn - Check-in data (id and timestamp will be auto-generated if not provided)
 * @returns The created check-in with generated fields
 */
export async function createCheckIn(
  checkIn: Omit<CheckIn, 'id' | 'timestamp'> & { id?: string; timestamp?: Date }
): Promise<CheckIn> {
  const newCheckIn: CheckIn = {
    id: checkIn.id || generateId(),
    timestamp: checkIn.timestamp || new Date(),
    ...checkIn,
  };

  await db.checkIns.add(newCheckIn);
  return newCheckIn;
}

/**
 * Get a check-in by ID
 *
 * @param id - Check-in ID
 * @returns The check-in or undefined if not found
 */
export async function getCheckIn(id: string): Promise<CheckIn | undefined> {
  return await db.checkIns.get(id);
}

/**
 * Get all check-ins for a specific user
 *
 * @param userId - User ID
 * @param options - Optional query parameters
 * @returns Array of check-ins sorted by timestamp (newest first)
 */
export async function getCheckInsByUser(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    zone?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<CheckIn[]> {
  let query = db.checkIns.where('userId').equals(userId);

  // Apply date range filter if provided
  if (options?.startDate || options?.endDate) {
    query = db.checkIns
      .where('timestamp')
      .between(options.startDate || new Date(0), options.endDate || new Date(), true, true)
      .and((checkIn) => checkIn.userId === userId);
  }

  // Apply zone filter if provided
  if (options?.zone) {
    query = query.and((checkIn) => checkIn.zone === options.zone);
  }

  // Sort by timestamp descending and apply pagination
  return await query
    .reverse()
    .offset(options?.offset || 0)
    .limit(options?.limit || 1000)
    .sortBy('timestamp');
}

/**
 * Update an existing check-in
 *
 * @param id - Check-in ID
 * @param updates - Partial check-in data to update
 * @returns The number of updated records (1 if successful, 0 if not found)
 */
export async function updateCheckIn(
  id: string,
  updates: Partial<Omit<CheckIn, 'id'>>
): Promise<number> {
  return await db.checkIns.update(id, updates);
}

/**
 * Delete a check-in by ID
 *
 * @param id - Check-in ID
 * @returns void
 */
export async function deleteCheckIn(id: string): Promise<void> {
  await db.checkIns.delete(id);
}

/**
 * Delete all check-ins for a specific user
 *
 * @param userId - User ID
 * @returns The number of deleted records
 */
export async function deleteCheckInsByUser(userId: string): Promise<number> {
  return await db.checkIns.where('userId').equals(userId).delete();
}

// =============================================================================
// CopingStrategy CRUD Operations
// =============================================================================

/**
 * Create a new coping strategy
 *
 * @param strategy - Coping strategy data (id, createdAt, updatedAt will be auto-generated if not provided)
 * @returns The created coping strategy with generated fields
 */
export async function createCopingStrategy(
  strategy: Omit<CopingStrategy, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
): Promise<CopingStrategy> {
  const now = new Date();
  const newStrategy: CopingStrategy = {
    id: strategy.id || generateId(),
    createdAt: strategy.createdAt || now,
    updatedAt: strategy.updatedAt || now,
    ...strategy,
  };

  await db.copingStrategies.add(newStrategy);
  return newStrategy;
}

/**
 * Get a coping strategy by ID
 *
 * @param id - Coping strategy ID
 * @returns The coping strategy or undefined if not found
 */
export async function getCopingStrategy(id: string): Promise<CopingStrategy | undefined> {
  return await db.copingStrategies.get(id);
}

/**
 * Get all coping strategies
 *
 * @param options - Optional query parameters
 * @returns Array of coping strategies
 */
export async function getAllCopingStrategies(options?: {
  category?: string;
  isFavorite?: boolean;
  limit?: number;
  offset?: number;
}): Promise<CopingStrategy[]> {
  let query = db.copingStrategies.toCollection();

  // Apply filters
  if (options?.category) {
    query = db.copingStrategies.where('category').equals(options.category);
  }

  if (options?.isFavorite !== undefined) {
    const favValue = options.isFavorite ? 1 : 0;
    query = query.and((strategy) => (strategy.isFavorite ? 1 : 0) === favValue);
  }

  // Apply pagination
  return await query
    .offset(options?.offset || 0)
    .limit(options?.limit || 1000)
    .toArray();
}

/**
 * Get favorite coping strategies
 *
 * @returns Array of favorite coping strategies
 */
export async function getFavoriteCopingStrategies(): Promise<CopingStrategy[]> {
  return await db.copingStrategies.filter((strategy) => strategy.isFavorite === true).toArray();
}

/**
 * Update an existing coping strategy
 *
 * @param id - Coping strategy ID
 * @param updates - Partial coping strategy data to update
 * @returns The number of updated records (1 if successful, 0 if not found)
 */
export async function updateCopingStrategy(
  id: string,
  updates: Partial<Omit<CopingStrategy, 'id'>>
): Promise<number> {
  const updateData = {
    ...updates,
    updatedAt: new Date(),
  };
  return await db.copingStrategies.update(id, updateData);
}

/**
 * Delete a coping strategy by ID
 *
 * @param id - Coping strategy ID
 * @returns void
 */
export async function deleteCopingStrategy(id: string): Promise<void> {
  await db.copingStrategies.delete(id);
}

/**
 * Toggle favorite status of a coping strategy
 *
 * @param id - Coping strategy ID
 * @returns The updated favorite status
 */
export async function toggleCopingStrategyFavorite(id: string): Promise<boolean> {
  const strategy = await db.copingStrategies.get(id);
  if (!strategy) {
    throw new Error(`Coping strategy with id ${id} not found`);
  }

  const newFavoriteStatus = !strategy.isFavorite;
  await db.copingStrategies.update(id, {
    isFavorite: newFavoriteStatus,
    updatedAt: new Date(),
  });

  return newFavoriteStatus;
}

// =============================================================================
// UserConfig CRUD Operations
// =============================================================================

/**
 * Set a user configuration value
 *
 * @param userId - User ID
 * @param key - Configuration key
 * @param value - Configuration value
 * @returns The created or updated config entry
 */
export async function setUserConfig(
  userId: string,
  key: string,
  value: string | number | boolean | object
): Promise<UserConfig> {
  // Check if config already exists
  const existing = await db.userConfig.where('[userId+key]').equals([userId, key]).first();

  const config: UserConfig = {
    id: existing?.id || generateId(),
    userId,
    key,
    value,
    updatedAt: new Date(),
  };

  await db.userConfig.put(config);
  return config;
}

/**
 * Get a user configuration value
 *
 * @param userId - User ID
 * @param key - Configuration key
 * @returns The configuration value or undefined if not found
 */
export async function getUserConfig(userId: string, key: string): Promise<UserConfig | undefined> {
  return await db.userConfig.where('[userId+key]').equals([userId, key]).first();
}

/**
 * Get all configuration entries for a user
 *
 * @param userId - User ID
 * @returns Array of user config entries
 */
export async function getAllUserConfig(userId: string): Promise<UserConfig[]> {
  return await db.userConfig.where('userId').equals(userId).toArray();
}

/**
 * Delete a user configuration entry
 *
 * @param userId - User ID
 * @param key - Configuration key
 * @returns The number of deleted records
 */
export async function deleteUserConfig(userId: string, key: string): Promise<number> {
  return await db.userConfig.where('[userId+key]').equals([userId, key]).delete();
}

/**
 * Delete all configuration entries for a user
 *
 * @param userId - User ID
 * @returns The number of deleted records
 */
export async function deleteAllUserConfig(userId: string): Promise<number> {
  return await db.userConfig.where('userId').equals(userId).delete();
}

// =============================================================================
// Database Utility Functions
// =============================================================================

/**
 * Clear all data from the database (useful for testing or reset)
 * ⚠️ WARNING: This will delete all data!
 */
export async function clearAllData(): Promise<void> {
  await db.transaction(
    'rw',
    db.checkIns,
    db.copingStrategies,
    db.userConfig,
    db.providerProfiles,
    db.providerLinks,
    db.pendingChanges,
    async () => {
      await db.checkIns.clear();
      await db.copingStrategies.clear();
      await db.userConfig.clear();
      await db.providerProfiles.clear();
      await db.providerLinks.clear();
      await db.pendingChanges.clear();
    }
  );
}

/**
 * Get database statistics
 *
 * @returns Object with count of records in each table
 */
export async function getDbStats(): Promise<{
  checkIns: number;
  copingStrategies: number;
  userConfig: number;
  providerProfiles: number;
  providerLinks: number;
  pendingChanges: number;
}> {
  const [checkIns, copingStrategies, userConfig, providerProfiles, providerLinks, pendingChanges] =
    await Promise.all([
      db.checkIns.count(),
      db.copingStrategies.count(),
      db.userConfig.count(),
      db.providerProfiles.count(),
      db.providerLinks.count(),
      db.pendingChanges.count(),
    ]);

  return {
    checkIns,
    copingStrategies,
    userConfig,
    providerProfiles,
    providerLinks,
    pendingChanges,
  };
}

/**
 * Export all data from the database (for backup purposes)
 *
 * @returns Object containing all data from all tables
 */
export async function exportData(): Promise<{
  checkIns: CheckIn[];
  copingStrategies: CopingStrategy[];
  userConfig: UserConfig[];
  providerProfiles: CachedProviderProfile[];
  providerLinks: CachedProviderLink[];
  pendingChanges: PendingChange[];
}> {
  const [checkIns, copingStrategies, userConfig, providerProfiles, providerLinks, pendingChanges] =
    await Promise.all([
      db.checkIns.toArray(),
      db.copingStrategies.toArray(),
      db.userConfig.toArray(),
      db.providerProfiles.toArray(),
      db.providerLinks.toArray(),
      db.pendingChanges.toArray(),
    ]);

  return {
    checkIns,
    copingStrategies,
    userConfig,
    providerProfiles,
    providerLinks,
    pendingChanges,
  };
}

/**
 * Import data into the database (for restore purposes)
 * ⚠️ WARNING: This will overwrite existing data with the same IDs
 *
 * @param data - Object containing data to import
 */
export async function importData(data: {
  checkIns?: CheckIn[];
  copingStrategies?: CopingStrategy[];
  userConfig?: UserConfig[];
  providerProfiles?: CachedProviderProfile[];
  providerLinks?: CachedProviderLink[];
  pendingChanges?: PendingChange[];
}): Promise<void> {
  await db.transaction(
    'rw',
    db.checkIns,
    db.copingStrategies,
    db.userConfig,
    db.providerProfiles,
    db.providerLinks,
    db.pendingChanges,
    async () => {
      if (data.checkIns) {
        await db.checkIns.bulkPut(data.checkIns);
      }
      if (data.copingStrategies) {
        await db.copingStrategies.bulkPut(data.copingStrategies);
      }
      if (data.userConfig) {
        await db.userConfig.bulkPut(data.userConfig);
      }
      if (data.providerProfiles) {
        await db.providerProfiles.bulkPut(data.providerProfiles);
      }
      if (data.providerLinks) {
        await db.providerLinks.bulkPut(data.providerLinks);
      }
      if (data.pendingChanges) {
        await db.pendingChanges.bulkPut(data.pendingChanges);
      }
    }
  );
}

// =============================================================================
// Patient User Config Convenience Functions
// =============================================================================

const DEFAULT_PATIENT_USER_ID = 'patient';

/**
 * Get the current patient's configuration as a typed object
 * Convenience wrapper that returns all config as a single object
 *
 * @returns Promise<Record<string, unknown>> - Object containing all patient config
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPatientConfig(): Promise<Record<string, any>> {
  const configs = await getAllUserConfig(DEFAULT_PATIENT_USER_ID);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configObj: Record<string, any> = {};

  for (const config of configs) {
    configObj[config.key] = config.value;
  }

  return configObj;
}

/**
 * Update multiple patient configuration values at once
 * Convenience wrapper for batch updates
 *
 * @param updates - Object with key-value pairs to update
 * @returns Promise<void>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePatientConfig(updates: Record<string, any>): Promise<void> {
  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      setUserConfig(DEFAULT_PATIENT_USER_ID, key, value)
    )
  );
}
