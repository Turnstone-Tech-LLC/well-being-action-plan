/**
 * Backup encryption/decryption module using Web Crypto API.
 * Uses AES-GCM for encryption with PBKDF2 key derivation from passphrase.
 */

import type { LocalActionPlan, PatientProfile, CheckIn } from '$lib/db/index';
import { getLocalPlan } from '$lib/db/plans';
import { getCurrentPatientProfile } from '$lib/db/profile';
import { getAllCheckIns } from '$lib/db/checkIns';

/**
 * Current backup format version.
 * Increment when making breaking changes to the backup format.
 */
export const BACKUP_FORMAT_VERSION = 1;

/**
 * File extension for backup files.
 */
export const BACKUP_FILE_EXTENSION = '.wbap';

/**
 * MIME type for backup files.
 */
export const BACKUP_MIME_TYPE = 'application/octet-stream';

/**
 * Structure of an encrypted backup file.
 */
export interface EncryptedBackup {
	/** Backup format version for future compatibility */
	version: number;
	/** Base64-encoded salt used for key derivation */
	salt: string;
	/** Base64-encoded initialization vector for AES-GCM */
	iv: string;
	/** Base64-encoded encrypted data */
	data: string;
}

/**
 * Structure of the decrypted backup payload.
 */
export interface BackupPayload {
	/** Backup format version */
	version: number;
	/** Timestamp when backup was created */
	createdAt: string;
	/** The action plan data (without local-only fields like id) */
	plan: Omit<LocalActionPlan, 'id'>;
	/** The patient profile data (without local-only fields like id) */
	profile?: Omit<PatientProfile, 'id'>;
	/** All check-in records (without local-only fields like id) */
	checkIns?: Array<Omit<CheckIn, 'id'>>;
}

/**
 * Result of a full backup restoration.
 */
export interface RestoreResult {
	plan: Omit<LocalActionPlan, 'id'>;
	profile?: Omit<PatientProfile, 'id'>;
	checkIns?: Array<Omit<CheckIn, 'id'>>;
}

/**
 * PBKDF2 parameters for key derivation.
 */
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH = 'SHA-256';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/**
 * Derive a cryptographic key from a passphrase using PBKDF2.
 */
async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const passphraseKey = await crypto.subtle.importKey(
		'raw',
		encoder.encode(passphrase),
		'PBKDF2',
		false,
		['deriveKey']
	);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: PBKDF2_HASH
		},
		passphraseKey,
		{
			name: 'AES-GCM',
			length: KEY_LENGTH
		},
		false,
		['encrypt', 'decrypt']
	);
}

/**
 * Convert a Uint8Array to a base64 string.
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < buffer.length; i++) {
		binary += String.fromCharCode(buffer[i]);
	}
	return btoa(binary);
}

/**
 * Convert a base64 string to a Uint8Array.
 */
function base64ToArrayBuffer(base64: string): Uint8Array<ArrayBuffer> {
	const binary = atob(base64);
	const buffer = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		buffer[i] = binary.charCodeAt(i);
	}
	return buffer as Uint8Array<ArrayBuffer>;
}

/**
 * Encrypt a backup payload with a passphrase.
 *
 * @param payload - The backup data to encrypt
 * @param passphrase - User-provided passphrase for encryption
 * @returns Encrypted backup object ready to be saved as JSON
 */
export async function encryptBackup(
	payload: BackupPayload,
	passphrase: string
): Promise<EncryptedBackup> {
	const encoder = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

	const key = await deriveKey(passphrase, salt);
	const plaintext = encoder.encode(JSON.stringify(payload));

	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

	return {
		version: BACKUP_FORMAT_VERSION,
		salt: arrayBufferToBase64(salt),
		iv: arrayBufferToBase64(iv),
		data: arrayBufferToBase64(new Uint8Array(ciphertext))
	};
}

/**
 * Decrypt an encrypted backup with a passphrase.
 *
 * @param backup - The encrypted backup object
 * @param passphrase - User-provided passphrase for decryption
 * @returns Decrypted backup payload
 * @throws Error if decryption fails (wrong passphrase or corrupted data)
 */
export async function decryptBackup(
	backup: EncryptedBackup,
	passphrase: string
): Promise<BackupPayload> {
	const decoder = new TextDecoder();
	const salt = base64ToArrayBuffer(backup.salt);
	const iv = base64ToArrayBuffer(backup.iv);
	const ciphertext = base64ToArrayBuffer(backup.data);

	const key = await deriveKey(passphrase, salt);

	try {
		const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
		const json = decoder.decode(plaintext);
		return JSON.parse(json) as BackupPayload;
	} catch {
		throw new Error('Decryption failed. Please check your passphrase and try again.');
	}
}

/**
 * Input for creating a backup with all data.
 */
export interface CreateBackupInput {
	plan: LocalActionPlan;
	profile?: PatientProfile;
	checkIns?: CheckIn[];
}

/**
 * Create a backup from action plan, profile, and check-ins.
 *
 * @param input - The data to backup (plan, profile, check-ins)
 * @param passphrase - User-provided passphrase for encryption
 * @returns Encrypted backup as a JSON string
 */
