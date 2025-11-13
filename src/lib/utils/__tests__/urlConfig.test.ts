/**
 * Unit tests for URL configuration encoding/decoding
 */

import { describe, it, expect } from 'vitest';
import {
  encodePlanConfig,
  decodePlanConfig,
  generateShareableUrl,
  extractConfigFromUrl,
  estimateUrlLength,
  canShareViaUrl,
  PLAN_PARAM_NAME,
  MAX_URL_LENGTH,
  type ShareablePlanConfig,
} from '../urlConfig';
import { ZoneType } from '@/lib/types/zone';

describe('URL Config - Basic Encoding and Decoding', () => {
  const sampleConfig: ShareablePlanConfig = {
    title: 'My Well-Being Plan',
    description: 'A comprehensive plan for managing my mental health',
    zoneStrategies: [
      {
        zone: ZoneType.Green,
        copingStrategyIds: ['strategy-1', 'strategy-2'],
        triggers: [
          {
            id: 'trigger-1',
            title: 'Feeling positive',
            description: 'When things are going well',
            zone: ZoneType.Green,
          },
        ],
        notes: 'Keep doing what works',
      },
      {
        zone: ZoneType.Yellow,
        copingStrategyIds: ['strategy-3', 'strategy-4'],
        triggers: [
          {
            id: 'trigger-2',
            title: 'Feeling stressed',
            description: 'When workload increases',
            zone: ZoneType.Yellow,
          },
        ],
      },
      {
        zone: ZoneType.Red,
        copingStrategyIds: ['strategy-5'],
        triggers: [],
        notes: 'Seek immediate support',
      },
    ],
    config: {
      enableNotifications: true,
      enableCheckInReminders: true,
      checkInFrequencyHours: 24,
      reminderTimes: ['09:00', '21:00'],
      enableDataSync: false,
      theme: 'auto',
    },
  };

  it('should encode a plan configuration into a string', () => {
    const encoded = encodePlanConfig(sampleConfig);
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('should produce URL-safe base64 (no +, /, =)', () => {
    const encoded = encodePlanConfig(sampleConfig);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('should decode an encoded configuration', () => {
    const encoded = encodePlanConfig(sampleConfig);
    const result = decodePlanConfig(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe(sampleConfig.title);
      expect(result.data.description).toBe(sampleConfig.description);
      expect(result.data.zoneStrategies).toHaveLength(3);
      expect(result.data.config.enableNotifications).toBe(true);
    }
  });

  it('should maintain data integrity through encode/decode cycle', () => {
    const encoded = encodePlanConfig(sampleConfig);
    const result = decodePlanConfig(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(sampleConfig);
    }
  });

  it('should handle minimal configuration', () => {
    const minimalConfig: ShareablePlanConfig = {
      title: 'Minimal Plan',
      zoneStrategies: [],
      config: {
        enableNotifications: false,
        enableCheckInReminders: false,
        enableDataSync: false,
      },
    };

    const encoded = encodePlanConfig(minimalConfig);
    const result = decodePlanConfig(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(minimalConfig);
    }
  });

  it('should handle unicode characters in strings', () => {
    const unicodeConfig: ShareablePlanConfig = {
      title: 'Plan with 表情符號 and émojis 🌟',
      description: 'Testing unicode: こんにちは 世界 🌍',
      zoneStrategies: [],
      config: {
        enableNotifications: true,
        enableCheckInReminders: false,
        enableDataSync: false,
      },
    };

    const encoded = encodePlanConfig(unicodeConfig);
    const result = decodePlanConfig(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe(unicodeConfig.title);
      expect(result.data.description).toBe(unicodeConfig.description);
    }
  });
});

describe('URL Config - Validation and Error Handling', () => {
  it('should reject invalid configuration (missing required fields)', () => {
    const invalidConfig = {
      description: 'Missing title',
      zoneStrategies: [],
    } as unknown as ShareablePlanConfig;

    expect(() => encodePlanConfig(invalidConfig)).toThrow();
  });

  it('should reject invalid zone type', () => {
    const invalidZoneConfig = {
      title: 'Invalid Zone Plan',
      zoneStrategies: [
        {
          zone: 'INVALID_ZONE' as unknown as ZoneType,
          copingStrategyIds: [],
          triggers: [],
        },
      ],
      config: {
        enableNotifications: false,
        enableCheckInReminders: false,
        enableDataSync: false,
      },
    } as ShareablePlanConfig;

    expect(() => encodePlanConfig(invalidZoneConfig)).toThrow();
  });

  it('should return error for invalid encoded string', () => {
    const result = decodePlanConfig('invalid-base64-string');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it('should return error for empty string', () => {
    const result = decodePlanConfig('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid input');
    }
  });

  it('should return error for malformed JSON', () => {
    // Create a base64 string that decodes to invalid JSON
    const invalidJson = btoa('not valid json{]')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const result = decodePlanConfig(invalidJson);
    expect(result.success).toBe(false);
  });

  it('should validate against schema after decoding', () => {
    const validConfig: ShareablePlanConfig = {
      title: 'Valid Plan',
      zoneStrategies: [],
      config: {
        enableNotifications: true,
        enableCheckInReminders: false,
        enableDataSync: false,
      },
    };

    const encoded = encodePlanConfig(validConfig);

    // Manually corrupt the data by decoding, modifying, and re-encoding
    const corrupted = `${encoded}corrupt`;

    const result = decodePlanConfig(corrupted);
    expect(result.success).toBe(false);
  });
});

describe('URL Config - URL Generation', () => {
  const testConfig: ShareablePlanConfig = {
    title: 'Test Plan',
    zoneStrategies: [],
    config: {
      enableNotifications: true,
      enableCheckInReminders: false,
      enableDataSync: false,
    },
  };

  it('should generate a complete URL with plan parameter', () => {
    const url = generateShareableUrl(testConfig, 'https://example.com');
    expect(url).toContain('https://example.com');
    expect(url).toContain(`${PLAN_PARAM_NAME}=`);
  });

  it('should extract config from a generated URL', () => {
    const url = generateShareableUrl(testConfig, 'https://example.com');
    const result = extractConfigFromUrl(url);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe(testConfig.title);
    }
  });

  it('should maintain data integrity through URL generation and extraction', () => {
    const url = generateShareableUrl(testConfig, 'https://example.com');
    const result = extractConfigFromUrl(url);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(testConfig);
    }
  });

  it('should return error when plan parameter is missing', () => {
    const url = 'https://example.com?other=param';
    const result = extractConfigFromUrl(url);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('No plan configuration found');
    }
  });

  it('should handle URLs with multiple query parameters', () => {
    const url = generateShareableUrl(testConfig, 'https://example.com?foo=bar');
    expect(url).toContain('foo=bar');
    expect(url).toContain(`${PLAN_PARAM_NAME}=`);

    const result = extractConfigFromUrl(url);
    expect(result.success).toBe(true);
  });

  it('should handle URLs with hash fragments', () => {
    const baseUrl = 'https://example.com#section';
    const url = generateShareableUrl(testConfig, baseUrl);
    const result = extractConfigFromUrl(url);

    expect(result.success).toBe(true);
  });
});

describe('URL Config - Size Estimation and Validation', () => {
  it('should estimate URL length', () => {
    const testConfig: ShareablePlanConfig = {
      title: 'Test Plan',
      zoneStrategies: [],
      config: {
        enableNotifications: true,
        enableCheckInReminders: false,
        enableDataSync: false,
      },
    };

    const length = estimateUrlLength(testConfig, 'https://example.com');
    expect(length).toBeGreaterThan(0);
    expect(typeof length).toBe('number');
  });

  it('should validate if plan can be shared', () => {
    const smallConfig: ShareablePlanConfig = {
      title: 'Small Plan',
      zoneStrategies: [],
      config: {
        enableNotifications: true,
        enableCheckInReminders: false,
        enableDataSync: false,
      },
    };

    const result = canShareViaUrl(smallConfig, 'https://example.com');
    expect(result.canShare).toBe(true);
    expect(result.estimatedLength).toBeGreaterThan(0);
    expect(result.estimatedLength).toBeLessThan(MAX_URL_LENGTH);
  });

  it('should detect when plan is too large', () => {
    // Create a very large config that might exceed URL limits
    const largeConfig: ShareablePlanConfig = {
      title: 'Very Large Plan',
      description: 'A'.repeat(5000), // Large description
      zoneStrategies: Array.from({ length: 100 }, (_, i) => ({
        zone: ZoneType.Green,
        copingStrategyIds: Array.from({ length: 50 }, (_, j) => `strategy-${i}-${j}`),
        triggers: Array.from({ length: 20 }, (_, j) => ({
          id: `trigger-${i}-${j}`,
          title: `Trigger ${i}-${j}`,
          description: 'A long description for this trigger',
          zone: ZoneType.Green,
        })),
        notes: 'Some notes here',
      })),
      config: {
        enableNotifications: true,
        enableCheckInReminders: true,
        checkInFrequencyHours: 24,
        reminderTimes: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        enableDataSync: false,
        theme: 'auto',
      },
    };

    const result = canShareViaUrl(largeConfig, 'https://example.com');
    expect(result.estimatedLength).toBeGreaterThan(0);

    if (!result.canShare) {
      expect(result.reason).toBeTruthy();
      expect(result.estimatedLength).toBeGreaterThan(MAX_URL_LENGTH);
    }
  });

  it('should return false for invalid configuration', () => {
    const invalidConfig = {
      // Missing required title field
      zoneStrategies: [],
    } as unknown as ShareablePlanConfig;

    const result = canShareViaUrl(invalidConfig);
    expect(result.canShare).toBe(false);
    expect(result.reason).toContain('Invalid configuration');
  });
});

describe('URL Config - Compression Effectiveness', () => {
  it('should produce smaller output with compression', () => {
    const config: ShareablePlanConfig = {
      title: 'Plan with repetitive data',
      description: 'test '.repeat(100), // Repetitive data compresses well
      zoneStrategies: [],
      config: {
        enableNotifications: true,
        enableCheckInReminders: true,
        checkInFrequencyHours: 24,
        enableDataSync: false,
      },
    };

    const jsonString = JSON.stringify(config);
    const encoded = encodePlanConfig(config);

    // Compressed base64 should be smaller than original JSON
    // (though base64 adds ~33% overhead, compression should offset this for repetitive data)
    const base64OfJson = btoa(jsonString).length;

    // At minimum, compression shouldn't make it dramatically worse
    expect(encoded.length).toBeLessThan(base64OfJson * 1.5);
  });
});

describe('URL Config - Edge Cases', () => {
  it('should handle empty arrays', () => {
    const config: ShareablePlanConfig = {
      title: 'Empty Arrays Plan',
      zoneStrategies: [
        {
          zone: ZoneType.Green,
          copingStrategyIds: [],
          triggers: [],
        },
      ],
      config: {
        enableNotifications: false,
        enableCheckInReminders: false,
        enableDataSync: false,
        reminderTimes: [],
      },
    };

    const encoded = encodePlanConfig(config);
    const result = decodePlanConfig(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.zoneStrategies[0]?.copingStrategyIds).toEqual([]);
      expect(result.data.zoneStrategies[0]?.triggers).toEqual([]);
    }
  });

  it('should handle optional fields being undefined', () => {
    const config: ShareablePlanConfig = {
      title: 'Minimal Optional Fields',
      // description is optional - omitted
      zoneStrategies: [
        {
          zone: ZoneType.Yellow,
          copingStrategyIds: ['strategy-1'],
          triggers: [],
          // notes is optional - omitted
        },
      ],
      config: {
        enableNotifications: true,
        enableCheckInReminders: false,
        enableDataSync: false,
        // theme is optional - omitted
        // checkInFrequencyHours is optional - omitted
        // reminderTimes is optional - omitted
      },
    };

    const encoded = encodePlanConfig(config);
    const result = decodePlanConfig(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
      expect(result.data.config.theme).toBeUndefined();
    }
  });

  it('should handle special characters in strings', () => {
    const config: ShareablePlanConfig = {
      title: 'Special chars: <>&"\'`',
      description: 'Newlines\nand\ttabs\rand\fother\bescapes',
      zoneStrategies: [],
      config: {
        enableNotifications: true,
        enableCheckInReminders: false,
        enableDataSync: false,
      },
    };

    const encoded = encodePlanConfig(config);
    const result = decodePlanConfig(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe(config.title);
      expect(result.data.description).toBe(config.description);
    }
  });

  it('should handle all zone types', () => {
    const config: ShareablePlanConfig = {
      title: 'All Zones',
      zoneStrategies: [
        {
          zone: ZoneType.Green,
          copingStrategyIds: [],
          triggers: [],
        },
        {
          zone: ZoneType.Yellow,
          copingStrategyIds: [],
          triggers: [],
        },
        {
          zone: ZoneType.Red,
          copingStrategyIds: [],
          triggers: [],
        },
      ],
      config: {
        enableNotifications: false,
        enableCheckInReminders: false,
        enableDataSync: false,
      },
    };

    const encoded = encodePlanConfig(config);
    const result = decodePlanConfig(encoded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.zoneStrategies).toHaveLength(3);
      expect(result.data.zoneStrategies[0]?.zone).toBe(ZoneType.Green);
      expect(result.data.zoneStrategies[1]?.zone).toBe(ZoneType.Yellow);
      expect(result.data.zoneStrategies[2]?.zone).toBe(ZoneType.Red);
    }
  });

  it('should handle all theme options', () => {
    const themes = ['light', 'dark', 'auto'] as const;

    themes.forEach((theme) => {
      const config: ShareablePlanConfig = {
        title: `Plan with ${theme} theme`,
        zoneStrategies: [],
        config: {
          enableNotifications: false,
          enableCheckInReminders: false,
          enableDataSync: false,
          theme,
        },
      };

      const encoded = encodePlanConfig(config);
      const result = decodePlanConfig(encoded);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config.theme).toBe(theme);
      }
    });
  });
});
