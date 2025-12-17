/**
 * Focus trap utility for modals and dialogs.
 * Traps focus within a container element for keyboard accessibility.
 */

const FOCUSABLE_SELECTORS = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
	'[contenteditable="true"]'
].join(', ');

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
	const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
	return Array.from(elements).filter((el) => {
		// Filter out elements that are hidden or have display: none
		const style = window.getComputedStyle(el);
		return style.display !== 'none' && style.visibility !== 'hidden';
	});
}

/**
 * Get the first focusable element in a container
 */
export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
	const focusable = getFocusableElements(container);
	return focusable[0] || null;
}

/**
 * Get the last focusable element in a container
 */
export function getLastFocusable(container: HTMLElement): HTMLElement | null {
	const focusable = getFocusableElements(container);
	return focusable[focusable.length - 1] || null;
}

export interface FocusTrapOptions {
	/** Element to focus when trap is activated. Defaults to first focusable. */
	initialFocus?: HTMLElement | null;
	/** Element to return focus to when trap is deactivated */
	returnFocus?: HTMLElement | null;
	/** Callback when escape key is pressed */
	onEscape?: () => void;
}

export interface FocusTrap {
	activate: () => void;
	deactivate: () => void;
}

/**
 * Create a focus trap for a container element.
 * Focus will cycle within the container when tabbing.
 */
export function createFocusTrap(container: HTMLElement, options: FocusTrapOptions = {}): FocusTrap {
	let active = false;
	const previouslyFocused = options.returnFocus || (document.activeElement as HTMLElement);

	function handleKeyDown(event: KeyboardEvent) {
		if (!active) return;

		if (event.key === 'Escape' && options.onEscape) {
			event.preventDefault();
			options.onEscape();
			return;
		}

		if (event.key !== 'Tab') return;

		const focusable = getFocusableElements(container);
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const activeElement = document.activeElement as HTMLElement;

		// Shift + Tab at the beginning - go to end
		if (event.shiftKey && activeElement === first) {
			event.preventDefault();
			last.focus();
			return;
		}

		// Tab at the end - go to beginning
		if (!event.shiftKey && activeElement === last) {
			event.preventDefault();
			first.focus();
			return;
		}

		// If focus is outside the container, bring it back
		if (!container.contains(activeElement)) {
			event.preventDefault();
			first.focus();
		}
	}

	function activate() {
		if (active) return;
		active = true;

		document.addEventListener('keydown', handleKeyDown);

		// Focus the initial element or first focusable
		const focusTarget = options.initialFocus || getFirstFocusable(container);
		if (focusTarget) {
			// Use requestAnimationFrame to ensure the element is in the DOM
			requestAnimationFrame(() => {
				focusTarget.focus();
			});
		}
	}

	function deactivate() {
		if (!active) return;
		active = false;

		document.removeEventListener('keydown', handleKeyDown);

		// Return focus to the previously focused element
		if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
			previouslyFocused.focus();
		}
	}

	return { activate, deactivate };
}
