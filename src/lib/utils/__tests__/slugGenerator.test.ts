import { describe, it, expect, vi } from 'vitest';
import {
  validateSlug,
  generateRandomSlug,
  generateUniqueSlug,
  normalizeSlug,
} from '../slugGenerator';

describe('slugGenerator', () => {
  describe('validateSlug', () => {
    it('should validate correct slugs', () => {
      expect(validateSlug('green-mountain-trail')).toBe(true);
      expect(validateSlug('silver-lake-summit')).toBe(true);
      expect(validateSlug('a-b-c')).toBe(true);
      expect(validateSlug('test123-abc456')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(validateSlug('Green-Mountain-Trail')).toBe(false); // uppercase
      expect(validateSlug('green_mountain_trail')).toBe(false); // underscores
      expect(validateSlug('green mountain trail')).toBe(false); // spaces
      expect(validateSlug('-green-mountain')).toBe(false); // starts with dash
      expect(validateSlug('green-mountain-')).toBe(false); // ends with dash
      expect(validateSlug('green--mountain')).toBe(false); // double dash
      expect(validateSlug('')).toBe(false); // empty
    });
  });

  describe('generateRandomSlug', () => {
    it('should generate valid slugs', () => {
      for (let i = 0; i < 10; i++) {
        const slug = generateRandomSlug();
        expect(validateSlug(slug)).toBe(true);
      }
    });

    it('should generate different slugs', () => {
      const slugs = new Set();
      for (let i = 0; i < 20; i++) {
        slugs.add(generateRandomSlug());
      }
      // Should have at least 15 unique slugs out of 20 (very high probability)
      expect(slugs.size).toBeGreaterThan(15);
    });

    it('should follow the pattern [adjective]-[noun]-[noun]', () => {
      const slug = generateRandomSlug();
      const parts = slug.split('-');
      expect(parts.length).toBe(3);
      parts.forEach((part) => {
        expect(part.length).toBeGreaterThan(0);
      });
    });
  });

  describe('normalizeSlug', () => {
    it('should normalize valid slugs', () => {
      expect(normalizeSlug('Green-Mountain-Trail')).toBe('green-mountain-trail');
      expect(normalizeSlug('  green-mountain-trail  ')).toBe('green-mountain-trail');
      expect(normalizeSlug('SILVER-LAKE-SUMMIT')).toBe('silver-lake-summit');
    });

    it('should return null for invalid slugs', () => {
      expect(normalizeSlug('green_mountain_trail')).toBeNull();
      expect(normalizeSlug('green mountain trail')).toBeNull();
      expect(normalizeSlug('-green-mountain')).toBeNull();
      expect(normalizeSlug('')).toBeNull();
    });
  });

  describe('generateUniqueSlug', () => {
    it('should generate a unique slug', async () => {
      const checkExists = vi.fn().mockResolvedValue(false);
      const slug = await generateUniqueSlug(checkExists);

      expect(validateSlug(slug)).toBe(true);
      expect(checkExists).toHaveBeenCalled();
    });

    it('should retry on collision', async () => {
      const checkExists = vi
        .fn()
        .mockResolvedValueOnce(true) // First attempt collides
        .mockResolvedValueOnce(false); // Second attempt succeeds

      const slug = await generateUniqueSlug(checkExists, 3);

      expect(validateSlug(slug)).toBe(true);
      expect(checkExists).toHaveBeenCalledTimes(2);
    });

    it('should fallback to UUID-based slug after max attempts', async () => {
      const checkExists = vi.fn().mockResolvedValue(true); // Always collides

      const slug = await generateUniqueSlug(checkExists, 3);

      expect(slug).toMatch(/^link-[a-f0-9]{12}$/);
      expect(checkExists).toHaveBeenCalledTimes(3);
    });
  });
});
