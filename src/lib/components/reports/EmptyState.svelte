<script lang="ts">
	/**
	 * EmptyState component for displaying when no check-ins match the current filters.
	 * Provides helpful suggestions and a call-to-action.
	 */

	interface Props {
		hasFiltersApplied: boolean;
		onClearFilters?: () => void;
	}

	let { hasFiltersApplied, onClearFilters }: Props = $props();
</script>

<div class="empty-state" role="status" aria-live="polite">
	<div class="empty-icon" aria-hidden="true">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
			<line x1="16" y1="2" x2="16" y2="6" />
			<line x1="8" y1="2" x2="8" y2="6" />
			<line x1="3" y1="10" x2="21" y2="10" />
			<path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
		</svg>
	</div>

	{#if hasFiltersApplied}
		<h3 class="empty-title">No check-ins found</h3>
		<p class="empty-message">
			No check-ins match your current filters. Try adjusting your date range or zone filter.
		</p>
		{#if onClearFilters}
			<button type="button" class="clear-filters-btn" onclick={onClearFilters}>
				Clear all filters
			</button>
		{/if}
	{:else}
		<h3 class="empty-title">No check-ins yet</h3>
		<p class="empty-message">
			Start tracking your well-being by completing your first check-in. Your history will appear
			here.
		</p>
		<a href="/app/checkin" class="checkin-link"> Start a check-in </a>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--space-12) var(--space-4);
		background-color: var(--color-bg-subtle);
		border: 1px dashed var(--color-gray-300);
		border-radius: var(--radius-lg);
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

	.empty-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-gray-700);
		margin: 0 0 var(--space-2);
	}

	.empty-message {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		line-height: 1.6;
		margin: 0 0 var(--space-6);
		max-width: 320px;
	}

	.clear-filters-btn {
		padding: var(--space-3) var(--space-6);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text);
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease;
		min-height: 44px;
	}

	.clear-filters-btn:hover {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.clear-filters-btn:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.checkin-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-3) var(--space-6);
		background-color: var(--color-primary);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-white);
		text-decoration: none;
		transition:
			background-color 0.2s ease,
			transform 0.1s ease;
		min-height: 44px;
	}

	.checkin-link:hover {
		background-color: var(--color-gray-800);
	}

	.checkin-link:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.checkin-link:active {
		transform: scale(0.98);
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.clear-filters-btn,
		.checkin-link {
			transition: none;
		}

		.checkin-link:active {
			transform: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.empty-state {
			border: 2px solid currentColor;
		}

		.clear-filters-btn:focus-visible,
		.checkin-link:focus-visible {
			outline: 3px solid CanvasText;
		}
	}
</style>
