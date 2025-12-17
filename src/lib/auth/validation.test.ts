/**
 * Unit tests for auth validation utilities.
 */
import { describe, it, expect } from 'vitest';
import {
	isValidEmail,
	getAuthErrorMessage,
	isRateLimitError,
	isExpiredTokenError
} from './validation';

describe('isValidEmail', () => {
	it('returns true for valid email formats', () => {
		expect(isValidEmail('test@example.com')).toBe(true);
		expect(isValidEmail('user.name@domain.org')).toBe(true);
		expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
		expect(isValidEmail('provider@hospital.edu')).toBe(true);
	});

	it('returns false for invalid email formats', () => {
		expect(isValidEmail('')).toBe(false);
		expect(isValidEmail('notanemail')).toBe(false);
		expect(isValidEmail('@missing-local.com')).toBe(false);
		expect(isValidEmail('missing-domain@')).toBe(false);
		expect(isValidEmail('spaces in@email.com')).toBe(false);
		expect(isValidEmail('missing@tld')).toBe(false);
	});

	it('returns false for null/undefined values', () => {
		expect(isValidEmail(null as unknown as string)).toBe(false);
		expect(isValidEmail(undefined as unknown as string)).toBe(false);
	});

	it('trims whitespace from email', () => {
		expect(isValidEmail('  test@example.com  ')).toBe(true);
		expect(isValidEmail('\tuser@domain.org\n')).toBe(true);
	});
});

describe('getAuthErrorMessage', () => {
	it('returns appropriate message for access_denied', () => {
		expect(getAuthErrorMessage('access_denied')).toBe('Access denied');
		expect(getAuthErrorMessage('access_denied', 'Custom message')).toBe('Custom message');
	});

	it('returns appropriate message for expired_token', () => {
		expect(getAuthErrorMessage('expired_token')).toBe('Link expired. Please request a new one.');
	});

	it('returns appropriate message for otp_expired', () => {
		expect(getAuthErrorMessage('otp_expired')).toBe('Link expired. Please request a new one.');
	});

	it('returns appropriate message for invalid_request', () => {
		expect(getAuthErrorMessage('invalid_request')).toBe('Invalid link. Please request a new one.');
	});

	it('returns appropriate message for rate_limit', () => {
		expect(getAuthErrorMessage('rate_limit')).toBe(
			'Too many requests. Please wait a moment before trying again.'
		);
	});

	it('returns description for unknown errors', () => {
		expect(getAuthErrorMessage('unknown_error', 'Something went wrong')).toBe(
			'Something went wrong'
		);
	});

	it('returns default message for unknown errors without description', () => {
		expect(getAuthErrorMessage('unknown_error')).toBe('An error occurred. Please try again.');
	});
});

describe('isRateLimitError', () => {
	it('returns true for 429 status code', () => {
		expect(isRateLimitError('any message', 429)).toBe(true);
	});

	it('returns true for messages containing rate', () => {
		expect(isRateLimitError('Rate limit exceeded')).toBe(true);
		expect(isRateLimitError('you have been rate limited')).toBe(true);
		expect(isRateLimitError('RATE_LIMIT_ERROR')).toBe(true);
	});

	it('returns false for other errors', () => {
		expect(isRateLimitError('Invalid email')).toBe(false);
		expect(isRateLimitError('User not found', 404)).toBe(false);
	});
});

describe('isExpiredTokenError', () => {
	it('returns true for otp_expired code', () => {
		expect(isExpiredTokenError('any message', 'otp_expired')).toBe(true);
	});

	it('returns true for messages containing expired', () => {
		expect(isExpiredTokenError('Token has expired')).toBe(true);
		expect(isExpiredTokenError('EXPIRED_TOKEN')).toBe(true);
	});

	it('returns true for messages containing invalid', () => {
		expect(isExpiredTokenError('Invalid token')).toBe(true);
		expect(isExpiredTokenError('The link is invalid')).toBe(true);
	});

	it('returns false for other errors', () => {
		expect(isExpiredTokenError('Network error')).toBe(false);
		expect(isExpiredTokenError('User not found')).toBe(false);
	});
});
