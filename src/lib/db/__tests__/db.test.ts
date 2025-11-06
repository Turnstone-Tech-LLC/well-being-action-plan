/**
 * Unit tests for IndexedDB database operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  createCheckIn,
  getCheckIn,
  getCheckInsByUser,
  updateCheckIn,
  deleteCheckIn,
  deleteCheckInsByUser,
  createCopingStrategy,
  getCopingStrategy,
  getAllCopingStrategies,
  getFavoriteCopingStrategies,
  updateCopingStrategy,
  deleteCopingStrategy,
  toggleCopingStrategyFavorite,
  setUserConfig,
  getUserConfig,
  getAllUserConfig,
  deleteUserConfig,
  deleteAllUserConfig,
  getDbStats,
  exportData,
  importData,
  generateId,
} from '../index';
import { ZoneType } from '@/lib/types/zone';
import { CopingStrategyCategory } from '@/lib/types/coping-strategy';

describe('Database Initialization', () => {
  it('should initialize the database with correct tables', () => {
    expect(db.name).toBe('WellBeingActionPlanDB');
    expect(db.tables).toHaveLength(3);
    expect(db.tables.map((t) => t.name)).toEqual([
      'checkIns',
      'copingStrategies',
      'userConfig',
    ]);
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });
});

describe('CheckIn CRUD Operations', () => {
  const testUserId = 'test-user-1';

  it('should create a check-in with auto-generated ID and timestamp', async () => {
    const checkIn = await createCheckIn({
      userId: testUserId,
      zone: ZoneType.Green,
      notes: 'Feeling good today',
    });

    expect(checkIn.id).toBeTruthy();
    expect(checkIn.timestamp).toBeInstanceOf(Date);
    expect(checkIn.userId).toBe(testUserId);
    expect(checkIn.zone).toBe(ZoneType.Green);
    expect(checkIn.notes).toBe('Feeling good today');
  });

  it('should create a check-in with provided ID and timestamp', async () => {
    const customId = 'custom-id-123';
    const customTimestamp = new Date('2025-01-01');

    const checkIn = await createCheckIn({
      id: customId,
      timestamp: customTimestamp,
      userId: testUserId,
      zone: ZoneType.Yellow,
    });

    expect(checkIn.id).toBe(customId);
    expect(checkIn.timestamp).toEqual(customTimestamp);
  });

  it('should get a check-in by ID', async () => {
    const created = await createCheckIn({
      userId: testUserId,
      zone: ZoneType.Red,
      moodRating: 3,
    });

    const retrieved = await getCheckIn(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.zone).toBe(ZoneType.Red);
    expect(retrieved?.moodRating).toBe(3);
  });

  it('should return undefined for non-existent check-in', async () => {
    const retrieved = await getCheckIn('non-existent-id');
    expect(retrieved).toBeUndefined();
  });

  it('should get check-ins by user ID', async () => {
    // Create multiple check-ins for the same user
    await createCheckIn({ userId: testUserId, zone: ZoneType.Green });
    await createCheckIn({ userId: testUserId, zone: ZoneType.Yellow });
    await createCheckIn({ userId: 'other-user', zone: ZoneType.Red });

    const userCheckIns = await getCheckInsByUser(testUserId);
    expect(userCheckIns).toHaveLength(2);
    expect(userCheckIns.every((c) => c.userId === testUserId)).toBe(true);
  });

  it('should filter check-ins by zone', async () => {
    await createCheckIn({ userId: testUserId, zone: ZoneType.Green });
    await createCheckIn({ userId: testUserId, zone: ZoneType.Yellow });
    await createCheckIn({ userId: testUserId, zone: ZoneType.Green });

    const greenCheckIns = await getCheckInsByUser(testUserId, {
      zone: ZoneType.Green,
    });
    expect(greenCheckIns).toHaveLength(2);
    expect(greenCheckIns.every((c) => c.zone === ZoneType.Green)).toBe(true);
  });

  it('should filter check-ins by date range', async () => {
    const date1 = new Date('2025-01-01');
    const date2 = new Date('2025-01-15');
    const date3 = new Date('2025-02-01');

    await createCheckIn({ userId: testUserId, zone: ZoneType.Green, timestamp: date1 });
    await createCheckIn({ userId: testUserId, zone: ZoneType.Yellow, timestamp: date2 });
    await createCheckIn({ userId: testUserId, zone: ZoneType.Red, timestamp: date3 });

    const checkInsInRange = await getCheckInsByUser(testUserId, {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
    });

    expect(checkInsInRange).toHaveLength(2);
  });

  it('should update a check-in', async () => {
    const checkIn = await createCheckIn({
      userId: testUserId,
      zone: ZoneType.Green,
    });

    const updateCount = await updateCheckIn(checkIn.id, {
      zone: ZoneType.Yellow,
      notes: 'Updated notes',
      moodRating: 7,
    });

    expect(updateCount).toBe(1);

    const updated = await getCheckIn(checkIn.id);
    expect(updated?.zone).toBe(ZoneType.Yellow);
    expect(updated?.notes).toBe('Updated notes');
    expect(updated?.moodRating).toBe(7);
  });

  it('should return 0 when updating non-existent check-in', async () => {
    const updateCount = await updateCheckIn('non-existent-id', {
      zone: ZoneType.Yellow,
    });
    expect(updateCount).toBe(0);
  });

  it('should delete a check-in', async () => {
    const checkIn = await createCheckIn({
      userId: testUserId,
      zone: ZoneType.Green,
    });

    await deleteCheckIn(checkIn.id);

    const retrieved = await getCheckIn(checkIn.id);
    expect(retrieved).toBeUndefined();
  });

  it('should delete all check-ins for a user', async () => {
    await createCheckIn({ userId: testUserId, zone: ZoneType.Green });
    await createCheckIn({ userId: testUserId, zone: ZoneType.Yellow });
    await createCheckIn({ userId: 'other-user', zone: ZoneType.Red });

    const deleteCount = await deleteCheckInsByUser(testUserId);
    expect(deleteCount).toBe(2);

    const remaining = await getCheckInsByUser(testUserId);
    expect(remaining).toHaveLength(0);

    const otherUserCheckIns = await getCheckInsByUser('other-user');
    expect(otherUserCheckIns).toHaveLength(1);
  });

  it('should handle check-ins with array fields', async () => {
    const checkIn = await createCheckIn({
      userId: testUserId,
      zone: ZoneType.Yellow,
      triggerIds: ['trigger1', 'trigger2'],
      copingStrategyIds: ['strategy1', 'strategy2'],
    });

    const retrieved = await getCheckIn(checkIn.id);
    expect(retrieved?.triggerIds).toEqual(['trigger1', 'trigger2']);
    expect(retrieved?.copingStrategyIds).toEqual(['strategy1', 'strategy2']);
  });
});

describe('CopingStrategy CRUD Operations', () => {
  it('should create a coping strategy with auto-generated fields', async () => {
    const strategy = await createCopingStrategy({
      title: 'Deep Breathing',
      description: 'Take slow, deep breaths',
      category: CopingStrategyCategory.Physical,
    });

    expect(strategy.id).toBeTruthy();
    expect(strategy.createdAt).toBeInstanceOf(Date);
    expect(strategy.updatedAt).toBeInstanceOf(Date);
    expect(strategy.title).toBe('Deep Breathing');
  });

  it('should create a coping strategy with provided ID', async () => {
    const customId = 'strategy-123';
    const strategy = await createCopingStrategy({
      id: customId,
      title: 'Meditation',
      description: 'Mindful meditation',
      category: CopingStrategyCategory.Cognitive,
    });

    expect(strategy.id).toBe(customId);
  });

  it('should get a coping strategy by ID', async () => {
    const created = await createCopingStrategy({
      title: 'Journaling',
      description: 'Write down thoughts',
      category: CopingStrategyCategory.Emotional,
    });

    const retrieved = await getCopingStrategy(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Journaling');
  });

  it('should get all coping strategies', async () => {
    await createCopingStrategy({
      title: 'Strategy 1',
      description: 'Description 1',
      category: CopingStrategyCategory.Physical,
    });
    await createCopingStrategy({
      title: 'Strategy 2',
      description: 'Description 2',
      category: CopingStrategyCategory.Social,
    });

    const strategies = await getAllCopingStrategies();
    expect(strategies).toHaveLength(2);
  });

  it('should filter strategies by category', async () => {
    await createCopingStrategy({
      title: 'Physical Strategy',
      description: 'Description',
      category: CopingStrategyCategory.Physical,
    });
    await createCopingStrategy({
      title: 'Social Strategy',
      description: 'Description',
      category: CopingStrategyCategory.Social,
    });

    const physicalStrategies = await getAllCopingStrategies({
      category: CopingStrategyCategory.Physical,
    });
    expect(physicalStrategies).toHaveLength(1);
    expect(physicalStrategies[0]?.title).toBe('Physical Strategy');
  });

  it('should filter strategies by favorite status', async () => {
    await createCopingStrategy({
      title: 'Favorite Strategy',
      description: 'Description',
      category: CopingStrategyCategory.Physical,
      isFavorite: true,
    });
    await createCopingStrategy({
      title: 'Non-Favorite Strategy',
      description: 'Description',
      category: CopingStrategyCategory.Social,
      isFavorite: false,
    });

    const favorites = await getFavoriteCopingStrategies();
    expect(favorites).toHaveLength(1);
    expect(favorites[0]?.title).toBe('Favorite Strategy');
  });

  it('should update a coping strategy and set updatedAt', async () => {
    const strategy = await createCopingStrategy({
      title: 'Original Title',
      description: 'Original Description',
      category: CopingStrategyCategory.Physical,
    });

    const originalUpdatedAt = strategy.updatedAt;

    // Wait a bit to ensure updatedAt changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updateCount = await updateCopingStrategy(strategy.id, {
      title: 'Updated Title',
      description: 'Updated Description',
    });

    expect(updateCount).toBe(1);

    const updated = await getCopingStrategy(strategy.id);
    expect(updated?.title).toBe('Updated Title');
    expect(updated?.description).toBe('Updated Description');
    expect(updated?.updatedAt?.getTime()).toBeGreaterThan(
      originalUpdatedAt?.getTime() ?? 0
    );
  });

  it('should delete a coping strategy', async () => {
    const strategy = await createCopingStrategy({
      title: 'To Be Deleted',
      description: 'Description',
      category: CopingStrategyCategory.Physical,
    });

    await deleteCopingStrategy(strategy.id);

    const retrieved = await getCopingStrategy(strategy.id);
    expect(retrieved).toBeUndefined();
  });

  it('should toggle favorite status', async () => {
    const strategy = await createCopingStrategy({
      title: 'Strategy',
      description: 'Description',
      category: CopingStrategyCategory.Physical,
      isFavorite: false,
    });

    // Toggle to true
    const newStatus1 = await toggleCopingStrategyFavorite(strategy.id);
    expect(newStatus1).toBe(true);

    let updated = await getCopingStrategy(strategy.id);
    expect(updated?.isFavorite).toBe(true);

    // Toggle back to false
    const newStatus2 = await toggleCopingStrategyFavorite(strategy.id);
    expect(newStatus2).toBe(false);

    updated = await getCopingStrategy(strategy.id);
    expect(updated?.isFavorite).toBe(false);
  });

  it('should throw error when toggling non-existent strategy', async () => {
    await expect(toggleCopingStrategyFavorite('non-existent-id')).rejects.toThrow(
      'Coping strategy with id non-existent-id not found'
    );
  });
});

describe('UserConfig CRUD Operations', () => {
  const testUserId = 'test-user-1';

  it('should set a user config value', async () => {
    const config = await setUserConfig(testUserId, 'theme', 'dark');

    expect(config.id).toBeTruthy();
    expect(config.userId).toBe(testUserId);
    expect(config.key).toBe('theme');
    expect(config.value).toBe('dark');
    expect(config.updatedAt).toBeInstanceOf(Date);
  });

  it('should update existing config value', async () => {
    await setUserConfig(testUserId, 'theme', 'dark');
    const updated = await setUserConfig(testUserId, 'theme', 'light');

    expect(updated.value).toBe('light');

    // Should only have one entry
    const allConfigs = await getAllUserConfig(testUserId);
    const themeConfigs = allConfigs.filter((c) => c.key === 'theme');
    expect(themeConfigs).toHaveLength(1);
  });

  it('should get a user config value', async () => {
    await setUserConfig(testUserId, 'language', 'en');

    const config = await getUserConfig(testUserId, 'language');
    expect(config).toBeDefined();
    expect(config?.value).toBe('en');
  });

  it('should return undefined for non-existent config', async () => {
    const config = await getUserConfig(testUserId, 'non-existent-key');
    expect(config).toBeUndefined();
  });

  it('should get all config entries for a user', async () => {
    await setUserConfig(testUserId, 'theme', 'dark');
    await setUserConfig(testUserId, 'language', 'en');
    await setUserConfig(testUserId, 'notifications', true);
    await setUserConfig('other-user', 'theme', 'light');

    const configs = await getAllUserConfig(testUserId);
    expect(configs).toHaveLength(3);
    expect(configs.every((c) => c.userId === testUserId)).toBe(true);
  });

  it('should handle different value types', async () => {
    await setUserConfig(testUserId, 'string-value', 'text');
    await setUserConfig(testUserId, 'number-value', 42);
    await setUserConfig(testUserId, 'boolean-value', true);
    await setUserConfig(testUserId, 'object-value', { nested: 'data' });

    const stringConfig = await getUserConfig(testUserId, 'string-value');
    const numberConfig = await getUserConfig(testUserId, 'number-value');
    const booleanConfig = await getUserConfig(testUserId, 'boolean-value');
    const objectConfig = await getUserConfig(testUserId, 'object-value');

    expect(stringConfig?.value).toBe('text');
    expect(numberConfig?.value).toBe(42);
    expect(booleanConfig?.value).toBe(true);
    expect(objectConfig?.value).toEqual({ nested: 'data' });
  });

  it('should delete a user config entry', async () => {
    await setUserConfig(testUserId, 'to-delete', 'value');

    const deleteCount = await deleteUserConfig(testUserId, 'to-delete');
    expect(deleteCount).toBe(1);

    const retrieved = await getUserConfig(testUserId, 'to-delete');
    expect(retrieved).toBeUndefined();
  });

  it('should delete all config entries for a user', async () => {
    await setUserConfig(testUserId, 'config1', 'value1');
    await setUserConfig(testUserId, 'config2', 'value2');
    await setUserConfig('other-user', 'config1', 'value1');

    const deleteCount = await deleteAllUserConfig(testUserId);
    expect(deleteCount).toBe(2);

    const remaining = await getAllUserConfig(testUserId);
    expect(remaining).toHaveLength(0);

    const otherUserConfigs = await getAllUserConfig('other-user');
    expect(otherUserConfigs).toHaveLength(1);
  });
});

describe('Database Utility Functions', () => {
  it('should get database statistics', async () => {
    await createCheckIn({ userId: 'user1', zone: ZoneType.Green });
    await createCheckIn({ userId: 'user1', zone: ZoneType.Yellow });
    await createCopingStrategy({
      title: 'Strategy',
      description: 'Description',
      category: CopingStrategyCategory.Physical,
    });
    await setUserConfig('user1', 'theme', 'dark');

    const stats = await getDbStats();
    expect(stats.checkIns).toBe(2);
    expect(stats.copingStrategies).toBe(1);
    expect(stats.userConfig).toBe(1);
  });

  it('should export and import data', async () => {
    // Create some data
    const checkIn = await createCheckIn({
      userId: 'user1',
      zone: ZoneType.Green,
    });
    const strategy = await createCopingStrategy({
      title: 'Strategy',
      description: 'Description',
      category: CopingStrategyCategory.Physical,
    });
    const config = await setUserConfig('user1', 'theme', 'dark');

    // Export data
    const exported = await exportData();
    expect(exported.checkIns).toHaveLength(1);
    expect(exported.copingStrategies).toHaveLength(1);
    expect(exported.userConfig).toHaveLength(1);

    // Clear database
    await db.checkIns.clear();
    await db.copingStrategies.clear();
    await db.userConfig.clear();

    const emptyStats = await getDbStats();
    expect(emptyStats.checkIns).toBe(0);
    expect(emptyStats.copingStrategies).toBe(0);
    expect(emptyStats.userConfig).toBe(0);

    // Import data back
    await importData(exported);

    const stats = await getDbStats();
    expect(stats.checkIns).toBe(1);
    expect(stats.copingStrategies).toBe(1);
    expect(stats.userConfig).toBe(1);

    // Verify data integrity
    const importedCheckIn = await getCheckIn(checkIn.id);
    const importedStrategy = await getCopingStrategy(strategy.id);
    const importedConfig = await getUserConfig('user1', 'theme');

    expect(importedCheckIn?.userId).toBe('user1');
    expect(importedStrategy?.title).toBe('Strategy');
    expect(importedConfig?.value).toBe('dark');
  });
});
