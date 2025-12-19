<script lang="ts">
	import { onMount } from 'svelte';
	import { planPayload, localPlan } from '$lib/stores/localPlan';
	import type { CheckIn, PlanPayload } from '$lib/db/index';
	import { getRecentCheckIns, getCheckInsByDateRange } from '$lib/db/checkIns';
	import {
		DateRangeFilter,
		ZoneFilter,
		SummaryStats,
		CheckInHistoryFull,
		EmptyState,
		type QuickFilter,
		type ZoneFilterValue
	} from '$lib/components/reports';

	// Reactive values from stores
	let payload = $derived($planPayload);
	let plan = $derived($localPlan);

	// Filter state
	let activeQuickFilter: QuickFilter = $state('all');
	let startDate: Date | null = $state(null);
	let endDate: Date | null = $state(null);
	let activeZone: ZoneFilterValue = $state('all');

	// Check-in data
	let allCheckIns: CheckIn[] = $state([]);
	let filteredCheckIns: CheckIn[] = $state([]);
	let loading: boolean = $state(true);

	// Summary statistics
	interface TopStrategy {
		id: string;
		title: string;
		count: number;
	}

	interface Summary {
		total: number;
		byZone: { green: number; yellow: number; red: number };
		topStrategies: TopStrategy[];
		streak: number;
	}

	let summary: Summary = $state({
		total: 0,
		byZone: { green: 0, yellow: 0, red: 0 },
		topStrategies: [],
		streak: 0
	});

	/**
	 * Calculate check-in streak.
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

		// Get unique days with check-ins
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
				break;
			}

			currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
		}

		return streakCount;
	}

	/**
	 * Calculate summary statistics from check-ins.
	 */
	function calculateSummary(checkIns: CheckIn[], planPayload: PlanPayload | null): Summary {
		const byZone = { green: 0, yellow: 0, red: 0 };
		const strategyCounts: Record<string, number> = {};

		for (const checkIn of checkIns) {
			// Count by zone
			byZone[checkIn.zone]++;

			// Count strategies used
			for (const strategyId of checkIn.strategiesUsed) {
				strategyCounts[strategyId] = (strategyCounts[strategyId] || 0) + 1;
			}
		}

		// Build top strategies list
		const topStrategies: TopStrategy[] = Object.entries(strategyCounts)
			.map(([id, count]) => {
				const skill = planPayload?.skills.find((s) => s.id === id);
				return {
					id,
					title: skill?.title || 'Unknown skill',
					count
				};
			})
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		return {
			total: checkIns.length,
			byZone,
			topStrategies,
			streak: calculateStreak(checkIns)
		};
	}

	/**
	 * Apply zone filter to check-ins.
	 */
	function applyZoneFilter(checkIns: CheckIn[], zone: ZoneFilterValue): CheckIn[] {
		if (zone === 'all') {
			return checkIns;
		}
		return checkIns.filter((c) => c.zone === zone);
	}

	/**
	 * Load check-ins from IndexedDB.
	 */
	async function loadCheckIns() {
		if (!plan?.actionPlanId) return;

		loading = true;

		try {
			let checkIns: CheckIn[];

			if (startDate && endDate) {
				checkIns = await getCheckInsByDateRange(plan.actionPlanId, startDate, endDate);
			} else {
				// Get all check-ins (up to a large limit)
				checkIns = await getRecentCheckIns(plan.actionPlanId, 10000);
			}

			allCheckIns = checkIns;
			filteredCheckIns = applyZoneFilter(checkIns, activeZone);
			summary = calculateSummary(filteredCheckIns, payload);
		} finally {
			loading = false;
		}
	}

	/**
	 * Handle date range filter changes.
	 */
	function handleDateFilterChange(filter: QuickFilter, start: Date | null, end: Date | null): void {
		activeQuickFilter = filter;
		startDate = start;
		endDate = end;
		loadCheckIns();
	}

	/**
	 * Handle zone filter changes.
	 */
	function handleZoneChange(zone: ZoneFilterValue): void {
		activeZone = zone;
		filteredCheckIns = applyZoneFilter(allCheckIns, zone);
		summary = calculateSummary(filteredCheckIns, payload);
	}

	/**
	 * Clear all filters and reload.
	 */
	function clearFilters(): void {
		activeQuickFilter = 'all';
		startDate = null;
		endDate = null;
		activeZone = 'all';
		loadCheckIns();
	}

	// Derived values for summary counts by zone (before zone filter)
	let zoneCounts = $derived({
		all: allCheckIns.length,
		green: allCheckIns.filter((c) => c.zone === 'green').length,
		yellow: allCheckIns.filter((c) => c.zone === 'yellow').length,
		red: allCheckIns.filter((c) => c.zone === 'red').length
	});

	let hasFiltersApplied = $derived(
		activeQuickFilter !== 'all' || activeZone !== 'all' || startDate !== null || endDate !== null
	);

	let hasCheckIns = $derived(filteredCheckIns.length > 0);
	let hasAnyCheckIns = $derived(allCheckIns.length > 0);

	onMount(() => {
		loadCheckIns();
	});
