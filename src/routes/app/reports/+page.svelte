<script lang="ts">
	import { onMount } from 'svelte';
	import { planPayload, localPlan } from '$lib/stores/localPlan';
	import { patientProfile } from '$lib/stores/patientProfile';
	import type { CheckIn, PlanPayload } from '$lib/db/index';
	import { getRecentCheckIns, getCheckInsByDateRange } from '$lib/db/checkIns';
	import { saveLastProviderReportDate, getLastProviderReportDate } from '$lib/db/profile';
	import {
		DateRangeFilter,
		ZoneFilter,
		SummaryStats,
		CheckInHistoryFull,
		EmptyState,
		PdfExportModal,
		PatientTimeline,
		ProviderSummary,
		type QuickFilter,
		type ZoneFilterValue
	} from '$lib/components/reports';
	import AppointmentReminderModal from '$lib/components/reports/AppointmentReminderModal.svelte';
	import { generateEhrPdf, generateEhrFilename } from '$lib/reports/ehrPdfGenerator';
	import { downloadPdf } from '$lib/reports/pdfGenerator';

	// View tabs for Three-View Architecture
	type ViewTab = 'journey' | 'summary' | 'history';

	// Reactive values from stores
	let payload = $derived($planPayload);
	let plan = $derived($localPlan);
	let profile = $derived($patientProfile);

	// View state
	let activeView: ViewTab = $state('journey');

	// PDF export modal state
	let showExportModal: boolean = $state(false);
	let ehrExportLoading: boolean = $state(false);
	let showAppointmentModal: boolean = $state(false);

	// Track last report generation dates (stored in memory, loaded from profile)
	let lastProviderReportDate: Date | null = $state(null);

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

	/**
	 * Handle EHR PDF export.
	 */
	async function handleEhrExport(): Promise<void> {
		if (!profile || !payload || !plan) return;

		ehrExportLoading = true;
		try {
			const dateRange = {
				start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				end: endDate || new Date()
			};

			const blob = await generateEhrPdf({
				checkIns: filteredCheckIns,
				profile,
				planPayload: payload,
				dateRange
			});

			const filename = generateEhrFilename(profile, dateRange);
			downloadPdf(blob, filename);

			// Track the last provider report generation date
			lastProviderReportDate = new Date();
			await saveLastProviderReportDate(plan.actionPlanId, lastProviderReportDate);
		} catch (err) {
			console.error('[Reports] EHR PDF generation failed:', err);
		} finally {
			ehrExportLoading = false;
		}
	}

	/**
	 * Handle print for patient timeline.
	 */
	function handleTimelinePrint(): void {
		window.print();
	}

	/**
	 * Format the last generated date for display.
	 */
	function formatLastGenerated(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return 'Today';
		} else if (diffDays === 1) {
			return 'Yesterday';
		} else if (diffDays < 7) {
			return `${diffDays} days ago`;
		} else {
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
			});
		}
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

	onMount(async () => {
		loadCheckIns();

		// Load last provider report date
		if (plan?.actionPlanId) {
			const lastDate = await getLastProviderReportDate(plan.actionPlanId);
			if (lastDate) {
				lastProviderReportDate = lastDate;
			}
		}
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
		<!-- View Tabs -->
		<div class="view-tabs" role="tablist" aria-label="Report views">
			<button
				type="button"
				role="tab"
				class="tab-btn"
				class:active={activeView === 'journey'}
				aria-selected={activeView === 'journey'}
				aria-controls="view-journey"
				onclick={() => (activeView = 'journey')}
			>
				<svg
					class="tab-icon"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				My Journey
			</button>
			<button
				type="button"
				role="tab"
				class="tab-btn"
				class:active={activeView === 'summary'}
				aria-selected={activeView === 'summary'}
				aria-controls="view-summary"
				onclick={() => (activeView = 'summary')}
			>
				<svg
					class="tab-icon"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				Summary
			</button>
			<button
				type="button"
				role="tab"
				class="tab-btn"
				class:active={activeView === 'history'}
				aria-selected={activeView === 'history'}
				aria-controls="view-history"
				onclick={() => (activeView = 'history')}
			>
				<svg
					class="tab-icon"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
				History
			</button>
		</div>

		<!-- Filters Section (shown for Summary and History views) -->
		{#if activeView === 'summary' || activeView === 'history'}
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
		{/if}

		<!-- View Content -->
		<div class="view-content">
			<!-- Journey View (Patient Timeline) -->
			{#if activeView === 'journey'}
				<div id="view-journey" role="tabpanel" aria-labelledby="tab-journey">
					<PatientTimeline
						checkIns={filteredCheckIns}
						planPayload={payload}
						onPrint={handleTimelinePrint}
					/>
				</div>
			{/if}

			<!-- Summary View (Provider Dashboard style, patient-friendly) -->
			{#if activeView === 'summary'}
				<div id="view-summary" role="tabpanel" aria-labelledby="tab-summary">
					{#if hasCheckIns}
						<ProviderSummary
							checkIns={filteredCheckIns}
							planPayload={payload}
							{profile}
							onPrint={handleTimelinePrint}
						/>
					{:else}
						<EmptyState {hasFiltersApplied} onClearFilters={clearFilters} />
					{/if}
				</div>
			{/if}

			<!-- History View (Full check-in list) -->
			{#if activeView === 'history'}
				<div id="view-history" role="tabpanel" aria-labelledby="tab-history">
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
					{:else}
						<EmptyState {hasFiltersApplied} onClearFilters={clearFilters} />
					{/if}
				</div>
			{/if}
		</div>

		<!-- Export Options -->
		{#if hasCheckIns}
			<div class="export-sections">
				<!-- Share With Your Provider Section -->
				<section
					class="export-section export-section-primary"
					aria-label="Share with your provider"
				>
					<h2 class="export-heading">Share With Your Provider</h2>
					<p class="export-description">
						Generate a report before your appointment so your provider can see how you've been
						doing.
					</p>

					<button
						type="button"
						class="reminder-link"
						onclick={() => (showAppointmentModal = true)}
						aria-label="Set up appointment reminders"
					>
						<svg
							class="reminder-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
							<path d="M13.73 21a2 2 0 0 1-3.46 0" />
						</svg>
						Set up appointment reminders
					</button>

					<div class="export-buttons">
						<button
							type="button"
							class="export-btn export-btn-primary"
							onclick={handleEhrExport}
							disabled={!profile || !payload || ehrExportLoading}
						>
							<span class="export-icon" aria-hidden="true">
								{#if ehrExportLoading}
									<span class="loading-spinner-sm"></span>
								{:else}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path
											d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
								{/if}
							</span>
							{ehrExportLoading ? 'Generating...' : 'Create Provider Report'}
						</button>
					</div>

					{#if lastProviderReportDate}
						<p class="last-generated">
							Last shared: {formatLastGenerated(lastProviderReportDate)}
						</p>
					{/if}
				</section>

				<!-- Personal Records Section -->
				<section class="export-section export-section-secondary" aria-label="Personal records">
					<h2 class="export-heading">Personal Records</h2>
					<p class="export-description">
						Save a summary for yourself or share with family, teachers, or counselors.
					</p>

					<div class="export-buttons">
						<button
							type="button"
							class="export-btn export-btn-secondary"
							onclick={() => (showExportModal = true)}
							disabled={!profile || !payload}
						>
							<span class="export-icon" aria-hidden="true">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
									<polyline points="14 2 14 8 20 8" />
									<line x1="12" y1="18" x2="12" y2="12" />
									<line x1="9" y1="15" x2="12" y2="12" />
									<line x1="15" y1="15" x2="12" y2="12" />
								</svg>
							</span>
							Create Personal Summary
						</button>
					</div>
				</section>
			</div>
		{/if}
	{/if}
</div>

<!-- PDF Export Modal -->
{#if profile && payload && plan}
	<PdfExportModal
		open={showExportModal}
		actionPlanId={plan.actionPlanId}
		{profile}
		planPayload={payload}
		initialStartDate={startDate}
		initialEndDate={endDate}
		onClose={() => (showExportModal = false)}
	/>
{/if}

<!-- Appointment Reminder Modal -->
{#if plan}
	<AppointmentReminderModal
		open={showAppointmentModal}
		actionPlanId={plan.actionPlanId}
		onClose={() => (showAppointmentModal = false)}
	/>
{/if}

<style>
	.reports-page {
		padding: var(--space-6) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
	}

	/* Header */
	.page-header {
		margin-bottom: var(--space-6);
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

	/* View Tabs */
	.view-tabs {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-6);
		border-bottom: 1px solid var(--color-gray-200);
		padding-bottom: var(--space-2);
		overflow-x: auto;
	}

	.tab-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-muted);
		cursor: pointer;
		min-height: 44px;
		white-space: nowrap;
		transition:
			background-color 0.2s ease,
			color 0.2s ease;
	}

	.tab-btn:hover {
		background-color: var(--color-gray-100);
		color: var(--color-text);
	}

	.tab-btn.active {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.tab-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.tab-icon {
		width: 18px;
		height: 18px;
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

	.loading-spinner-sm {
		width: 16px;
		height: 16px;
		border: 2px solid var(--color-gray-300);
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
		margin-bottom: var(--space-6);
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

	/* View Content */
	.view-content {
		margin-bottom: var(--space-8);
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

	/* Export Sections Container */
	.export-sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	/* Export Section */
	.export-section {
		padding: var(--space-6);
		border: 1px solid var(--color-gray-200);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-lg);
	}

	.export-section-primary {
		background-color: color-mix(in srgb, var(--color-primary) 5%, white);
		border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
	}

	.export-section-secondary {
		background-color: var(--color-gray-50);
	}

	.export-heading {
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 var(--space-2);
	}

	.export-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4);
		line-height: 1.5;
	}

	.reminder-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) 0;
		margin-bottom: var(--space-4);
		background: none;
		border: none;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-primary);
		cursor: pointer;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.reminder-link:hover {
		color: #004a3f;
		text-decoration: underline;
	}

	.reminder-link:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.reminder-icon {
		width: 18px;
		height: 18px;
	}

	.export-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.export-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-5);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		min-height: 44px;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease;
	}

	.export-btn-primary {
		background-color: var(--color-primary);
		border: 1px solid var(--color-primary);
		color: var(--color-white);
	}

	.export-btn-primary:hover:not(:disabled) {
		background-color: #004a3f;
	}

	.export-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.export-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.export-btn-secondary {
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-300);
		color: var(--color-text);
	}

	.export-btn-secondary:hover:not(:disabled) {
		background-color: var(--color-gray-100);
		border-color: var(--color-gray-400);
	}

	.export-icon {
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.export-icon svg {
		width: 100%;
		height: 100%;
	}

	.last-generated {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin: var(--space-3) 0 0;
	}

	/* Print styles */
	@media print {
		.view-tabs,
		.filters-section,
		.export-sections,
		.breadcrumb {
			display: none;
		}

		.reports-page {
			padding: 0;
		}
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner,
		.loading-spinner-sm {
			animation: none;
		}

		.tab-btn {
			transition: none;
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

		.tab-btn.active {
			border: 2px solid currentColor;
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

		.view-tabs {
			gap: var(--space-1);
		}

		.tab-btn {
			padding: var(--space-2) var(--space-3);
			font-size: var(--font-size-xs);
		}

		.tab-icon {
			width: 16px;
			height: 16px;
		}

		.export-section {
			padding: var(--space-4);
		}

		.export-buttons {
			flex-direction: column;
		}

		.export-btn {
			width: 100%;
			justify-content: center;
		}

		.reminder-link {
			font-size: var(--font-size-xs);
		}
	}
</style>
