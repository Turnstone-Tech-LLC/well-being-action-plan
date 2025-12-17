/**
 * Pre-generated backup files for E2E testing.
 *
 * These are generated using the actual encryption functions with known passphrases.
 * The backup files are base64-encoded JSON that can be written to files during tests.
 */

import { TEST_LOCAL_PLAN } from './test-plan';

/**
 * Creates an encrypted backup file content using the Web Crypto API.
 * This mirrors the logic in src/lib/crypto/backup.ts.
 */
export async function createTestBackup(passphrase: string): Promise<string> {
	const PBKDF2_ITERATIONS = 100000;
	const SALT_LENGTH = 16;
	const IV_LENGTH = 12;
	const KEY_LENGTH = 256;

	const encoder = new TextEncoder();

	// Generate salt and IV
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

	// Derive key from passphrase
	const passphraseKey = await crypto.subtle.importKey(
		'raw',
		encoder.encode(passphrase),
		'PBKDF2',
		false,
		['deriveKey']
	);

	const key = await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: 'SHA-256'
		},
		passphraseKey,
		{
			name: 'AES-GCM',
			length: KEY_LENGTH
		},
		false,
		['encrypt']
	);

	// Create backup payload
	const payload = {
		version: 1,
		createdAt: new Date().toISOString(),
		plan: {
			actionPlanId: TEST_LOCAL_PLAN.actionPlanId,
			revisionId: TEST_LOCAL_PLAN.revisionId,
			revisionVersion: TEST_LOCAL_PLAN.revisionVersion,
			accessCode: TEST_LOCAL_PLAN.accessCode,
			planPayload: TEST_LOCAL_PLAN.planPayload,
			deviceInstallId: TEST_LOCAL_PLAN.deviceInstallId,
			installedAt: new Date(),
			lastAccessedAt: new Date()
		}
	};

	// Encrypt the payload
	const plaintext = encoder.encode(JSON.stringify(payload));
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

	// Convert to base64
	const arrayBufferToBase64 = (buffer: Uint8Array): string => {
		let binary = '';
		for (let i = 0; i < buffer.length; i++) {
			binary += String.fromCharCode(buffer[i]);
		}
		return btoa(binary);
	};

	// Create encrypted backup object
	const backup = {
		version: 1,
		salt: arrayBufferToBase64(salt),
		iv: arrayBufferToBase64(iv),
		data: arrayBufferToBase64(new Uint8Array(ciphertext))
	};

	return JSON.stringify(backup, null, 2);
}

/**
 * Invalid backup file content for testing error cases.
 */
export const INVALID_BACKUP_CONTENT = '{ "invalid": "json", "missing": "required fields" }';

/**
 * Corrupt backup file content for testing error cases.
 */
export const CORRUPT_BACKUP_CONTENT =
	'{ "version": 1, "salt": "abc", "iv": "def", "data": "not-valid-base64!!!" }';

/**
 * Truncated/malformed JSON for testing parsing errors.
 */
export const MALFORMED_JSON_CONTENT = '{ "version": 1, "salt": ';

/**
 * Get the test backup filename.
 */
export function getTestBackupFilename(): string {
	return 'test-backup.wbap';
}
