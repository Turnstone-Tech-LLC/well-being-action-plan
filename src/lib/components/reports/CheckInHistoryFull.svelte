<script lang="ts">
	/**
	 * CheckInHistoryFull component for displaying full check-in history with expandable details.
	 * Shows all check-ins with filtering applied, sorted newest first.
	 */
	import { SvelteSet } from 'svelte/reactivity';
	import type { CheckIn, PlanPayload } from '$lib/db/index';
	import CheckInDetailExpanded from './CheckInDetailExpanded.svelte';

	interface Props {
		checkIns: CheckIn[];
		planPayload: PlanPayload | null;
	}

	let { checkIns, planPayload }: Props = $props();

	// Track which check-ins are expanded using SvelteSet for reactivity
	let expandedIds = new SvelteSet<number>();

	function toggleExpanded(id: number | undefined) {
		if (id === undefined) return;

		if (expandedIds.has(id)) {
			expandedIds.delete(id);
		} else {
			expandedIds.add(id);
		}
	}

	function isExpanded(id: number | undefined): boolean {
		if (id === undefined) return false;
		return expandedIds.has(id);
	}

	// Collapse all expanded items
	function collapseAll() {
		expandedIds.clear();
	}

	// Expand all items
	function expandAll() {
		for (const checkIn of checkIns) {
			if (checkIn.id !== undefined) {
				expandedIds.add(checkIn.id);
			}
		}
	}

	let hasMultipleItems = $derived(checkIns.length > 1);
	let hasExpandedItems = $derived(expandedIds.size > 0);
</script>

<section class="check-in-history-full" aria-label="Check-in history">
	{#if hasMultipleItems}
		<div class="history-controls">
			<span class="history-count">{checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}</span
			>
			<div class="expand-controls">
				<button
					type="button"
					class="expand-control-btn"
					onclick={expandAll}
					aria-label="Expand all check-ins"
				>
					Expand all
				</button>
				<span class="control-separator" aria-hidden="true">|</span>
				<button
					type="button"
					class="expand-control-btn"
					onclick={collapseAll}
					disabled={!hasExpandedItems}
					aria-label="Collapse all check-ins"
				>
					Collapse all
				</button>
			</div>
		</div>
	{/if}

	<div class="history-list" role="list">
		{#each checkIns as checkIn (checkIn.id)}
			<div role="listitem">
				<CheckInDetailExpanded
					{checkIn}
					{planPayload}
					isExpanded={isExpanded(checkIn.id)}
					onToggle={() => toggleExpanded(checkIn.id)}
				/>
			</div>
		{/each}
	</div>
</section>

<style>
	.check-in-history-full {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.history-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.history-count {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.expand-controls {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.expand-control-btn {
		padding: var(--space-1) var(--space-2);
		background: none;
		border: none;
		font-size: var(--font-size-sm);
		color: var(--color-primary);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: background-color 0.2s ease;
	}

	.expand-control-btn:hover:not(:disabled) {
		background-color: var(--color-gray-100);
	}

	.expand-control-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.expand-control-btn:disabled {
		color: var(--color-gray-400);
		cursor: not-allowed;
	}

	.control-separator {
		color: var(--color-gray-300);
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.expand-control-btn {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.expand-control-btn:focus-visible {
			outline: 3px solid CanvasText;
		}
	}
</style>
