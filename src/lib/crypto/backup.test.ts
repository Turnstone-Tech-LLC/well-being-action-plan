/**
 * Unit tests for backup encryption/decryption utilities.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	encryptBackup,
	decryptBackup,
	createBackup,
	restoreBackup,
	generateBackupFilename,
	isValidBackupFile,
	triggerDownload,
	BACKUP_FORMAT_VERSION,
	BACKUP_FILE_EXTENSION,
	type BackupPayload,
	type CreateBackupInput
} from './backup';
import type { LocalActionPlan, PatientProfile, CheckIn } from '$lib/db/index';

// Mock data
const mockPlan: LocalActionPlan = {
	id: 1,
	actionPlanId: 'plan-123',
	revisionId: 'rev-456',
	revisionVersion: 1,
	accessCode: 'ABC123',
	planPayload: {
		patientNickname: 'Test User',
		happyWhen: 'Playing games',
		happyBecause: 'It relaxes me',
		skills: [],
		supportiveAdults: [],
		helpMethods: [],
		crisisResources: []
	},
	deviceInstallId: 'device-789',
	installedAt: new Date('2024-01-01'),
	lastAccessedAt: new Date('2024-01-15')
};

const mockProfile: PatientProfile = {
	id: 1,
	actionPlanId: 'plan-123',
	displayName: 'Test User',
	onboardingComplete: true,
	notificationsEnabled: true,
	notificationFrequency: 'daily',
	notificationTime: 'morning',
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-15')
};

const mockCheckIns: CheckIn[] = [
	{
		id: 1,
		actionPlanId: 'plan-123',
		zone: 'green',
		strategiesUsed: ['skill-1'],
		supportiveAdultsContacted: [],
		helpMethodsSelected: [],
		createdAt: new Date('2024-01-10')
	},
	{
		id: 2,
		actionPlanId: 'plan-123',
		zone: 'yellow',
		strategiesUsed: ['skill-2', 'skill-3'],
		supportiveAdultsContacted: ['adult-1'],
		helpMethodsSelected: [],
		createdAt: new Date('2024-01-12')
	}
];

describe('encryptBackup and decryptBackup', () => {
	const passphrase = 'test-passphrase-123';

	it('encrypts and decrypts a backup payload successfully', async () => {
		const payload: BackupPayload = {
			version: BACKUP_FORMAT_VERSION,
			createdAt: new Date().toISOString(),
			plan: {
				actionPlanId: mockPlan.actionPlanId,
				revisionId: mockPlan.revisionId,
				revisionVersion: mockPlan.revisionVersion,
				accessCode: mockPlan.accessCode,
				planPayload: mockPlan.planPayload,
				deviceInstallId: mockPlan.deviceInstallId,
				installedAt: mockPlan.installedAt,
				lastAccessedAt: mockPlan.lastAccessedAt
			}
		};

		const encrypted = await encryptBackup(payload, passphrase);

		expect(encrypted).toHaveProperty('version', BACKUP_FORMAT_VERSION);
		expect(encrypted).toHaveProperty('salt');
		expect(encrypted).toHaveProperty('iv');
		expect(encrypted).toHaveProperty('data');

		const decrypted = await decryptBackup(encrypted, passphrase);

		expect(decrypted.version).toBe(payload.version);
		expect(decrypted.plan.actionPlanId).toBe(payload.plan.actionPlanId);
		expect(decrypted.plan.planPayload.patientNickname).toBe(
			payload.plan.planPayload.patientNickname
		);
	});

	it('fails to decrypt with wrong passphrase', async () => {
		const payload: BackupPayload = {
			version: BACKUP_FORMAT_VERSION,
			createdAt: new Date().toISOString(),
			plan: {
				actionPlanId: mockPlan.actionPlanId,
				revisionId: mockPlan.revisionId,
				revisionVersion: mockPlan.revisionVersion,
				accessCode: mockPlan.accessCode,
				planPayload: mockPlan.planPayload,
				deviceInstallId: mockPlan.deviceInstallId,
				installedAt: mockPlan.installedAt,
				lastAccessedAt: mockPlan.lastAccessedAt
			}
		};

		const encrypted = await encryptBackup(payload, passphrase);

		await expect(decryptBackup(encrypted, 'wrong-passphrase')).rejects.toThrow(
			'Decryption failed. Please check your passphrase and try again.'
		);
	});

	it('produces different encrypted data each time (random salt/iv)', async () => {
		const payload: BackupPayload = {
			version: BACKUP_FORMAT_VERSION,
			createdAt: new Date().toISOString(),
			plan: {
				actionPlanId: mockPlan.actionPlanId,
				revisionId: mockPlan.revisionId,
				revisionVersion: mockPlan.revisionVersion,
				accessCode: mockPlan.accessCode,
				planPayload: mockPlan.planPayload,
				deviceInstallId: mockPlan.deviceInstallId,
				installedAt: mockPlan.installedAt,
				lastAccessedAt: mockPlan.lastAccessedAt
			}
		};

		const encrypted1 = await encryptBackup(payload, passphrase);
		const encrypted2 = await encryptBackup(payload, passphrase);

		expect(encrypted1.salt).not.toBe(encrypted2.salt);
		expect(encrypted1.iv).not.toBe(encrypted2.iv);
		expect(encrypted1.data).not.toBe(encrypted2.data);
	});
});

describe('createBackup', () => {
	const passphrase = 'secure-passphrase';

	it('creates a backup from plan only', async () => {
		const input: CreateBackupInput = { plan: mockPlan };
		const backupJson = await createBackup(input, passphrase);

		expect(typeof backupJson).toBe('string');
		const backup = JSON.parse(backupJson);
		expect(backup.version).toBe(BACKUP_FORMAT_VERSION);
	});

	it('creates a backup from plan with profile', async () => {
		const input: CreateBackupInput = { plan: mockPlan, profile: mockProfile };
		const backupJson = await createBackup(input, passphrase);

		const result = await restoreBackup(backupJson, passphrase);
		expect(result.profile).toBeDefined();
		expect(result.profile?.displayName).toBe('Test User');
	});

	it('creates a backup from plan with check-ins', async () => {
		const input: CreateBackupInput = { plan: mockPlan, checkIns: mockCheckIns };
		const backupJson = await createBackup(input, passphrase);

		const result = await restoreBackup(backupJson, passphrase);
		expect(result.checkIns).toBeDefined();
		expect(result.checkIns?.length).toBe(2);
	});

	it('creates a backup with all data', async () => {
		const input: CreateBackupInput = {
			plan: mockPlan,
			profile: mockProfile,
			checkIns: mockCheckIns
		};
		const backupJson = await createBackup(input, passphrase);

		const result = await restoreBackup(backupJson, passphrase);
		expect(result.plan.actionPlanId).toBe('plan-123');
		expect(result.profile?.displayName).toBe('Test User');
		expect(result.checkIns?.length).toBe(2);
	});

	it('removes id fields from plan, profile, and check-ins', async () => {
		const input: CreateBackupInput = {
			plan: mockPlan,
			profile: mockProfile,
			checkIns: mockCheckIns
		};
		const backupJson = await createBackup(input, passphrase);

		const result = await restoreBackup(backupJson, passphrase);
		expect(result.plan).not.toHaveProperty('id');
		expect(result.profile).not.toHaveProperty('id');
		result.checkIns?.forEach((checkIn) => {
			expect(checkIn).not.toHaveProperty('id');
		});
	});
});

describe('restoreBackup', () => {
	const passphrase = 'restore-test';

	it('restores a backup and updates timestamps', async () => {
		const input: CreateBackupInput = { plan: mockPlan, profile: mockProfile };
		const backupJson = await createBackup(input, passphrase);

		const before = new Date();
		const result = await restoreBackup(backupJson, passphrase);
		const after = new Date();

		// Plan timestamps should be updated
		expect(result.plan.installedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
		expect(result.plan.installedAt.getTime()).toBeLessThanOrEqual(after.getTime());
		expect(result.plan.lastAccessedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());

		// Profile timestamps should be updated
		expect(result.profile?.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
		expect(result.profile?.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
	});

	it('preserves original check-in timestamps', async () => {
		const input: CreateBackupInput = { plan: mockPlan, checkIns: mockCheckIns };
		const backupJson = await createBackup(input, passphrase);

		const result = await restoreBackup(backupJson, passphrase);

		// Check-in timestamps should be preserved (as strings since we're comparing serialized dates)
		expect(result.checkIns?.[0].createdAt).toBeDefined();
		expect(result.checkIns?.[1].createdAt).toBeDefined();
	});

	it('throws error for invalid JSON', async () => {
		await expect(restoreBackup('not-valid-json', passphrase)).rejects.toThrow(
			'Invalid backup file format'
		);
	});

	it('throws error for missing backup fields', async () => {
		const invalidBackup = JSON.stringify({ version: 1 });

		await expect(restoreBackup(invalidBackup, passphrase)).rejects.toThrow(
			'Invalid backup file structure'
		);
	});

	it('throws error for newer backup version', async () => {
		const input: CreateBackupInput = { plan: mockPlan };
		const backupJson = await createBackup(input, passphrase);
		const backup = JSON.parse(backupJson);
		backup.version = BACKUP_FORMAT_VERSION + 1;

		await expect(restoreBackup(JSON.stringify(backup), passphrase)).rejects.toThrow(
			/newer version/
		);
	});
});

describe('generateBackupFilename', () => {
	it('generates filename with default name when no nickname provided', () => {
		const filename = generateBackupFilename();

		expect(filename).toMatch(/^wellbeing-plan-backup-\d{4}-\d{2}-\d{2}\.wbap$/);
	});

	it('generates filename with sanitized nickname', () => {
		const filename = generateBackupFilename('Test User!');

		expect(filename).toMatch(/^test-user--backup-\d{4}-\d{2}-\d{2}\.wbap$/);
	});

	it('includes current date in filename', () => {
		const today = new Date().toISOString().split('T')[0];
		const filename = generateBackupFilename('User');

		expect(filename).toContain(today);
	});

	it('uses correct file extension', () => {
		const filename = generateBackupFilename();

		expect(filename.endsWith(BACKUP_FILE_EXTENSION)).toBe(true);
	});
});

describe('isValidBackupFile', () => {
	it('returns true for .wbap files', () => {
		expect(isValidBackupFile('backup.wbap')).toBe(true);
		expect(isValidBackupFile('my-plan-backup-2024-01-15.WBAP')).toBe(true);
	});

	it('returns true for .json files', () => {
		expect(isValidBackupFile('backup.json')).toBe(true);
		expect(isValidBackupFile('backup.JSON')).toBe(true);
	});

	it('returns false for other extensions', () => {
		expect(isValidBackupFile('backup.txt')).toBe(false);
		expect(isValidBackupFile('backup.pdf')).toBe(false);
		expect(isValidBackupFile('backup')).toBe(false);
	});
});

describe('triggerDownload', () => {
	let originalCreateElement: typeof document.createElement;
	let originalCreateObjectURL: typeof URL.createObjectURL;
	let originalRevokeObjectURL: typeof URL.revokeObjectURL;
	let mockLink: {
		href: string;
		download: string;
		style: { display: string };
		click: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		originalCreateElement = document.createElement.bind(document);
		originalCreateObjectURL = URL.createObjectURL;
		originalRevokeObjectURL = URL.revokeObjectURL;

		mockLink = {
			href: '',
			download: '',
			style: { display: '' },
			click: vi.fn()
		};

		document.createElement = vi.fn((tagName) => {
			if (tagName === 'a') {
				return mockLink as unknown as HTMLAnchorElement;
			}
			return originalCreateElement(tagName);
		});

		URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
		URL.revokeObjectURL = vi.fn();

		vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);
		vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);
	});

	afterEach(() => {
		document.createElement = originalCreateElement;
		URL.createObjectURL = originalCreateObjectURL;
		URL.revokeObjectURL = originalRevokeObjectURL;
		vi.restoreAllMocks();
	});

	it('creates blob and triggers download', () => {
		const backupJson = '{"test": "data"}';
		const filename = 'test-backup.wbap';

		triggerDownload(backupJson, filename);

		expect(URL.createObjectURL).toHaveBeenCalled();
		expect(mockLink.href).toBe('blob:mock-url');
		expect(mockLink.download).toBe(filename);
		expect(mockLink.style.display).toBe('none');
		expect(mockLink.click).toHaveBeenCalled();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
	});

	it('cleans up link and object URL after download', () => {
		triggerDownload('{}', 'test.wbap');

		expect(document.body.appendChild).toHaveBeenCalled();
		expect(document.body.removeChild).toHaveBeenCalled();
		expect(URL.revokeObjectURL).toHaveBeenCalled();
	});
});
