<script lang="ts">
	/**
	 * Zone colors following the well-being zones concept:
	 * - green: Feeling good, using coping skills proactively
	 * - yellow: Feeling stressed, need extra support
	 * - red: In crisis, need immediate help
	 */
	export type Zone = 'green' | 'yellow' | 'red' | null;

	interface Props {
		lastCheckIn?: Date | null;
		streak?: number;
		currentZone?: Zone;
	}

	let { lastCheckIn = null, streak = 0, currentZone = null }: Props = $props();

	/**
	 * Format the last check-in time in a human-friendly way.
	 */
	function formatLastCheckIn(date: Date | null): string {
		if (!date) return 'No check-ins yet';

		const now = new Date();
		const checkInDate = new Date(date);

		// Reset times to start of day for comparison
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const checkInDay = new Date(
			checkInDate.getFullYear(),
			checkInDate.getMonth(),
			checkInDate.getDate()
		);

		const daysDiff = Math.floor((today.getTime() - checkInDay.getTime()) / (1000 * 60 * 60 * 24));

		if (daysDiff === 0) return 'Today';
		if (daysDiff === 1) return 'Yesterday';
		if (daysDiff < 7) return `${daysDiff} days ago`;
		if (daysDiff < 14) return '1 week ago';
		return `${Math.floor(daysDiff / 7)} weeks ago`;
	}

	/**
	 * Get the display text for streak.
	 */
	function formatStreak(count: number): string {
		if (count === 0) return 'Start your streak!';
		if (count === 1) return '1 day streak';
		return `${count} day streak`;
	}

	/**
	 * Get zone display info.
	 */
	function getZoneInfo(zone: Zone): { label: string; cssClass: string; description: string } {
		switch (zone) {
			case 'green':
				return {
					label: 'Green zone',
					cssClass: 'zone-green',
					description: 'Feeling good'
				};
			case 'yellow':
				return {
					label: 'Yellow zone',
					cssClass: 'zone-yellow',
					description: 'Need support'
				};
			case 'red':
				return {
					label: 'Red zone',
					cssClass: 'zone-red',
					description: 'Need help now'
				};
			default:
				return {
					label: 'No zone',
					cssClass: 'zone-none',
					description: 'Check in to set'
				};
		}
	}

	let lastCheckInText = $derived(formatLastCheckIn(lastCheckIn));
	let streakText = $derived(formatStreak(streak));
	let zoneInfo = $derived(getZoneInfo(currentZone));
</script>

<section class="quick-stats" aria-label="Check-in statistics">
	<div class="stats-grid">
		<div class="stat-card">
			<span class="stat-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
					<line x1="16" y1="2" x2="16" y2="6" />
					<line x1="8" y1="2" x2="8" y2="6" />
					<line x1="3" y1="10" x2="21" y2="10" />
				</svg>
			</span>
			<span class="stat-label">Last check-in</span>
			<span class="stat-value">{lastCheckInText}</span>
		</div>

		<div class="stat-card">
			<span class="stat-icon streak-icon" aria-hidden="true" class:has-streak={streak > 0}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path
						d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
					/>
					<path d="M12 6v6l4 2" stroke-linecap="round" />
				</svg>
			</span>
			<span class="stat-label">Streak</span>
			<span class="stat-value" class:streak-active={streak > 0}>{streakText}</span>
		</div>

		<div class="stat-card">
			<span class="stat-icon zone-indicator {zoneInfo.cssClass}" aria-hidden="true">
				<span class="zone-dot"></span>
			</span>
			<span class="stat-label">{zoneInfo.label}</span>
			<span class="stat-value">{zoneInfo.description}</span>
		</div>
	</div>
</section>

<style>
	.quick-stats {
		padding: var(--space-4);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
		max-width: 500px;
		margin: 0 auto;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-4) var(--space-2);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		text-align: center;
	}

	.stat-icon {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-gray-400);
	}

	.stat-icon svg {
		width: 100%;
		height: 100%;
	}

	.stat-icon.has-streak {
		color: var(--color-accent);
	}

	.stat-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: var(--font-size-sm);
		color: var(--color-gray-700);
		font-weight: 600;
	}

	.stat-value.streak-active {
		color: var(--color-primary);
	}

	/* Zone indicator styles */
	.zone-indicator {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-gray-100);
	}

	.zone-dot {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background-color: var(--color-gray-300);
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

	.zone-green {
		background-color: #dcfce7;
	}

	.zone-yellow {
		background-color: #fef9c3;
	}

	.zone-red {
		background-color: #fee2e2;
	}

	/* Mobile adjustments */
	@media (max-width: 400px) {
		.stats-grid {
			grid-template-columns: 1fr;
			max-width: 280px;
		}

		.stat-card {
			flex-direction: row;
			justify-content: flex-start;
			gap: var(--space-3);
			padding: var(--space-3);
		}

		.stat-icon {
			width: 28px;
			height: 28px;
			flex-shrink: 0;
		}

		.stat-label {
			display: none;
		}

		.stat-value {
			flex: 1;
			text-align: left;
		}
	}

	/* Desktop adjustments */
	@media (min-width: 480px) {
		.stat-card {
			padding: var(--space-5) var(--space-3);
		}

		.stat-icon {
			width: 36px;
			height: 36px;
		}

		.stat-value {
			font-size: var(--font-size-base);
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.zone-dot {
			border: 2px solid currentColor;
		}
	}
</style>
