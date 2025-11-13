/**
 * Vermont-Inspired Slug Generator
 *
 * Generates friendly, memorable slugs for provider links using Vermont-themed words.
 * Pattern: [adjective]-[noun]-[noun]
 * Examples: green-mountain-trail, silver-lake-summit, maple-forest-valley
 */

// Vermont-themed wordlists
const ADJECTIVES = [
  'green',
  'silver',
  'misty',
  'golden',
  'bright',
  'clear',
  'fresh',
  'cool',
  'warm',
  'gentle',
  'peaceful',
  'quiet',
  'wild',
  'free',
  'bold',
  'swift',
  'deep',
  'high',
  'vast',
  'pure',
  'crisp',
  'soft',
  'strong',
  'calm',
];

const NOUNS = [
  'mountain',
  'lake',
  'forest',
  'valley',
  'trail',
  'summit',
  'stream',
  'meadow',
  'birch',
  'maple',
  'pine',
  'spruce',
  'cedar',
  'oak',
  'ash',
  'elm',
  'sky',
  'wind',
  'stone',
  'water',
  'earth',
  'fire',
  'dawn',
  'dusk',
  'peak',
  'ridge',
  'slope',
  'glen',
  'dell',
  'cove',
  'bay',
  'shore',
];

/**
 * Validates a slug against the required pattern
 * Pattern: ^[a-z0-9]+(-[a-z0-9]+)*$
 *
 * @param slug - The slug to validate
 * @returns true if valid, false otherwise
 */
export function validateSlug(slug: string): boolean {
  const pattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return pattern.test(slug);
}

/**
 * Generates a random Vermont-inspired slug
 * Pattern: [adjective]-[noun]-[noun]
 *
 * @returns A randomly generated slug
 */
export function generateRandomSlug(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun1 = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const noun2 = NOUNS[Math.floor(Math.random() * NOUNS.length)];

  return `${adjective}-${noun1}-${noun2}`;
}

/**
 * Generates a unique slug with collision detection
 * Attempts to generate a unique slug by trying multiple times.
 * If all attempts fail, falls back to UUID-based slug.
 *
 * @param checkExists - Async function to check if slug exists in database
 * @param maxAttempts - Maximum number of generation attempts (default: 3)
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  checkExists: (slug: string) => Promise<boolean>,
  maxAttempts = 3
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const slug = generateRandomSlug();
    const exists = await checkExists(slug);
    if (!exists) {
      return slug;
    }
  }

  // Fallback: use UUID-based slug if collision detection fails
  const uuid = crypto.getRandomValues(new Uint8Array(8));
  const hexString = Array.from(uuid)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `link-${hexString.slice(0, 12)}`;
}

/**
 * Normalizes a user-provided slug
 * Converts to lowercase and validates pattern
 *
 * @param slug - The slug to normalize
 * @returns Normalized slug or null if invalid
 */
export function normalizeSlug(slug: string): string | null {
  const normalized = slug.toLowerCase().trim();
  return validateSlug(normalized) ? normalized : null;
}
