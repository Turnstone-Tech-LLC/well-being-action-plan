<script lang="ts">
	/**
	 * ZoneDot component - shared primitive for displaying zone-colored dots/shapes.
	 *
	 * Accessibility: Uses shape variation in addition to color
	 * - Green: Circle
	 * - Yellow: Triangle
	 * - Red: Square
	 *
	 * Used by:
	 * - PatientTimeline (View 1)
	 * - ProviderSummary (View 2)
	 */
	import type { CheckInZone } from '$lib/db/index';

	interface Props {
		zone: CheckInZone;
		/** Size in pixels (default: 12) */
		size?: number;
		/** Whether the dot is interactive/clickable */
		interactive?: boolean;
		/** Additional CSS class */
		class?: string;
		/** Accessible label for screen readers */
		label?: string;
	}

	let { zone, size = 12, interactive = false, class: className = '', label }: Props = $props();

	/**
	 * Get shape name for accessibility.
	 */
	function getShapeName(z: CheckInZone): string {
		switch (z) {
			case 'green':
				return 'circle';
			case 'yellow':
				return 'triangle';
			case 'red':
				return 'square';
		}
	}

	/**
	 * Get zone display label.
	 */
	function getZoneLabel(z: CheckInZone): string {
		switch (z) {
			case 'green':
				return 'Feeling good';
			case 'yellow':
				return 'Needed support';
			case 'red':
				return 'Reached out';
		}
	}

	let shapeName = $derived(getShapeName(zone));
	let defaultLabel = $derived(`${getZoneLabel(zone)} (${shapeName})`);
	let ariaLabel = $derived(label || defaultLabel);
</script>

<span
	class="zone-dot zone-{zone} shape-{shapeName} {className}"
	class:interactive
	style="--dot-size: {size}px"
	role="img"
	aria-label={ariaLabel}
>
	{#if zone === 'green'}
		<!-- Circle for green -->
		<svg class="shape-svg" viewBox="0 0 24 24" aria-hidden="true">
			<circle cx="12" cy="12" r="10" fill="currentColor" />
		</svg>
	{:else if zone === 'yellow'}
		<!-- Triangle for yellow -->
		<svg class="shape-svg" viewBox="0 0 24 24" aria-hidden="true">
			<polygon points="12,2 22,20 2,20" fill="currentColor" />
		</svg>
	{:else}
		<!-- Square for red -->
		<svg class="shape-svg" viewBox="0 0 24 24" aria-hidden="true">
			<rect x="2" y="2" width="20" height="20" fill="currentColor" />
		</svg>
	{/if}
</span>

<style>
	.zone-dot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--dot-size);
		height: var(--dot-size);
		flex-shrink: 0;
	}

	.zone-dot.interactive {
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	.zone-dot.interactive:hover {
		transform: scale(1.15);
	}

	.shape-svg {
		width: 100%;
		height: 100%;
	}

	/* Zone colors - matches UVM brand guidelines */
	.zone-green {
		color: var(--color-primary, #00594c);
	}

	.zone-yellow {
		color: #eab308;
	}

	.zone-red {
		color: #dc2626;
	}

	/* Print styles */
	@media print {
		.zone-dot {
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.zone-dot.interactive {
			transition: none;
		}
	}

	/* High contrast mode */
	@media (forced-colors: active) {
		.zone-dot {
			border: 1px solid currentColor;
			border-radius: 2px;
		}
	}
</style>
