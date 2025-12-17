/**
 * Screen reader announcement utilities.
 * Uses ARIA live regions to announce dynamic content changes.
 */

export type AnnouncementPoliteness = 'polite' | 'assertive';

/**
 * Get or create the announcer element.
 * The announcer is a visually hidden element with aria-live.
 */
function getAnnouncer(politeness: AnnouncementPoliteness): HTMLElement {
	const id = `sr-announcer-${politeness}`;
	let element = document.getElementById(id);

	if (!element) {
		element = document.createElement('div');
		element.id = id;
		element.setAttribute('aria-live', politeness);
		element.setAttribute('aria-atomic', 'true');
		element.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');

		// Visually hidden but available to screen readers
		Object.assign(element.style, {
			position: 'absolute',
			width: '1px',
			height: '1px',
			padding: '0',
			margin: '-1px',
			overflow: 'hidden',
			clip: 'rect(0, 0, 0, 0)',
			whiteSpace: 'nowrap',
			border: '0'
		});

		document.body.appendChild(element);
	}

	return element;
}

/**
 * Announce a message to screen readers.
 *
 * @param message - The message to announce
 * @param politeness - 'polite' waits for idle, 'assertive' interrupts immediately
 */
export function announce(message: string, politeness: AnnouncementPoliteness = 'polite'): void {
	const element = getAnnouncer(politeness);

	// Clear the content first to ensure the announcement is made even if the text is the same
	element.textContent = '';

	// Use a timeout to ensure the clearing is processed before setting new content
	setTimeout(() => {
		element.textContent = message;
	}, 50);
}

/**
 * Announce a message politely (doesn't interrupt current speech).
 * Use for non-critical updates like "Loading complete".
 */
export function announcePolitely(message: string): void {
	announce(message, 'polite');
}

/**
 * Announce a message assertively (interrupts current speech).
 * Use for critical alerts like errors or urgent status changes.
 */
export function announceAssertively(message: string): void {
	announce(message, 'assertive');
}

/**
 * Clean up announcer elements (useful for testing).
 */
export function cleanupAnnouncers(): void {
	const polite = document.getElementById('sr-announcer-polite');
	const assertive = document.getElementById('sr-announcer-assertive');
	polite?.remove();
	assertive?.remove();
}
