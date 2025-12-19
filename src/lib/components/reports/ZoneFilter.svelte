<script lang="ts">
	/**
	 * ZoneFilter component for filtering check-ins by zone.
	 * Provides filter pills for All, Green, Yellow, and Red zones.
	 */
	import type { CheckInZone } from '$lib/db/index';

	export type ZoneFilterValue = 'all' | CheckInZone;

	interface Props {
		activeZone: ZoneFilterValue;
		onZoneChange: (zone: ZoneFilterValue) => void;
		/** Optional counts for each zone to display in pills */
		counts?: {
			all: number;
			green: number;
			yellow: number;
			red: number;
		};
	}

	let { activeZone, onZoneChange, counts }: Props = $props();

	const zones: { value: ZoneFilterValue; label: string; ariaLabel: string }[] = [
		{ value: 'all', label: 'All', ariaLabel: 'Show all zones' },
		{ value: 'green', label: 'Green', ariaLabel: 'Show only green zone check-ins' },
		{ value: 'yellow', label: 'Yellow', ariaLabel: 'Show only yellow zone check-ins' },
		{ value: 'red', label: 'Red', ariaLabel: 'Show only red zone check-ins' }
	];
</script>

<div class="zone-filter" role="group" aria-label="Zone filter">
	{#each zones as zone (zone.value)}
		<button
			type="button"
			class="zone-pill zone-{zone.value}"
			class:active={activeZone === zone.value}
			onclick={() => onZoneChange(zone.value)}
			aria-pressed={activeZone === zone.value}
			aria-label={zone.ariaLabel}
		>
			{#if zone.value !== 'all'}
				<span class="zone-dot" aria-hidden="true"></span>
			{/if}
			<span class="zone-label">{zone.label}</span>
			{#if counts}
				<span class="zone-count" aria-label="{counts[zone.value]} check-ins">
					{counts[zone.value]}
				</span>
			{/if}
		</button>
	{/each}
</div>

<style>
	.zone-filter {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.zone-pill {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-xl);
		background-color: var(--color-white);
		color: var(--color-text);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease;
		min-height: 44px;
	}

	.zone-pill:hover:not(.active) {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.zone-pill:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.zone-pill.active {
		border-width: 2px;
	}

	/* Zone-specific active states */
	.zone-pill.zone-all.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-white);
	}

	.zone-pill.zone-green.active {
		background-color: #dcfce7;
		border-color: #22c55e;
		color: #166534;
	}

	.zone-pill.zone-yellow.active {
		background-color: #fef9c3;
		border-color: #eab308;
		color: #854d0e;
	}

	.zone-pill.zone-red.active {
		background-color: #fee2e2;
		border-color: #ef4444;
		color: #991b1b;
	}

	/* Zone dots */
	.zone-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.zone-green .zone-dot {
		background-color: #22c55e;
	}

	.zone-yellow .zone-dot {
		background-color: #eab308;
	}

	.zone-red .zone-dot {
		background-color: #ef4444;
	}

	/* Zone count badge */
	.zone-count {
		padding: var(--space-1) var(--space-2);
		background-color: var(--color-gray-100);
		border-radius: var(--radius-md);
		font-size: var(--font-size-xs);
		font-weight: 600;
		min-width: 24px;
		text-align: center;
	}

	.zone-pill.active .zone-count {
		background-color: rgba(255, 255, 255, 0.3);
	}

	.zone-pill.zone-all.active .zone-count {
		background-color: rgba(255, 255, 255, 0.3);
	}

	.zone-pill.zone-green.active .zone-count {
		background-color: rgba(22, 101, 52, 0.15);
	}

	.zone-pill.zone-yellow.active .zone-count {
		background-color: rgba(133, 77, 14, 0.15);
	}

	.zone-pill.zone-red.active .zone-count {
		background-color: rgba(153, 27, 27, 0.15);
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.zone-pill {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.zone-pill.active {
			border: 3px solid CanvasText;
		}

		.zone-pill:focus-visible {
			outline: 3px solid CanvasText;
		}

		.zone-dot {
			border: 2px solid currentColor;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 400px) {
		.zone-filter {
			flex-wrap: nowrap;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
			padding-bottom: var(--space-2);
		}

		.zone-pill {
			flex-shrink: 0;
		}
	}
</style>