</script>

<svelte:head>
	<title>My Reports | Well-Being Action Plan</title>
	<meta name="description" content="View your check-in history and well-being reports" />
</svelte:head>

<div class="reports-page">
	<header class="page-header">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href="/app" class="breadcrumb-link">Dashboard</a>
			<span class="breadcrumb-separator" aria-hidden="true">/</span>
			<span class="breadcrumb-current" aria-current="page">Reports</span>
		</nav>
		<h1>My Reports</h1>
		<p class="subtitle">Track your well-being journey</p>
	</header>

	{#if loading}
		<div class="loading-state" role="status" aria-label="Loading check-ins">
			<div class="loading-spinner" aria-hidden="true"></div>
			<span class="loading-text">Loading your check-ins...</span>
		</div>
	{:else}
		<!-- Filters Section -->
		<section class="filters-section" aria-label="Filters">
			<div class="filter-group">
				<h2 class="filter-heading">Date Range</h2>
				<DateRangeFilter
					{startDate}
					{endDate}
					{activeQuickFilter}
					onFilterChange={handleDateFilterChange}
				/>
			</div>

			{#if hasAnyCheckIns}
				<div class="filter-group">
					<h2 class="filter-heading">Zone</h2>
					<ZoneFilter {activeZone} onZoneChange={handleZoneChange} counts={zoneCounts} />
				</div>
			{/if}
		</section>

		{#if hasCheckIns}
			<!-- Summary Stats -->
			<section class="summary-section" aria-label="Summary statistics">
				<SummaryStats
					total={summary.total}
					byZone={summary.byZone}
					topStrategies={summary.topStrategies}
					streak={summary.streak}
				/>
			</section>

			<!-- Check-in History -->
			<section class="history-section" aria-labelledby="history-heading">
				<h2 id="history-heading">Check-In History</h2>
				<CheckInHistoryFull checkIns={filteredCheckIns} planPayload={payload} />
			</section>

			<!-- PDF Export placeholder -->
			<section class="export-section" aria-label="Export options">
				<button type="button" class="export-btn" disabled title="Coming soon">
					<span class="export-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="12" y1="18" x2="12" y2="12" />
							<line x1="9" y1="15" x2="12" y2="12" />
							<line x1="15" y1="15" x2="12" y2="12" />
						</svg>
					</span>
					Create PDF Report
					<span class="coming-soon-badge">Coming Soon</span>
				</button>
			</section>
		{:else}
			<!-- Empty State -->
			<EmptyState {hasFiltersApplied} onClearFilters={clearFilters} />
		{/if}
	{/if}
</div>

<style>
	.reports-page {
		padding: var(--space-6) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
	}

	/* Header */
	.page-header {
		margin-bottom: var(--space-8);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
		font-size: var(--font-size-sm);
	}

	.breadcrumb-link {
		color: var(--color-primary);
		text-decoration: none;
	}

	.breadcrumb-link:hover {
		text-decoration: underline;
	}

	.breadcrumb-link:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.breadcrumb-separator {
		color: var(--color-gray-400);
	}

	.breadcrumb-current {
		color: var(--color-text-muted);
	}

	.page-header h1 {
		font-size: var(--font-size-2xl);
		color: var(--color-gray-900);
		margin: 0 0 var(--space-2);
	}

	.subtitle {
		font-size: var(--font-size-base);
		color: var(--color-text-muted);
		margin: 0;
	}

	/* Loading State */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		padding: var(--space-16) var(--space-4);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--color-gray-200);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	/* Filters Section */
	.filters-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		margin-bottom: var(--space-8);
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.filter-heading {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	/* Summary Section */
	.summary-section {
		margin-bottom: var(--space-8);
	}

	/* History Section */
	.history-section {
		margin-bottom: var(--space-8);
	}

	.history-section h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 var(--space-4);
	}

	/* Export Section */
	.export-section {
		display: flex;
		justify-content: center;
		padding: var(--space-4);
		border-top: 1px solid var(--color-gray-200);
	}

	.export-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-6);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text);
		cursor: not-allowed;
		opacity: 0.6;
		min-height: 44px;
	}

	.export-icon {
		width: 18px;
		height: 18px;
	}

	.export-icon svg {
		width: 100%;
		height: 100%;
	}

	.coming-soon-badge {
		padding: var(--space-1) var(--space-2);
		background-color: var(--color-gray-100);
		border-radius: var(--radius-md);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner {
			animation: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.loading-spinner {
			border-color: CanvasText;
			border-top-color: transparent;
		}

		.breadcrumb-link:focus-visible {
			outline: 3px solid CanvasText;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.reports-page {
			padding: var(--space-4);
		}

		.page-header h1 {
			font-size: var(--font-size-xl);
		}
	}
</style>