export async function createBackup(input: CreateBackupInput, passphrase: string): Promise<string> {
	const { plan, profile, checkIns } = input;

	// Remove local-only fields (id is auto-generated by IndexedDB)
	const planData: Omit<LocalActionPlan, 'id'> = {
		actionPlanId: plan.actionPlanId,
		revisionId: plan.revisionId,
		revisionVersion: plan.revisionVersion,
		accessCode: plan.accessCode,
		planPayload: plan.planPayload,
		deviceInstallId: plan.deviceInstallId,
		installedAt: plan.installedAt,
		lastAccessedAt: plan.lastAccessedAt
	};

	// Remove id from profile if provided
	let profileData: Omit<PatientProfile, 'id'> | undefined;
	if (profile) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, ...profileRest } = profile;
		profileData = profileRest;
	}

	// Remove ids from check-ins if provided
	let checkInsData: Array<Omit<CheckIn, 'id'>> | undefined;
	if (checkIns && checkIns.length > 0) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		checkInsData = checkIns.map(({ id, ...rest }) => rest);
	}

	const payload: BackupPayload = {
		version: BACKUP_FORMAT_VERSION,
		createdAt: new Date().toISOString(),
		plan: planData,
		profile: profileData,
		checkIns: checkInsData
	};

	const encrypted = await encryptBackup(payload, passphrase);
	return JSON.stringify(encrypted, null, 2);
}

/**
 * Create a full backup of all data in IndexedDB.
 * Gathers plan, profile, and check-ins automatically.
 *
 * @param passphrase - User-provided passphrase for encryption
 * @returns Encrypted backup as a JSON string, or null if no data to backup
 */
export async function createFullBackup(passphrase: string): Promise<string | null> {
	// Gather all data from IndexedDB
	const plan = await getLocalPlan();
	if (!plan) {
		return null;
	}

	const profile = await getCurrentPatientProfile();
	const checkIns = await getAllCheckIns(plan.actionPlanId);

	return createBackup(
		{
			plan,
			profile: profile ?? undefined,
			checkIns: checkIns.length > 0 ? checkIns : undefined
		},
		passphrase
	);
}

/**
 * Restore a backup from an encrypted backup string.
 *
 * @param backupJson - The encrypted backup JSON string
 * @param passphrase - User-provided passphrase for decryption
 * @returns The decrypted data (plan, profile, check-ins) ready to save to IndexedDB
 * @throws Error if parsing or decryption fails
 */
export async function restoreBackup(
	backupJson: string,
	passphrase: string
): Promise<RestoreResult> {
	let backup: EncryptedBackup;

	try {
		backup = JSON.parse(backupJson) as EncryptedBackup;
	} catch {
		throw new Error('Invalid backup file format. Please select a valid .wbap file.');
	}

	// Validate backup structure
	if (!backup.version || !backup.salt || !backup.iv || !backup.data) {
		throw new Error('Invalid backup file structure. Please select a valid .wbap file.');
	}

	// Check version compatibility
	if (backup.version > BACKUP_FORMAT_VERSION) {
		throw new Error(
			`This backup was created with a newer version of the app (v${backup.version}). Please update your app to restore this backup.`
		);
	}

	const payload = await decryptBackup(backup, passphrase);
	const now = new Date();

	// Update timestamps for the restored plan
	const plan: Omit<LocalActionPlan, 'id'> = {
		...payload.plan,
		installedAt: now,
		lastAccessedAt: now
	};

	// Update timestamps for the restored profile if present
	let profile: Omit<PatientProfile, 'id'> | undefined;
	if (payload.profile) {
		profile = {
			...payload.profile,
			createdAt: now,
			updatedAt: now
		};
	}

	// Update timestamps for restored check-ins if present
	let checkIns: Array<Omit<CheckIn, 'id'>> | undefined;
	if (payload.checkIns && payload.checkIns.length > 0) {
		// Keep original createdAt for check-ins to preserve history
		checkIns = payload.checkIns;
	}

	return { plan, profile, checkIns };
}

/**
 * Generate a suggested filename for a backup.
 *
 * @param planNickname - Optional nickname from the plan for the filename
 * @returns Suggested filename with timestamp
 */
export function generateBackupFilename(planNickname?: string): string {
	const date = new Date().toISOString().split('T')[0];
	const safeName = planNickname
		? planNickname.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
		: 'wellbeing-plan';
	return `${safeName}-backup-${date}${BACKUP_FILE_EXTENSION}`;
}

/**
 * Validate that a file has the correct extension for a backup.
 *
 * @param filename - The filename to check
 * @returns True if the file has a valid backup extension
 */
export function isValidBackupFile(filename: string): boolean {
	const lowerName = filename.toLowerCase();
	return lowerName.endsWith(BACKUP_FILE_EXTENSION) || lowerName.endsWith('.json');
}

/**
 * Trigger a download of the backup file in the browser.
 *
 * @param backupJson - The encrypted backup JSON string
 * @param filename - The filename for the download
 */
export function triggerDownload(backupJson: string, filename: string): void {
	const blob = new Blob([backupJson], { type: BACKUP_MIME_TYPE });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();

	// Cleanup
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
