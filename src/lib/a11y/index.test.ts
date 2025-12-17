/**
 * Unit tests for accessibility utility functions.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateA11yId, prefersReducedMotion, onReducedMotionChange } from './index';

describe('generateA11yId', () => {
	it('generates unique IDs', () => {
		const id1 = generateA11yId();
		const id2 = generateA11yId();
		expect(id1).not.toBe(id2);
	});

	it('uses default prefix', () => {
		const id = generateA11yId();
		expect(id).toMatch(/^a11y-[a-z0-9]+$/);
	});

	it('uses custom prefix', () => {
		const id = generateA11yId('error');
		expect(id).toMatch(/^error-[a-z0-9]+$/);
	});
});

describe('prefersReducedMotion', () => {
	let originalMatchMedia: typeof window.matchMedia;

	beforeEach(() => {
		originalMatchMedia = window.matchMedia;
	});

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
	});

	it('returns true when user prefers reduced motion', () => {
		window.matchMedia = vi.fn().mockImplementation((query) => ({
			matches: query === '(prefers-reduced-motion: reduce)',
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		}));

		expect(prefersReducedMotion()).toBe(true);
	});

	it('returns false when user does not prefer reduced motion', () => {
		window.matchMedia = vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		}));

		expect(prefersReducedMotion()).toBe(false);
	});
});

describe('onReducedMotionChange', () => {
	let originalMatchMedia: typeof window.matchMedia;

	beforeEach(() => {
		originalMatchMedia = window.matchMedia;
	});

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
	});

	it('subscribes to reduced motion changes', () => {
		const addEventListener = vi.fn();
		const removeEventListener = vi.fn();

		window.matchMedia = vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			addEventListener,
			removeEventListener
		}));

		const callback = vi.fn();
		const cleanup = onReducedMotionChange(callback);

		expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

		// Simulate change event
		const handler = addEventListener.mock.calls[0][1];
		handler({ matches: true } as MediaQueryListEvent);

		expect(callback).toHaveBeenCalledWith(true);

		// Cleanup
		cleanup();
		expect(removeEventListener).toHaveBeenCalled();
	});

	it('returns cleanup function', () => {
		const removeEventListener = vi.fn();

		window.matchMedia = vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener
		}));

		const cleanup = onReducedMotionChange(vi.fn());
		cleanup();

		expect(removeEventListener).toHaveBeenCalled();
	});
});
