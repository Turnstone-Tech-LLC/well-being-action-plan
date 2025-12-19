<script lang="ts">
	/**
	 * SummaryStats component displaying summary statistics for check-ins.
	 * Shows total count, zone breakdown visualization, and top coping skills.
	 */

	interface TopStrategy {
		id: string;
		title: string;
		count: number;
	}

	interface Props {
		total: number;
		byZone: { green: number; yellow: number; red: number };
		topStrategies: TopStrategy[];
		streak: number;
	}

	let { total, byZone, topStrategies, streak }: Props = $props();

	// Calculate percentages for the zone bar
	let greenPercent = $derived(total > 0 ? Math.round((byZone.green / total) * 100) : 0);
	let yellowPercent = $derived(total > 0 ? Math.round((byZone.yellow / total) * 100) : 0);
	let redPercent = $derived(total > 0 ? Math.round((byZone.red / total) * 100) : 0);

	function formatStreak(count: number): string {
		if (count === 0) return 'No streak';
		if (count === 1) return '1 day';
		return `${count} days`;
	}
</script>

<section class="summary-stats" aria-label="Check-in summary statistics">
	<div class="stats-grid">
		<!-- Total Check-ins -->
		<div class="stat-card total-card">
			<div class="stat-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 11l3 3L22 4" />
					<path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{total}</span>
				<span class="stat-label">Check-in{total !== 1 ? 's' : ''}</span>
			</div>
		</div>

		<!-- Current Streak -->
		<div class="stat-card streak-card">
			<div class="stat-icon" class:has-streak={streak > 0} aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path
						d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
					/>
					<path d="M12 6v6l4 2" stroke-linecap="round" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value" class:streak-active={streak > 0}>{formatStreak(streak)}</span>
				<span class="stat-label">Streak</span>
			</div>
		</div>
	</div>

	<!-- Zone Breakdown -->
	{#if total > 0}
		<div class="zone-breakdown" aria-label="Zone breakdown">
			<h3 class="breakdown-title">Zone Breakdown</h3>

			<div
				class="zone-bar"
				role="img"
				aria-label="Zone distribution: {byZone.green} green, {byZone.yellow} yellow, {byZone.red} red"
			>
				{#if byZone.green > 0}
					<div class="zone-segment zone-green" style="width: {greenPercent}%">
						<span class="zone-segment-label" aria-hidden="true">{byZone.green}</span>
					</div>
				{/if}
				{#if byZone.yellow > 0}
					<div class="zone-segment zone-yellow" style="width: {yellowPercent}%">
						<span class="zone-segment-label" aria-hidden="true">{byZone.yellow}</span>
					</div>
				{/if}
				{#if byZone.red > 0}
					<div class="zone-segment zone-red" style="width: {redPercent}%">
						<span class="zone-segment-label" aria-hidden="true">{byZone.red}</span>
					</div>
				{/if}
			</div>

			<div class="zone-legend">
				<div class="legend-item">
					<span class="legend-dot zone-green-dot" aria-hidden="true"></span>
					<span class="legend-text">Green: {byZone.green}</span>
				</div>
				<div class="legend-item">
					<span class="legend-dot zone-yellow-dot" aria-hidden="true"></span>
					<span class="legend-text">Yellow: {byZone.yellow}</span>
				</div>
				<div class="legend-item">
					<span class="legend-dot zone-red-dot" aria-hidden="true"></span>
					<span class="legend-text">Red: {byZone.red}</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Top Coping Skills -->
	{#if topStrategies.length > 0}
		<div class="top-strategies" aria-label="Most used coping skills">
			<h3 class="strategies-title">Most Used Coping Skills</h3>
			<ol class="strategies-list">
				{#each topStrategies as strategy, index (strategy.id)}
					<li class="strategy-item">
						<span class="strategy-rank" aria-hidden="true">{index + 1}</span>
						<span class="strategy-title">{strategy.title}</span>
						<span class="strategy-count"
							>{strategy.count} time{strategy.count !== 1 ? 's' : ''}</span
						>
					</li>
				{/each}
			</ol>
		</div>
	{/if}
</section>

<style>
	.summary-stats {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
	}

	.stat-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-gray-100);
		border-radius: var(--radius-lg);
		color: var(--color-gray-500);
		flex-shrink: 0;
	}

	.stat-icon svg {
		width: 24px;
		height: 24px;
	}

	.stat-icon.has-streak {
		color: var(--color-accent);
		background-color: #fef9c3;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.stat-value {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.2;
	}

	.stat-value.streak-active {
		color: var(--color-primary);
	}

	.stat-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	/* Zone Breakdown */
	.zone-breakdown {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
	}

	.breakdown-title {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.zone-bar {
		display: flex;
		height: 32px;
		border-radius: var(--radius-md);
		overflow: hidden;
		background-color: var(--color-gray-100);
	}

	.zone-segment {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		transition: width 0.3s ease;
	}

	.zone-segment.zone-green {
		background-color: #22c55e;
	}

	.zone-segment.zone-yellow {
		background-color: #eab308;
	}

	.zone-segment.zone-red {
		background-color: #ef4444;
	}

	.zone-segment-label {
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--color-white);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.zone-legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.legend-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.zone-green-dot {
		background-color: #22c55e;
	}

	.zone-yellow-dot {
		background-color: #eab308;
	}

	.zone-red-dot {
		background-color: #ef4444;
	}

	.legend-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	/* Top Strategies */
	.top-strategies {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
	}

	.strategies-title {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.strategies-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.strategy-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-gray-100);
	}

	.strategy-item:last-child {
		border-bottom: none;
	}

	.strategy-rank {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-primary);
		color: var(--color-white);
		border-radius: 50%;
		font-size: var(--font-size-xs);
		font-weight: 600;
		flex-shrink: 0;
	}

	.strategy-title {
		flex: 1;
		font-size: var(--font-size-sm);
		color: var(--color-text);
	}

	.strategy-count {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.zone-segment {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.legend-dot,
		.zone-segment {
			border: 2px solid currentColor;
		}

		.stat-card,
		.zone-breakdown,
		.top-strategies {
			border: 2px solid currentColor;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 400px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.zone-legend {
			flex-direction: column;
			gap: var(--space-2);
		}
	}
</style>
