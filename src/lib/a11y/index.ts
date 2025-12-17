/**
 * Accessibility utilities for the Well-Being Action Plan app.
 */

export {
	createFocusTrap,
	getFocusableElements,
	getFirstFocusable,
	getLastFocusable,
	type FocusTrap,
	type FocusTrapOptions
} from './focus-trap';

export {
	announce,
	announcePolitely,
	announceAssertively,
	cleanupAnnouncers,
	type AnnouncementPoliteness
} from './announcer';

/**
 * Generate a unique ID for accessibility associations.
 * Useful for aria-describedby, aria-labelledby, etc.
 */
export function generateA11yId(prefix: string = 'a11y'): string {
	return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if the user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Subscribe to reduced motion preference changes.
 * Returns a cleanup function.
 */
export function onReducedMotionChange(callback: (prefersReduced: boolean) => void): () => void {
	if (typeof window === 'undefined') return () => {};

	const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	const handler = (event: MediaQueryListEvent) => callback(event.matches);

	mediaQuery.addEventListener('change', handler);
	return () => mediaQuery.removeEventListener('change', handler);
}
