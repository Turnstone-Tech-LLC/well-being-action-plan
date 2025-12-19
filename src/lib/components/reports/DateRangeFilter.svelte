<script lang="ts">
	/**
	 * DateRangeFilter component for filtering check-ins by date range.
	 * Provides quick filters and custom date range picker.
	 */

	export type QuickFilter = 'last7' | 'last30' | 'all' | 'custom';

	interface Props {
		startDate: Date | null;
		endDate: Date | null;
		activeQuickFilter: QuickFilter;
		onFilterChange: (filter: QuickFilter, start: Date | null, end: Date | null) => void;
	}

	let { startDate, endDate, activeQuickFilter, onFilterChange }: Props = $props();

	// Format date for input type="date"
	function formatDateForInput(date: Date | null): string {
		if (!date) return '';
		return date.toISOString().split('T')[0];
	}

	// Parse date from input type="date"
	function parseDateFromInput(value: string): Date | null {
		if (!value) return null;
		const date = new Date(value + 'T00:00:00');
		return isNaN(date.getTime()) ? null : date;
	}

	function createEndOfToday(): Date {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
	}

	function createStartOfDaysAgo(daysAgo: number): Date {
		const now = new Date();
		// Calculate start date by going back from today's start of day
		const startDate = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate() - daysAgo,
			0,
			0,
			0,
			0
		);
		return startDate;
	}

	function handleQuickFilter(filter: QuickFilter) {
		switch (filter) {
			case 'last7': {
				onFilterChange('last7', createStartOfDaysAgo(6), createEndOfToday());
				break;
			}
			case 'last30': {
				onFilterChange('last30', createStartOfDaysAgo(29), createEndOfToday());
				break;
			}
			case 'all': {
				onFilterChange('all', null, null);
				break;
			}
			case 'custom': {
				// Keep current dates, just switch to custom mode
				onFilterChange('custom', startDate, endDate);
				break;
			}
		}
	}

	function handleStartDateChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const newStart = parseDateFromInput(input.value);
		if (newStart) {
			newStart.setHours(0, 0, 0, 0);
		}
		onFilterChange('custom', newStart, endDate);
	}

	function handleEndDateChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const newEnd = parseDateFromInput(input.value);
		if (newEnd) {
			newEnd.setHours(23, 59, 59, 999);
		}
		onFilterChange('custom', startDate, newEnd);
	}

	let showCustomPicker = $derived(activeQuickFilter === 'custom');
</script>

<div class="date-range-filter" role="group" aria-label="Date range filter">
	<div class="quick-filters">
		<button
			type="button"
			class="filter-pill"
			class:active={activeQuickFilter === 'last7'}
			onclick={() => handleQuickFilter('last7')}
			aria-pressed={activeQuickFilter === 'last7'}
		>
			Last 7 days
		</button>
		<button
			type="button"
			class="filter-pill"
			class:active={activeQuickFilter === 'last30'}
			onclick={() => handleQuickFilter('last30')}
			aria-pressed={activeQuickFilter === 'last30'}
		>
			Last 30 days
		</button>
		<button
			type="button"
			class="filter-pill"
			class:active={activeQuickFilter === 'all'}
			onclick={() => handleQuickFilter('all')}
			aria-pressed={activeQuickFilter === 'all'}
		>
			All time
		</button>
		<button
			type="button"
			class="filter-pill"
			class:active={activeQuickFilter === 'custom'}
			onclick={() => handleQuickFilter('custom')}
			aria-pressed={activeQuickFilter === 'custom'}
			aria-expanded={showCustomPicker}
		>
			Custom
		</button>
	</div>

	{#if showCustomPicker}
		<div class="custom-picker" role="group" aria-label="Custom date range">
			<div class="date-field">
				<label for="start-date">From</label>
				<input
					type="date"
					id="start-date"
					value={formatDateForInput(startDate)}
					max={formatDateForInput(endDate) || formatDateForInput(createEndOfToday())}
					onchange={handleStartDateChange}
				/>
			</div>
			<span class="date-separator" aria-hidden="true">—</span>
			<div class="date-field">
				<label for="end-date">To</label>
				<input
					type="date"
					id="end-date"
					value={formatDateForInput(endDate)}
					min={formatDateForInput(startDate) || undefined}
					max={formatDateForInput(createEndOfToday())}
					onchange={handleEndDateChange}
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.date-range-filter {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.quick-filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.filter-pill {
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
			border-color 0.2s ease,
			color 0.2s ease;
		min-height: 44px;
	}

	.filter-pill:hover:not(.active) {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.filter-pill:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.filter-pill.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-white);
	}

	.custom-picker {
		display: flex;
		align-items: flex-end;
		gap: var(--space-3);
		flex-wrap: wrap;
		padding: var(--space-4);
		background-color: var(--color-bg-subtle);
		border-radius: var(--radius-lg);
	}

	.date-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 130px;
	}

	.date-field label {
		font-size: var(--font-size-xs);
		font-weight: 500;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.date-field input {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		background-color: var(--color-white);
		font-size: var(--font-size-sm);
		min-height: 44px;
		color: var(--color-text);
	}

	.date-field input:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
		border-color: var(--color-primary);
	}

	.date-separator {
		color: var(--color-gray-400);
		padding-bottom: var(--space-3);
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.filter-pill {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.filter-pill.active {
			border: 3px solid CanvasText;
		}

		.filter-pill:focus-visible {
			outline: 3px solid CanvasText;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 400px) {
		.quick-filters {
			justify-content: stretch;
		}

		.filter-pill {
			flex: 1;
			text-align: center;
		}

		.custom-picker {
			flex-direction: column;
		}

		.date-separator {
			display: none;
		}
	}
</style>
