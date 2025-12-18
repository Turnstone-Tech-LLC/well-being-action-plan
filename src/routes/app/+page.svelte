<script lang="ts">
	import { onMount } from 'svelte';
	import { planPayload, localPlan } from '$lib/stores/localPlan';
	import { displayName } from '$lib/stores/patientProfile';
	import { DashboardHeader, CheckInCTA, QuickStats, CheckInHistory } from '$lib/components/app';
	import type { Zone } from '$lib/components/app';
	import type { CheckIn } from '$lib/db/index';
	import { getRecentCheckIns, getLatestCheckIn } from '$lib/db/checkIns';

	// Reactive values from stores
	let payload = $derived($planPayload);
	let plan = $derived($localPlan);
	let name = $derived($displayName);

	// Check-in data from IndexedDB
	let recentCheckIns: CheckIn[] = $state([]);
	let lastCheckIn: Date | null = $state(null);
	let streak: number = $state(0);
	let currentZone: Zone = $state(null);

	// Determine if user is returning (has completed at least one check-in)
	let isReturningUser = $derived(recentCheckIns.length > 0);

	/**
	 * Calculate the current streak based on check-ins.
	 * A streak is maintained if there's a check-in today or yesterday.
	 */
	function calculateStreak(checkIns: CheckIn[]): number {
		if (checkIns.length === 0) return 0;

		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		let streakCount = 0;
		let currentDate = today;

		// Sort check-ins by date descending
		const sortedCheckIns = [...checkIns].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);

		// Get unique days with check-ins using a plain object
		const daysWithCheckIns: Record<string, boolean> = {};
		for (const checkIn of sortedCheckIns) {
			const checkInDate = new Date(checkIn.createdAt);
			const dayKey = `${checkInDate.getFullYear()}-${checkInDate.getMonth()}-${checkInDate.getDate()}`;
			daysWithCheckIns[dayKey] = true;
		}

		// Count consecutive days
		for (let i = 0; i < 365; i++) {
			const dayKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;

			if (daysWithCheckIns[dayKey]) {
				streakCount++;
			} else if (i > 0) {
				// Allow gap only for today (i === 0) - if no check-in today, check yesterday
				break;
			}

			// Move to previous day
			currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
		}

		return streakCount;
	}

	/**
	 * Load check-in data from IndexedDB.
	 */
	async function loadCheckIns() {
		if (!plan?.actionPlanId) return;

		const [checkIns, latestCheckIn] = await Promise.all([
			getRecentCheckIns(plan.actionPlanId, 7),
			getLatestCheckIn(plan.actionPlanId)
		]);

		recentCheckIns = checkIns;

		if (latestCheckIn) {
			lastCheckIn = new Date(latestCheckIn.createdAt);
			currentZone = latestCheckIn.zone;
			streak = calculateStreak(checkIns);
		}
	}

	onMount(() => {
		loadCheckIns();
	});
</script>

<svelte:head>
	<title>Dashboard | Well-Being Action Plan</title>
	<meta name="description" content="Your Well-Being Action Plan dashboard" />
</svelte:head>

<div class="dashboard-page">
	<DashboardHeader displayName={name} {isReturningUser} />

	<CheckInCTA />

	<QuickStats {lastCheckIn} {streak} {currentZone} />

	<CheckInHistory checkIns={recentCheckIns} />

	{#if payload}
		<section class="plan-summary" aria-labelledby="plan-summary-heading">
			<h2 id="plan-summary-heading" class="visually-hidden">Your plan summary</h2>
			<div class="summary-cards">
				<div class="summary-card">
					<span class="card-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 2L2 7l10 5 10-5-10-5z" />
							<path d="M2 17l10 5 10-5" />
							<path d="M2 12l10 5 10-5" />
						</svg>
					</span>
					<span class="card-value">{payload.skills.length}</span>
					<span class="card-label">Coping Skills</span>
				</div>
				<div class="summary-card">
					<span class="card-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
							<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						</svg>
					</span>
					<span class="card-value">{payload.supportiveAdults.length}</span>
					<span class="card-label">Supportive Adults</span>
				</div>
				<div class="summary-card">
					<span class="card-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10" />
							<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
					</span>
					<span class="card-value">{payload.helpMethods.length}</span>
					<span class="card-label">Help Methods</span>
				</div>
			</div>
		</section>
	{/if}

	<section class="offline-indicator" aria-live="polite">
		<p class="muted">
			<span class="offline-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
					<path d="M12 6v6l4 2" />
				</svg>
			</span>
			Your plan is stored on this device and works offline
		</p>
	</section>
</div>

<style>
	.dashboard-page {
		max-width: var(--max-width);
		margin: 0 auto;
	}

	/* Plan Summary Section */
	.plan-summary {
		padding: var(--space-4);
	}

	.summary-cards {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
		flex-wrap: wrap;
		max-width: 500px;
		margin: 0 auto;
	}

	.summary-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-4) var(--space-3);
		background-color: var(--color-bg-subtle);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		flex: 1;
		min-width: 100px;
		max-width: 150px;
	}

	.card-icon {
		width: 24px;
		height: 24px;
		color: var(--color-primary);
	}

	.card-icon svg {
		width: 100%;
		height: 100%;
	}

	.card-value {
		font-size: var(--font-size-2xl);
		font-weight: 600;
		color: var(--color-primary);
		line-height: 1;
	}

	.card-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-align: center;
	}

	/* Offline Indicator */
	.offline-indicator {
		padding: var(--space-6) var(--space-4);
		text-align: center;
	}

	.offline-indicator p {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.offline-icon {
		width: 16px;
		height: 16px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.offline-icon svg {
		width: 100%;
		height: 100%;
	}

	.muted {
		color: var(--color-text-muted);
	}

	/* Responsive adjustments */
	@media (max-width: 400px) {
		.summary-cards {
			flex-direction: column;
			align-items: center;
		}

		.summary-card {
			width: 100%;
			max-width: 280px;
			flex-direction: row;
			justify-content: flex-start;
			gap: var(--space-3);
		}

		.card-value {
			font-size: var(--font-size-xl);
		}

		.card-label {
			text-align: left;
		}
	}
</style>
