/**
 * Backup file utilities for E2E testing.
 */

import type { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

/**
 * Create a temporary backup file with the given content.
 * Returns the path to the created file.
 */
export async function createTempBackupFile(
	content: string,
	filename: string = 'test-backup.wbap'
): Promise<string> {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wbap-test-'));
	const filePath = path.join(tempDir, filename);
	await fs.writeFile(filePath, content, 'utf-8');
	return filePath;
}

/**
 * Clean up a temporary file.
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
	try {
		await fs.unlink(filePath);
		// Also try to remove the temp directory
		const dir = path.dirname(filePath);
		await fs.rmdir(dir);
	} catch {
		// Ignore cleanup errors
	}
}

/**
 * Create an encrypted backup file using the browser's crypto API.
 * This is needed because Node.js crypto differs from Web Crypto API.
 */
export async function createEncryptedBackupInBrowser(
	page: Page,
	passphrase: string
): Promise<string> {
	return await page.evaluate(async (pass) => {
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
			encoder.encode(pass),
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
				actionPlanId: 'test-plan-uuid-1234',
				revisionId: 'test-revision-uuid-5678',
				revisionVersion: 1,
				accessCode: 'TEST123',
				planPayload: {
					patientNickname: 'Alex',
					happyWhen: 'I feel happy when I spend time with friends.',
					happyBecause: 'Being with people makes me feel loved.',
					skills: [
						{
							id: 'skill-1',
							title: 'Deep Breathing',
							description: 'Take 5 slow, deep breaths.',
							category: 'Calming',
							displayOrder: 1
						}
					],
					supportiveAdults: [
						{
							id: 'adult-1',
							type: 'Parent',
							name: 'Mom',
							contactInfo: '555-1234',
							isPrimary: true,
							displayOrder: 1
						}
					],
					helpMethods: [
						{
							id: 'help-1',
							title: 'Ask for a hug',
							description: 'Physical comfort helps.',
							displayOrder: 1
						}
					],
					crisisResources: [
						{
							id: 'crisis-1',
							name: '988 Lifeline',
							contact: '988',
							contactType: 'phone',
							description: '24/7 support',
							displayOrder: 1
						}
					]
				},
				deviceInstallId: 'test-device-uuid-9999',
				installedAt: new Date().toISOString(),
				lastAccessedAt: new Date().toISOString()
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
	}, passphrase);
}
