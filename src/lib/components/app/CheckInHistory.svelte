<script lang="ts">
	import type { CheckIn } from '$lib/db/index';
	import CheckInCard from './CheckInCard.svelte';

	interface Props {
		checkIns: CheckIn[];
		reportsHref?: string;
	}

	let { checkIns = [], reportsHref = '/app/reports' }: Props = $props();

	let hasCheckIns = $derived(checkIns.length > 0);
</script>

<section class="check-in-history" aria-labelledby="check-in-history-heading">
	<header class="section-header">
		<h2 id="check-in-history-heading">Recent Check-Ins</h2>
		{#if hasCheckIns}
			<a href={reportsHref} class="view-all-link">
				View All
				<span class="arrow" aria-hidden="true">&rarr;</span>
			</a>
		{/if}
	</header>

	{#if hasCheckIns}
		<div class="check-ins-list" role="list">
			{#each checkIns as checkIn (checkIn.id)}
				<div role="listitem">
					<CheckInCard {checkIn} />
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state" role="status">
			<div class="empty-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
					<line x1="16" y1="2" x2="16" y2="6" />
					<line x1="8" y1="2" x2="8" y2="6" />
					<line x1="3" y1="10" x2="21" y2="10" />
					<path d="M9 16l2 2 4-4" />
				</svg>
			</div>
			<p class="empty-message">Your check-in history will appear here</p>
			<p class="empty-hint">Complete your first check-in to start tracking your well-being</p>
		</div>
	{/if}
</section>

<style>
	.check-in-history {
		padding: var(--space-4);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-4);
		max-width: 500px;
		margin-left: auto;
		margin-right: auto;
	}

	.section-header h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.view-all-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-primary);
		text-decoration: none;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-md);
		transition: background-color 0.2s ease;
	}

	.view-all-link:hover {
		background-color: var(--color-gray-100);
	}

	.view-all-link:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.arrow {
		font-size: var(--font-size-base);
	}

	/* Check-ins list - vertical scroll */
	.check-ins-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-width: 500px;
		margin: 0 auto;
		max-height: 400px;
		overflow-y: auto;
		padding-right: var(--space-2);
	}

	/* Scrollbar styling */
	.check-ins-list::-webkit-scrollbar {
		width: 6px;
	}

	.check-ins-list::-webkit-scrollbar-track {
		background: var(--color-gray-100);
		border-radius: 3px;
	}

	.check-ins-list::-webkit-scrollbar-thumb {
		background: var(--color-gray-300);
		border-radius: 3px;
	}

	.check-ins-list::-webkit-scrollbar-thumb:hover {
		background: var(--color-gray-400);
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--space-8) var(--space-4);
		max-width: 300px;
		margin: 0 auto;
	}

	.empty-icon {
		width: 64px;
		height: 64px;
		color: var(--color-gray-300);
		margin-bottom: var(--space-4);
	}

	.empty-icon svg {
		width: 100%;
		height: 100%;
	}

	.empty-message {
		font-size: var(--font-size-base);
		color: var(--color-text-muted);
		font-weight: 500;
		margin: 0 0 var(--space-2);
	}

	.empty-hint {
		font-size: var(--font-size-sm);
		color: var(--color-gray-400);
		margin: 0;
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.view-all-link {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.view-all-link:focus-visible {
			outline: 3px solid CanvasText;
		}
	}
</style>
