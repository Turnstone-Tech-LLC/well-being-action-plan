import { nanoid, customAlphabet } from 'nanoid';

/**
 * Default token length for install tokens.
 * 8 characters provides sufficient uniqueness while being easy to type.
 */
const TOKEN_LENGTH = 8;

/**
 * URL-safe alphabet that's also easy to type and read.
 * Excludes similar-looking characters (0/O, 1/l/I) to avoid confusion.
 */
const TOKEN_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';

/**
 * Custom nanoid generator with human-friendly alphabet.
 */
const generateToken = customAlphabet(TOKEN_ALPHABET, TOKEN_LENGTH);

/**
 * Generates a short, URL-safe, human-readable token for plan distribution.
 *
 * Token characteristics:
 * - 8 characters long
 * - Uses URL-safe characters
 * - Excludes ambiguous characters (0/O, 1/l/I)
 * - Easy to type manually
 *
 * @example
 * const token = createInstallToken();
 * // => 'V7x9k2m4'
 */
export function createInstallToken(): string {
	return generateToken();
}

/**
 * Generates a longer token for cases requiring more uniqueness.
 * Uses the default nanoid alphabet (URL-safe).
 *
 * @param length - Token length (default: 21)
 */
export function createSecureToken(length = 21): string {
	return nanoid(length);
}

/**
 * Validates that a string looks like a valid install token.
 * Does not check if the token exists in the database.
 *
 * @param token - The token string to validate
 */
export function isValidTokenFormat(token: string): boolean {
	if (!token || typeof token !== 'string') {
		return false;
	}

	// Check length
	if (token.length < 6 || token.length > 12) {
		return false;
	}

	// Check characters are alphanumeric
	return /^[a-zA-Z0-9]+$/.test(token);
}
