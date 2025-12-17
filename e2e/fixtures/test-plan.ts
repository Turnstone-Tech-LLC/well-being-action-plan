/**
 * Test fixtures for E2E tests.
 * Contains sample plan data and backup files for testing.
 */

import type { PlanPayload } from '../../src/lib/db/index';

/**
 * Sample plan payload for testing.
 */
export const TEST_PLAN_PAYLOAD: PlanPayload = {
	patientNickname: 'Alex',
	happyWhen: 'I feel happy when I spend time with my friends and family.',
	happyBecause: 'Being with people I care about makes me feel loved and supported.',
	skills: [
		{
			id: 'skill-1',
			title: 'Deep Breathing',
			description: 'Take 5 slow, deep breaths when feeling stressed.',
			category: 'Calming',
			displayOrder: 1
		},
		{
			id: 'skill-2',
			title: 'Positive Self-Talk',
			description: 'Remind yourself of your strengths and past successes.',
			category: 'Thinking',
			displayOrder: 2
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
		},
		{
			id: 'adult-2',
			type: 'Teacher',
			name: 'Ms. Johnson',
			contactInfo: 'office@school.edu',
			isPrimary: false,
			displayOrder: 2
		}
	],
	helpMethods: [
		{
			id: 'help-1',
			title: 'Ask for a hug',
			description: 'Physical comfort can help when feeling overwhelmed.',
			displayOrder: 1
		},
		{
			id: 'help-2',
			title: 'Take a break together',
			description: 'Sometimes just being with someone helps.',
			displayOrder: 2
		}
	],
	crisisResources: [
		{
			id: 'crisis-1',
			name: '988 Suicide & Crisis Lifeline',
			contact: '988',
			contactType: 'phone',
			description: 'Free, 24/7 confidential support',
			displayOrder: 1
		},
		{
			id: 'crisis-2',
			name: 'Crisis Text Line',
			contact: 'HOME to 741741',
			contactType: 'text',
			description: 'Text-based crisis support',
			displayOrder: 2
		}
	]
};

/**
 * Sample local action plan data for testing.
 */
export const TEST_LOCAL_PLAN = {
	actionPlanId: 'test-plan-uuid-1234',
	revisionId: 'test-revision-uuid-5678',
	revisionVersion: 1,
	accessCode: 'TEST123',
	planPayload: TEST_PLAN_PAYLOAD,
	deviceInstallId: 'test-device-uuid-9999'
};

/**
 * Test passphrase for backup encryption/decryption.
 */
export const TEST_PASSPHRASE = 'test-passphrase-123';

/**
 * Invalid passphrase for testing error cases.
 */
export const WRONG_PASSPHRASE = 'wrong-passphrase-456';

/**
 * Token test values.
 */
export const TEST_TOKENS = {
	valid: 'VALID123',
	expired: 'EXPIRED456',
	used: 'USED789',
	revoked: 'REVOKED012',
	notFound: 'NOTFOUND999'
};
