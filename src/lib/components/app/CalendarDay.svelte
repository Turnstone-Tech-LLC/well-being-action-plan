<script lang="ts">
	import type { CheckIn, CheckInZone } from '$lib/db/index';
	import type { CalendarDay } from '$lib/utils/calendar';
	import { getDominantZone } from '$lib/utils/calendar';

	interface Props {
		day: CalendarDay;
		checkIns?: CheckIn[];
		onSelect?: (day: CalendarDay, checkIns: CheckIn[]) => void;
	}

	let { day, checkIns = [], onSelect }: Props = $props();

	let hasCheckIns = $derived(checkIns.length > 0);
	let dominantZone = $derived(hasCheckIns ? getDominantZone(checkIns) : null);
	let isInteractive = $derived(hasCheckIns && !day.isFuture);

	function handleClick() {
		if (onSelect) {
			onSelect(day, checkIns);
		}
	}

	function getZoneClass(zone: CheckInZone | null): string {
		if (!zone) return '';
		return `zone-${zone}`;
	}

	function getAriaLabel(): string {
		const dateStr = day.date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});

		if (day.isToday) {
			if (hasCheckIns) {
				return `Today, ${dateStr}, ${checkIns.length} check-in${checkIns.length > 1 ? 's' : ''}, ${dominantZone} zone`;
			}
			return `Today, ${dateStr}, no check-ins`;
		}

		if (day.isFuture) {
			return `${dateStr}, future date`;
		}

		if (hasCheckIns) {
			return `${dateStr}, ${checkIns.length} check-in${checkIns.length > 1 ? 's' : ''}, ${dominantZone} zone`;
		}

		return `${dateStr}, no check-ins`;
	}
</script>

{#if isInteractive}
	<!-- Interactive day with check-ins - rendered as button -->
	<button
		type="button"
		class="calendar-day is-interactive has-check-ins"
		class:is-today={day.isToday}
		class:is-other-month={!day.isCurrentMonth}
		aria-label={getAriaLabel()}
		onclick={handleClick}
	>
		<span class="day-number">{day.dayNumber}</span>
		<span class="zone-dot {getZoneClass(dominantZone)}" aria-hidden="true"></span>
	</button>
{:else}
	<!-- Non-interactive day - rendered as grid cell -->
	<div
		class="calendar-day"
		class:is-today={day.isToday}
		class:is-future={day.isFuture}
		class:is-other-month={!day.isCurrentMonth}
		role="gridcell"
		aria-label={getAriaLabel()}
		aria-disabled={day.isFuture || undefined}
	>
		<span class="day-number">{day.dayNumber}</span>
	</div>
{/if}

<style>
	.calendar-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		min-height: 44px;
		padding: var(--space-1);
		border-radius: var(--radius-md);
		transition: background-color 0.15s ease;
		position: relative;
		/* Reset button styles */
		border: none;
		background-color: transparent;
		font-family: inherit;
	}

	.day-number {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text);
		line-height: 1;
	}

	/* Today highlight */
	.is-today {
		background-color: var(--color-primary);
		color: white;
	}

	.is-today .day-number {
		color: white;
		font-weight: 600;
	}

	/* Other month days (grayed out) */
	.is-other-month .day-number {
		color: var(--color-gray-300);
	}

	/* Future days */
	.is-future .day-number {
		color: var(--color-gray-300);
	}

	.is-future.is-today {
		background-color: var(--color-gray-200);
	}

	.is-future.is-today .day-number {
		color: var(--color-gray-500);
	}

	/* Interactive states */
	.is-interactive {
		cursor: pointer;
	}

	.is-interactive:hover {
		background-color: var(--color-gray-100);
	}

	.is-interactive.is-today:hover {
		background-color: var(--color-primary-hover, #004a3f);
	}

	.is-interactive:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	/* Zone indicator dot */
	.zone-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--color-gray-300);
		flex-shrink: 0;
	}

	.zone-dot.zone-green {
		background-color: #22c55e;
	}

	.zone-dot.zone-yellow {
		background-color: #eab308;
	}

	.zone-dot.zone-red {
		background-color: #ef4444;
	}

	/* Ensure dot is visible on today */
	.is-today .zone-dot {
		box-shadow: 0 0 0 2px white;
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.calendar-day {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.is-today {
			outline: 2px solid currentColor;
		}

		.zone-dot {
			border: 2px solid currentColor;
		}

		.is-interactive:focus-visible {
			outline: 3px solid CanvasText;
		}
	}

	/* Touch targets */
	@media (pointer: coarse) {
		.calendar-day {
			min-height: 48px;
		}
	}
</style>
