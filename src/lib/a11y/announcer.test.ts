/**
 * Unit tests for screen reader announcer utility.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { announce, announcePolitely, announceAssertively, cleanupAnnouncers } from './announcer';

describe('announce', () => {
	beforeEach(() => {
		cleanupAnnouncers();
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanupAnnouncers();
		vi.useRealTimers();
	});

	it('creates a polite announcer element', () => {
		announce('Test message', 'polite');
		vi.advanceTimersByTime(100);

		const announcer = document.getElementById('sr-announcer-polite');
		expect(announcer).not.toBeNull();
		expect(announcer?.getAttribute('aria-live')).toBe('polite');
		expect(announcer?.getAttribute('role')).toBe('status');
	});

	it('creates an assertive announcer element', () => {
		announce('Test message', 'assertive');
		vi.advanceTimersByTime(100);

		const announcer = document.getElementById('sr-announcer-assertive');
		expect(announcer).not.toBeNull();
		expect(announcer?.getAttribute('aria-live')).toBe('assertive');
		expect(announcer?.getAttribute('role')).toBe('alert');
	});

	it('sets aria-atomic to true', () => {
		announce('Test message', 'polite');
		vi.advanceTimersByTime(100);

		const announcer = document.getElementById('sr-announcer-polite');
		expect(announcer?.getAttribute('aria-atomic')).toBe('true');
	});

	it('is visually hidden', () => {
		announce('Test message', 'polite');
		vi.advanceTimersByTime(100);

		const announcer = document.getElementById('sr-announcer-polite');
		expect(announcer?.style.position).toBe('absolute');
		expect(announcer?.style.width).toBe('1px');
		expect(announcer?.style.height).toBe('1px');
		expect(announcer?.style.overflow).toBe('hidden');
	});

	it('sets the message content after delay', () => {
		announce('Hello world', 'polite');

		const announcer = document.getElementById('sr-announcer-polite');
		expect(announcer?.textContent).toBe('');

		vi.advanceTimersByTime(100);
		expect(announcer?.textContent).toBe('Hello world');
	});

	it('reuses existing announcer element', () => {
		announce('First message', 'polite');
		vi.advanceTimersByTime(100);

		announce('Second message', 'polite');
		vi.advanceTimersByTime(100);

		const announcers = document.querySelectorAll('#sr-announcer-polite');
		expect(announcers).toHaveLength(1);
	});

	it('defaults to polite when no politeness specified', () => {
		announce('Default message');
		vi.advanceTimersByTime(100);

		const polite = document.getElementById('sr-announcer-polite');
		const assertive = document.getElementById('sr-announcer-assertive');

		expect(polite?.textContent).toBe('Default message');
		expect(assertive).toBeNull();
	});
});

describe('announcePolitely', () => {
	beforeEach(() => {
		cleanupAnnouncers();
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanupAnnouncers();
		vi.useRealTimers();
	});

	it('announces with polite politeness', () => {
		announcePolitely('Polite message');
		vi.advanceTimersByTime(100);

		const announcer = document.getElementById('sr-announcer-polite');
		expect(announcer?.textContent).toBe('Polite message');
	});
});

describe('announceAssertively', () => {
	beforeEach(() => {
		cleanupAnnouncers();
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanupAnnouncers();
		vi.useRealTimers();
	});

	it('announces with assertive politeness', () => {
		announceAssertively('Urgent message');
		vi.advanceTimersByTime(100);

		const announcer = document.getElementById('sr-announcer-assertive');
		expect(announcer?.textContent).toBe('Urgent message');
	});
});

describe('cleanupAnnouncers', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('removes all announcer elements', () => {
		announce('Polite', 'polite');
		announce('Assertive', 'assertive');
		vi.advanceTimersByTime(100);

		expect(document.getElementById('sr-announcer-polite')).not.toBeNull();
		expect(document.getElementById('sr-announcer-assertive')).not.toBeNull();

		cleanupAnnouncers();

		expect(document.getElementById('sr-announcer-polite')).toBeNull();
		expect(document.getElementById('sr-announcer-assertive')).toBeNull();
	});
});
