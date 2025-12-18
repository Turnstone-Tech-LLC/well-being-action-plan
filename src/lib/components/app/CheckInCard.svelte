<script lang="ts">
	import type { CheckIn } from '$lib/db/index';
	import { formatRelativeDate, getZoneInfo, formatStrategiesSummary } from '$lib/db/checkIns';

	interface Props {
		checkIn: CheckIn;
	}

	let { checkIn }: Props = $props();

	let dateText = $derived(formatRelativeDate(checkIn.createdAt));
	let zoneInfo = $derived(getZoneInfo(checkIn.zone));
	let strategiesSummary = $derived(formatStrategiesSummary(checkIn.strategiesUsed));
</script>

<article class="check-in-card {zoneInfo.cssClass}" aria-label="Check-in from {dateText}">
	<div class="zone-indicator" aria-hidden="true">
		<span class="zone-dot"></span>
	</div>
	<div class="card-content">
		<div class="card-header">
			<span class="date">{dateText}</span>
			<span class="zone-label">{zoneInfo.label}</span>
		</div>
		{#if strategiesSummary}
			<p class="strategies-summary">{strategiesSummary}</p>
		{/if}
	</div>
</article>

<style>
	.check-in-card {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		min-width: 180px;
	}

	.zone-indicator {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-gray-100);
		flex-shrink: 0;
	}

	.zone-dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background-color: var(--color-gray-300);
	}

	/* Zone-specific colors */
	.zone-green .zone-indicator {
		background-color: #dcfce7;
	}

	.zone-green .zone-dot {
		background-color: #22c55e;
	}

	.zone-yellow .zone-indicator {
		background-color: #fef9c3;
	}

	.zone-yellow .zone-dot {
		background-color: #eab308;
	}

	.zone-red .zone-indicator {
		background-color: #fee2e2;
	}

	.zone-red .zone-dot {
		background-color: #ef4444;
	}

	/* Card content */
	.card-content {
		flex: 1;
		min-width: 0;
	}

	.card-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.date {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.zone-label {
		font-size: var(--font-size-sm);
		color: var(--color-text);
		font-weight: 600;
	}

	.strategies-summary {
		margin-top: var(--space-1);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.zone-dot {
			border: 2px solid currentColor;
		}

		.check-in-card {
			border: 2px solid currentColor;
		}
	}

	/* Touch targets */
	@media (pointer: coarse) {
		.check-in-card {
			min-height: 44px;
		}
	}
</style>
