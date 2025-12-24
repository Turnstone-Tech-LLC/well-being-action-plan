import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import {
	PLAN_COOKIE_NAME,
	PLAN_COOKIE_VALUE,
	hasPlanCookie,
	setPlanCookie,
	clearPlanCookie,
	AUTH_REDIRECT_COOKIE_NAME,
	getAuthRedirect,
	setAuthRedirect,
	clearAuthRedirect
} from './cookies.server';

// Mock Cookies interface
function createMockCookies(): Cookies & { store: Map<string, string> } {
	const store = new Map<string, string>();

	return {
		store,
		get: vi.fn((name: string) => store.get(name)),
		getAll: vi.fn(() => Array.from(store.entries()).map(([name, value]) => ({ name, value }))),
		set: vi.fn((name: string, value: string) => {
			store.set(name, value);
		}),
		delete: vi.fn((name: string) => {
			store.delete(name);
		}),
		serialize: vi.fn(() => '')
	};
}

describe('cookies.server', () => {
	let mockCookies: ReturnType<typeof createMockCookies>;

	beforeEach(() => {
		mockCookies = createMockCookies();
	});

	describe('PLAN_COOKIE_NAME', () => {
		it('should be wbap_has_plan', () => {
			expect(PLAN_COOKIE_NAME).toBe('wbap_has_plan');
		});
	});

	describe('PLAN_COOKIE_VALUE', () => {
		it('should be true', () => {
			expect(PLAN_COOKIE_VALUE).toBe('true');
		});
	});

	describe('hasPlanCookie', () => {
		it('should return false when no cookie is set', () => {
			expect(hasPlanCookie(mockCookies)).toBe(false);
		});

		it('should return true when plan cookie is set with correct value', () => {
			mockCookies.store.set(PLAN_COOKIE_NAME, PLAN_COOKIE_VALUE);
			expect(hasPlanCookie(mockCookies)).toBe(true);
		});

		it('should return false when cookie has wrong value', () => {
			mockCookies.store.set(PLAN_COOKIE_NAME, 'false');
			expect(hasPlanCookie(mockCookies)).toBe(false);
		});

		it('should use exact key matching (not substring)', () => {
			// Set a cookie with similar name - should not match
			mockCookies.store.set(`${PLAN_COOKIE_NAME}_backup`, PLAN_COOKIE_VALUE);
			expect(hasPlanCookie(mockCookies)).toBe(false);
		});
	});

	describe('setPlanCookie', () => {
		it('should set the plan cookie with correct value', () => {
			setPlanCookie(mockCookies);
			expect(mockCookies.set).toHaveBeenCalledWith(
				PLAN_COOKIE_NAME,
				PLAN_COOKIE_VALUE,
				expect.objectContaining({
					path: '/',
					httpOnly: false,
					sameSite: 'lax'
				})
			);
		});

		it('should set a long max-age (10 years)', () => {
			setPlanCookie(mockCookies);
			const call = vi.mocked(mockCookies.set).mock.calls[0];
			const options = call[2];
			// 10 years in seconds
			expect(options?.maxAge).toBe(60 * 60 * 24 * 365 * 10);
		});
	});

	describe('clearPlanCookie', () => {
		it('should delete the plan cookie', () => {
			clearPlanCookie(mockCookies);
			expect(mockCookies.delete).toHaveBeenCalledWith(PLAN_COOKIE_NAME, { path: '/' });
		});
	});

	describe('AUTH_REDIRECT_COOKIE_NAME', () => {
		it('should be wbap_auth_redirect', () => {
			expect(AUTH_REDIRECT_COOKIE_NAME).toBe('wbap_auth_redirect');
		});
	});

	describe('getAuthRedirect', () => {
		it('should return null when no cookie is set', () => {
			expect(getAuthRedirect(mockCookies)).toBeNull();
		});

		it('should return the redirect URL when cookie is set', () => {
			mockCookies.store.set(AUTH_REDIRECT_COOKIE_NAME, '/provider/plans/123');
			expect(getAuthRedirect(mockCookies)).toBe('/provider/plans/123');
		});
	});

	describe('setAuthRedirect', () => {
		it('should set the redirect cookie with correct value', () => {
			setAuthRedirect(mockCookies, '/provider/plans/123');
			expect(mockCookies.set).toHaveBeenCalledWith(
				AUTH_REDIRECT_COOKIE_NAME,
				'/provider/plans/123',
				expect.objectContaining({
					path: '/',
					httpOnly: true,
					sameSite: 'lax'
				})
			);
		});

		it('should set a short max-age (1 hour)', () => {
			setAuthRedirect(mockCookies, '/provider');
			const call = vi.mocked(mockCookies.set).mock.calls[0];
			const options = call[2];
			// 1 hour in seconds
			expect(options?.maxAge).toBe(60 * 60);
		});
	});

	describe('clearAuthRedirect', () => {
		it('should delete the auth redirect cookie', () => {
			clearAuthRedirect(mockCookies);
			expect(mockCookies.delete).toHaveBeenCalledWith(AUTH_REDIRECT_COOKIE_NAME, { path: '/' });
		});
	});

	describe('auth redirect lifecycle', () => {
		it('should support set -> get -> clear -> get cycle', () => {
			expect(getAuthRedirect(mockCookies)).toBeNull();

			setAuthRedirect(mockCookies, '/provider/settings');
			mockCookies.store.set(AUTH_REDIRECT_COOKIE_NAME, '/provider/settings');
			expect(getAuthRedirect(mockCookies)).toBe('/provider/settings');

			clearAuthRedirect(mockCookies);
			mockCookies.store.delete(AUTH_REDIRECT_COOKIE_NAME);
			expect(getAuthRedirect(mockCookies)).toBeNull();
		});
	});
});
