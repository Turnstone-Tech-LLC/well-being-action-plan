/**
 * Unit tests for focus trap utility.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	getFocusableElements,
	getFirstFocusable,
	getLastFocusable,
	createFocusTrap
} from './focus-trap';

describe('getFocusableElements', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
	});

	it('finds buttons', () => {
		container.innerHTML = '<button>Click me</button>';
		const elements = getFocusableElements(container);
		expect(elements).toHaveLength(1);
		expect(elements[0].tagName).toBe('BUTTON');
	});

	it('finds links with href', () => {
		container.innerHTML = '<a href="/test">Link</a>';
		const elements = getFocusableElements(container);
		expect(elements).toHaveLength(1);
		expect(elements[0].tagName).toBe('A');
	});

	it('excludes links without href', () => {
		container.innerHTML = '<a>Not a real link</a>';
		const elements = getFocusableElements(container);
		expect(elements).toHaveLength(0);
	});

	it('finds inputs, selects, and textareas', () => {
		container.innerHTML = `
			<input type="text" />
			<select><option>Option</option></select>
			<textarea></textarea>
		`;
		const elements = getFocusableElements(container);
		expect(elements).toHaveLength(3);
	});

	it('excludes disabled elements', () => {
		container.innerHTML = `
			<button disabled>Disabled</button>
			<input type="text" disabled />
			<button>Enabled</button>
		`;
		const elements = getFocusableElements(container);
		expect(elements).toHaveLength(1);
		expect(elements[0].textContent).toBe('Enabled');
	});

	it('finds elements with tabindex', () => {
		container.innerHTML = '<div tabindex="0">Focusable div</div>';
		const elements = getFocusableElements(container);
		expect(elements).toHaveLength(1);
	});

	it('excludes elements with tabindex="-1"', () => {
		container.innerHTML = '<div tabindex="-1">Not in tab order</div>';
		const elements = getFocusableElements(container);
		expect(elements).toHaveLength(0);
	});

	it('returns empty array for container with no focusable elements', () => {
		container.innerHTML = '<div><p>No focusable content</p></div>';
		const elements = getFocusableElements(container);
		expect(elements).toHaveLength(0);
	});
});

describe('getFirstFocusable', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
	});

	it('returns first focusable element', () => {
		container.innerHTML = `
			<button id="first">First</button>
			<button id="second">Second</button>
		`;
		const first = getFirstFocusable(container);
		expect(first?.id).toBe('first');
	});

	it('returns null when no focusable elements exist', () => {
		container.innerHTML = '<p>No focusable content</p>';
		const first = getFirstFocusable(container);
		expect(first).toBeNull();
	});
});

describe('getLastFocusable', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
	});

	it('returns last focusable element', () => {
		container.innerHTML = `
			<button id="first">First</button>
			<button id="second">Second</button>
			<button id="last">Last</button>
		`;
		const last = getLastFocusable(container);
		expect(last?.id).toBe('last');
	});

	it('returns null when no focusable elements exist', () => {
		container.innerHTML = '<p>No focusable content</p>';
		const last = getLastFocusable(container);
		expect(last).toBeNull();
	});
});

describe('createFocusTrap', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		container.innerHTML = `
			<button id="btn1">First</button>
			<button id="btn2">Second</button>
			<button id="btn3">Third</button>
		`;
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
	});

	it('focuses first element on activate', async () => {
		const trap = createFocusTrap(container);
		trap.activate();

		// Wait for requestAnimationFrame
		await new Promise((resolve) => requestAnimationFrame(resolve));

		expect(document.activeElement?.id).toBe('btn1');
		trap.deactivate();
	});

	it('focuses custom initial element when provided', async () => {
		const btn2 = container.querySelector('#btn2') as HTMLElement;
		const trap = createFocusTrap(container, { initialFocus: btn2 });
		trap.activate();

		await new Promise((resolve) => requestAnimationFrame(resolve));

		expect(document.activeElement?.id).toBe('btn2');
		trap.deactivate();
	});

	it('returns focus to previous element on deactivate', async () => {
		const outsideButton = document.createElement('button');
		outsideButton.id = 'outside';
		document.body.appendChild(outsideButton);
		outsideButton.focus();

		const trap = createFocusTrap(container);
		trap.activate();

		await new Promise((resolve) => requestAnimationFrame(resolve));

		trap.deactivate();
		expect(document.activeElement?.id).toBe('outside');

		outsideButton.remove();
	});

	it('calls onEscape when Escape key is pressed', async () => {
		const onEscape = vi.fn();
		const trap = createFocusTrap(container, { onEscape });
		trap.activate();

		await new Promise((resolve) => requestAnimationFrame(resolve));

		const event = new KeyboardEvent('keydown', { key: 'Escape' });
		document.dispatchEvent(event);

		expect(onEscape).toHaveBeenCalledTimes(1);
		trap.deactivate();
	});

	it('wraps focus from last to first on Tab', async () => {
		const trap = createFocusTrap(container);
		trap.activate();

		await new Promise((resolve) => requestAnimationFrame(resolve));

		// Focus the last button
		const btn3 = container.querySelector('#btn3') as HTMLElement;
		btn3.focus();

		// Simulate Tab key
		const event = new KeyboardEvent('keydown', {
			key: 'Tab',
			bubbles: true
		});
		document.dispatchEvent(event);

		// Focus should wrap to first
		expect(document.activeElement?.id).toBe('btn1');
		trap.deactivate();
	});

	it('wraps focus from first to last on Shift+Tab', async () => {
		const trap = createFocusTrap(container);
		trap.activate();

		await new Promise((resolve) => requestAnimationFrame(resolve));

		// Focus should be on first button
		expect(document.activeElement?.id).toBe('btn1');

		// Simulate Shift+Tab
		const event = new KeyboardEvent('keydown', {
			key: 'Tab',
			shiftKey: true,
			bubbles: true
		});
		document.dispatchEvent(event);

		// Focus should wrap to last
		expect(document.activeElement?.id).toBe('btn3');
		trap.deactivate();
	});

	it('does not respond to keys when deactivated', async () => {
		const onEscape = vi.fn();
		const trap = createFocusTrap(container, { onEscape });

		// Activate and immediately deactivate
		trap.activate();
		trap.deactivate();

		const event = new KeyboardEvent('keydown', { key: 'Escape' });
		document.dispatchEvent(event);

		expect(onEscape).not.toHaveBeenCalled();
	});
});
