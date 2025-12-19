<script lang="ts">
	import type { CheckIn } from '$lib/db/index';
	import type { CalendarDay as CalendarDayType } from '$lib/utils/calendar';
	import {
		generateCalendarGrid,
		formatMonthYear,
		isMonthInFuture,
		getDateKey,
		getCheckInsByDate,
		WEEKDAY_LABELS
	} from '$lib/utils/calendar';
	import { formatRelativeDate, getZoneInfo } from '$lib/db/checkIns';
	import CalendarDay from './CalendarDay.svelte';

	interface Props {
		checkIns: CheckIn[];
	}

	let { checkIns = [] }: Props = $props();

	// Current displayed month/year
	const today = new Date();
	let currentYear = $state(today.getFullYear());
	let currentMonth = $state(today.getMonth());

	// Selected day for details
	let selectedDay: CalendarDayType | null = $state(null);
	let selectedCheckIns: CheckIn[] = $state([]);

	// Derived values
	let calendarGrid = $derived(generateCalendarGrid(currentYear, currentMonth));
	let monthYearLabel = $derived(formatMonthYear(currentYear, currentMonth));
	let checkInsByDate = $derived(getCheckInsByDate(checkIns));
	let canNavigateForward = $derived(!isMonthInFuture(currentYear, currentMonth));

	/**
	 * Navigate to previous month.
	 */
	function goToPreviousMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear--;
		} else {
			currentMonth--;
		}
		clearSelection();
	}

	/**
	 * Navigate to next month.
	 */
	function goToNextMonth() {
		if (isMonthInFuture(currentYear, currentMonth)) {
			return;
		}

		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear++;
		} else {
			currentMonth++;
		}
		clearSelection();
	}

	/**
	 * Clear the current selection.
	 */
	function clearSelection() {
		selectedDay = null;
		selectedCheckIns = [];
	}

	/**
	 * Handle day selection.
	 */
	function handleDaySelect(day: CalendarDayType, dayCheckIns: CheckIn[]) {
		if (selectedDay && getDateKey(selectedDay.date) === getDateKey(day.date)) {
			// Toggle off if same day is clicked again
			clearSelection();
		} else {
			selectedDay = day;
			selectedCheckIns = dayCheckIns;
		}
	}

	/**
	 * Get check-ins for a specific day.
	 */
	function getCheckInsForDay(day: CalendarDayType): CheckIn[] {
		const dateKey = getDateKey(day.date);
		return checkInsByDate.get(dateKey) || [];
	}

	/**
	 * Format time for display.
	 */
	function formatTime(date: Date): string {
		return new Date(date).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
</script>

<section class="calendar-view" aria-labelledby="calendar-heading">
	<header class="calendar-header">
		<h2 id="calendar-heading" class="visually-hidden">Check-In Calendar</h2>

		<button
			type="button"
			class="nav-button"
			onclick={goToPreviousMonth}
			aria-label="Go to previous month"
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		</button>

		<span class="month-year-label" aria-live="polite">{monthYearLabel}</span>

		<button
			type="button"
			class="nav-button"
			onclick={goToNextMonth}
			disabled={!canNavigateForward}
			aria-label="Go to next month"
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		</button>
	</header>

	<div class="calendar-grid" role="grid" aria-label="Calendar">
		<!-- Weekday headers -->
		<div class="weekday-row" role="row">
			{#each WEEKDAY_LABELS as dayLabel (dayLabel)}
				<div class="weekday-header" role="columnheader">
					<span aria-hidden="true">{dayLabel}</span>
					<span class="visually-hidden"
						>{dayLabel === 'Sun'
							? 'Sunday'
							: dayLabel === 'Mon'
								? 'Monday'
								: dayLabel === 'Tue'
									? 'Tuesday'
									: dayLabel === 'Wed'
										? 'Wednesday'
										: dayLabel === 'Thu'
											? 'Thursday'
											: dayLabel === 'Fri'
												? 'Friday'
												: 'Saturday'}</span
					>
				</div>
			{/each}
		</div>

		<!-- Calendar weeks -->
		{#each calendarGrid as week, idx (idx)}
			<div class="week-row" role="row">
				{#each week as day (getDateKey(day.date))}
					<CalendarDay {day} checkIns={getCheckInsForDay(day)} onSelect={handleDaySelect} />
				{/each}
			</div>
		{/each}
	</div>

	<!-- Selected day details -->
	{#if selectedDay && selectedCheckIns.length > 0}
		<div class="day-details" role="region" aria-label="Check-in details for selected day">
			<header class="details-header">
				<h3 class="details-title">
					{formatRelativeDate(selectedDay.date)}
				</h3>
				<button
					type="button"
					class="close-button"
					onclick={clearSelection}
					aria-label="Close details"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</header>

			<ul class="check-in-list">
				{#each selectedCheckIns as checkIn (checkIn.id)}
					{@const zoneInfo = getZoneInfo(checkIn.zone)}
					<li class="check-in-item {zoneInfo.cssClass}">
						<span class="check-in-zone-dot" aria-hidden="true"></span>
						<div class="check-in-info">
							<span class="check-in-time">{formatTime(checkIn.createdAt)}</span>
							<span class="check-in-zone-label">{zoneInfo.label}</span>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Legend -->
	<div class="calendar-legend" aria-label="Legend">
		<span class="legend-item">
			<span class="legend-dot zone-green" aria-hidden="true"></span>
			<span>Feeling good</span>
		</span>
		<span class="legend-item">
			<span class="legend-dot zone-yellow" aria-hidden="true"></span>
			<span>Needed support</span>
		</span>
		<span class="legend-item">
			<span class="legend-dot zone-red" aria-hidden="true"></span>
			<span>Reached out</span>
		</span>
	</div>
</section>

<style>
	.calendar-view {
		padding: var(--space-4);
		max-width: 500px;
		margin: 0 auto;
	}

	/* Header with navigation */
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-4);
	}

	.month-year-label {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
	}

	.nav-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		background-color: var(--color-white);
		color: var(--color-text);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}

	.nav-button:hover:not(:disabled) {
		background-color: var(--color-gray-100);
		border-color: var(--color-gray-300);
	}

	.nav-button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.nav-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.nav-button svg {
		width: 20px;
		height: 20px;
	}

	/* Calendar grid */
	.calendar-grid {
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.weekday-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		background-color: var(--color-gray-50);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.weekday-header {
		padding: var(--space-2);
		text-align: center;
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.week-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}

	.week-row:not(:last-child) {
		border-bottom: 1px solid var(--color-gray-100);
	}

	/* Day details panel */
	.day-details {
		margin-top: var(--space-4);
		padding: var(--space-3);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
	}

	.details-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
	}

	.details-title {
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border: none;
		border-radius: var(--radius-md);
		background-color: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	.close-button:hover {
		background-color: var(--color-gray-100);
		color: var(--color-text);
	}

	.close-button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.close-button svg {
		width: 16px;
		height: 16px;
	}

	.check-in-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.check-in-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-3);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
	}

	.check-in-zone-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
		background-color: var(--color-gray-300);
	}

	.zone-green .check-in-zone-dot {
		background-color: #22c55e;
	}

	.zone-yellow .check-in-zone-dot {
		background-color: #eab308;
	}

	.zone-red .check-in-zone-dot {
		background-color: #ef4444;
	}

	.check-in-info {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.check-in-time {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.check-in-zone-label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text);
	}

	/* Legend */
	.calendar-legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-3);
		margin-top: var(--space-4);
		padding: var(--space-3);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.legend-dot.zone-green {
		background-color: #22c55e;
	}

	.legend-dot.zone-yellow {
		background-color: #eab308;
	}

	.legend-dot.zone-red {
		background-color: #ef4444;
	}

	/* Visually hidden (for screen readers only) */
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.nav-button,
		.close-button {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.nav-button:focus-visible,
		.close-button:focus-visible {
			outline: 3px solid CanvasText;
		}

		.legend-dot {
			border: 2px solid currentColor;
		}
	}

	/* Touch targets */
	@media (pointer: coarse) {
		.nav-button {
			width: 44px;
			height: 44px;
		}

		.close-button {
			width: 44px;
			height: 44px;
		}
	}

	/* Responsive: smaller screens */
	@media (max-width: 360px) {
		.calendar-view {
			padding: var(--space-2);
		}

		.calendar-legend {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
