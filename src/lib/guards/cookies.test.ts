/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
	PLAN_COOKIE_NAME,
	PLAN_COOKIE_VALUE,
	hasPlanCookie,
	setPlanCookie,
	clearPlanCookie
} from './cookies';

describe('cookies (client-side)', () => {
	beforeEach(() => {
		// Clear all cookies before each test
		document.cookie.split(';').forEach((cookie) => {
			const name = cookie.split('=')[0].trim();
			document.cookie = `${name}=; max-age=0; path=/`;
		});
	});

	afterEach(() => {
		// Clean up after each test
		document.cookie.split(';').forEach((cookie) => {
			const name = cookie.split('=')[0].trim();
			document.cookie = `${name}=; max-age=0; path=/`;
		});
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
			expect(hasPlanCookie()).toBe(false);
		});

		it('should return true when plan cookie is set', () => {
			document.cookie = `${PLAN_COOKIE_NAME}=${PLAN_COOKIE_VALUE}; path=/`;
			expect(hasPlanCookie()).toBe(true);
		});

		it('should return false when cookie has wrong value', () => {
			document.cookie = `${PLAN_COOKIE_NAME}=false; path=/`;
			expect(hasPlanCookie()).toBe(false);
		});

		it('should return false for similar cookie names', () => {
			// This tests that we match the exact cookie, not a substring
			// The includes() check includes the = sign, so wbap_has_plan_backup=true
			// does NOT match wbap_has_plan=true (different strings)
			document.cookie = `${PLAN_COOKIE_NAME}_backup=${PLAN_COOKIE_VALUE}; path=/`;
			expect(hasPlanCookie()).toBe(false);
		});
	});

	describe('setPlanCookie', () => {
		it('should set the plan cookie', () => {
			expect(hasPlanCookie()).toBe(false);
			setPlanCookie();
			expect(hasPlanCookie()).toBe(true);
		});

		it('should be idempotent', () => {
			setPlanCookie();
			setPlanCookie();
			expect(hasPlanCookie()).toBe(true);
		});
	});

	describe('clearPlanCookie', () => {
		it('should clear the plan cookie', () => {
			setPlanCookie();
			expect(hasPlanCookie()).toBe(true);
			clearPlanCookie();
			expect(hasPlanCookie()).toBe(false);
		});

		it('should be safe to call when no cookie exists', () => {
			expect(hasPlanCookie()).toBe(false);
			clearPlanCookie();
			expect(hasPlanCookie()).toBe(false);
		});
	});

	describe('cookie lifecycle', () => {
		it('should support set -> check -> clear -> check cycle', () => {
			expect(hasPlanCookie()).toBe(false);
			setPlanCookie();
			expect(hasPlanCookie()).toBe(true);
			clearPlanCookie();
			expect(hasPlanCookie()).toBe(false);
		});
	});
});
