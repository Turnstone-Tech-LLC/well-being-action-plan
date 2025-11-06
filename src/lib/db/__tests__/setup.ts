/**
 * Test setup for Dexie database tests
 * Configures fake-indexeddb to mock IndexedDB in the test environment
 */

import 'fake-indexeddb/auto';
import { afterEach, beforeEach } from 'vitest';
import { db, clearAllData } from '../index';

// Ensure database is open before each test
beforeEach(async () => {
  if (!db.isOpen()) {
    await db.open();
  }
});

// Clean up database after each test
afterEach(async () => {
  if (db.isOpen()) {
    await clearAllData();
  }
});
