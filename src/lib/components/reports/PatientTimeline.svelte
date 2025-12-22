<script lang="ts">
	/**
	 * PatientTimeline component displaying a patient/family-friendly horizontal timeline.
	 * View 1 of the Three-View Architecture.
	 *
	 * Features:
	 * - Horizontal timeline with zone-colored dots
	 * - Accessible shape variation (circle for green, triangle for yellow, square for red)
	 * - Expandable cards showing check-in details
	 * - Scrollable for longer timelines
	 * - Print-friendly single-page layout
	 */
	import type { CheckIn, PlanPayload } from '$lib/db/index';
	import { formatRelativeDate } from '$lib/db/checkIns';
	import { getZoneInfo } from '$lib/reports/aggregations';
	import ZoneDot from './ZoneDot.svelte';

	interface Props {
		checkIns: CheckIn[];
		planPayload: PlanPayload | null;
		onPrint?: () => void;
	}

	let { checkIns, planPayload, onPrint }: Props = $props();

	// Track which check-in is expanded
	let expandedId: number | null = $state(null);

	// Sort check-ins chronologically (oldest first for timeline)
	let sortedCheckIns = $derived(
		[...checkIns].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
	);

	let hasCheckIns = $derived(checkIns.length > 0);

	/**
	 * Get coping skills used in a check-in.
	 */
	function getCopingSkills(checkIn: CheckIn): string[] {
		if (!planPayload) return [];
		return checkIn.strategiesUsed
			.map((id) => {
				const skill = planPayload.skills.find((s) => s.id === id);
				return skill?.title;
			})
			.filter((title): title is string => !!title);
	}

	/**
	 * Format date for display.
	 */
	function formatDisplayDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	/**
	 * Toggle expanded state for a check-in.
	 */
	function toggleExpanded(id: number | undefined) {
		if (id === undefined) return;
		expandedId = expandedId === id ? null : id;
	}

	/**
	 * Handle keyboard navigation.
	 */
	function handleKeydown(event: KeyboardEvent, id: number | undefined) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleExpanded(id);
		}
	}
</script>

<section class="patient-timeline" aria-label="Your well-being journey">
	{#if hasCheckIns}
		<div class="timeline-header">
			<h2>Your Journey</h2>
			{#if onPrint}
				<button type="button" class="print-btn" onclick={onPrint}>
					<svg
						class="print-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path
							d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"
						/>
						<rect x="6" y="14" width="12" height="8" />
					</svg>
					Print
				</button>
			{/if}
		</div>

		<!-- Timeline visualization -->
		<div class="timeline-container" role="list" aria-label="Check-in timeline">
			<!-- Timeline track -->
			<div class="timeline-track" aria-hidden="true"></div>

			<!-- Check-in dots -->
			<div class="timeline-dots">
				{#each sortedCheckIns as checkIn, index (checkIn.id)}
					{@const skills = getCopingSkills(checkIn)}
					{@const isExpanded = expandedId === checkIn.id}
					{@const zoneInfo = getZoneInfo(checkIn.zone)}
					<div class="timeline-point" role="listitem">
						<!-- Date label (show for first, last, and every 5th) -->
						{#if index === 0 || index === sortedCheckIns.length - 1 || index % 5 === 0}
							<span class="date-label">{formatDisplayDate(checkIn.createdAt)}</span>
						{/if}

						<!-- Zone dot with accessible shape -->
						<button
							type="button"
							class="zone-dot-btn"
							onclick={() => toggleExpanded(checkIn.id)}
							onkeydown={(e) => handleKeydown(e, checkIn.id)}
							aria-expanded={isExpanded}
							aria-label="{zoneInfo.label} on {formatRelativeDate(
								checkIn.createdAt
							)}. {zoneInfo.shape} shape. Click to expand."
						>
							<ZoneDot zone={checkIn.zone} size={28} />
						</button>

						<!-- Expanded card -->
						{#if isExpanded}
							<div class="expanded-card" role="region" aria-label="Check-in details">
								<div class="card-header">
									<span class="card-zone zone-{checkIn.zone}-text">{zoneInfo.label}</span>
									<span class="card-date">{formatRelativeDate(checkIn.createdAt)}</span>
								</div>

								{#if skills.length > 0}
									<div class="card-section">
										<h4>Coping skills used:</h4>
										<ul class="skills-list">
											{#each skills as skill, i (i)}
												<li>{skill}</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if checkIn.notes}
									<div class="card-section">
										<h4>Notes:</h4>
										<p class="notes-text">{checkIn.notes}</p>
									</div>
								{/if}

								<button
									type="button"
									class="close-card-btn"
									onclick={() => (expandedId = null)}
									aria-label="Close details"
								>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M18 6L6 18M6 6l12 12" />
									</svg>
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Legend -->
		<div class="timeline-legend" role="img" aria-label="Zone legend">
			<div class="legend-item">
				<ZoneDot zone="green" size={20} label="Green zone" />
				<span class="legend-text">Feeling good (circle)</span>
			</div>
			<div class="legend-item">
				<ZoneDot zone="yellow" size={20} label="Yellow zone" />
				<span class="legend-text">Needed support (triangle)</span>
			</div>
			<div class="legend-item">
				<ZoneDot zone="red" size={20} label="Red zone" />
				<span class="legend-text">Reached out (square)</span>
			</div>
		</div>
	{:else}
		<!-- Empty state -->
		<div class="empty-state">
			<svg
				class="empty-icon"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
			>
				<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<h3>No check-ins yet</h3>
			<p>When you check in with how you're feeling, you'll see your journey here.</p>
		</div>
	{/if}
</section>

<style>
	.patient-timeline {
		padding: var(--space-4);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
	}

	.timeline-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-6);
	}

	.timeline-header h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.print-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		color: var(--color-text);
		cursor: pointer;
		min-height: 44px;
		transition: background-color 0.2s ease;
	}

	.print-btn:hover {
		background-color: var(--color-gray-50);
	}

	.print-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.print-icon {
		width: 18px;
		height: 18px;
	}

	/* Timeline container */
	.timeline-container {
		position: relative;
		padding: var(--space-8) var(--space-4);
		overflow-x: auto;
		scrollbar-width: thin;
	}

	.timeline-track {
		position: absolute;
		top: 50%;
		left: var(--space-4);
		right: var(--space-4);
		height: 2px;
		background-color: var(--color-gray-200);
		transform: translateY(-50%);
	}

	.timeline-dots {
		display: flex;
		gap: var(--space-4);
		position: relative;
		min-width: max-content;
		padding: var(--space-4) 0;
	}

	.timeline-point {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		gap: var(--space-2);
	}

	.date-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		white-space: nowrap;
		position: absolute;
		top: -28px;
	}

	/* Zone dot button styles */
	.zone-dot-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		cursor: pointer;
		position: relative;
		z-index: 1;
		background: transparent;
		padding: 0;
	}

	.zone-dot-btn:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	/* Expanded card */
	.expanded-card {
		position: absolute;
		top: calc(100% + var(--space-2));
		left: 50%;
		transform: translateX(-50%);
		width: 240px;
		padding: var(--space-4);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		z-index: 10;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-gray-100);
	}

	.card-zone {
		font-size: var(--font-size-sm);
		font-weight: 600;
	}

	.zone-green-text {
		color: var(--color-primary);
	}

	.zone-yellow-text {
		color: #ca8a04;
	}

	.zone-red-text {
		color: #dc2626;
	}

	.card-date {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.card-section {
		margin-bottom: var(--space-3);
	}

	.card-section:last-of-type {
		margin-bottom: 0;
	}

	.card-section h4 {
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--color-text-muted);
		margin: 0 0 var(--space-1);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.skills-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.skills-list li {
		font-size: var(--font-size-sm);
		color: var(--color-text);
		padding: var(--space-1) 0;
	}

	.notes-text {
		font-size: var(--font-size-sm);
		color: var(--color-text);
		margin: 0;
		font-style: italic;
	}

	.close-card-btn {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
	}

	.close-card-btn:hover {
		color: var(--color-text);
		background-color: var(--color-gray-100);
	}

	.close-card-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}

	.close-card-btn svg {
		width: 16px;
		height: 16px;
	}

	/* Legend */
	.timeline-legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		margin-top: var(--space-6);
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-gray-100);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.legend-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--space-12) var(--space-4);
	}

	.empty-icon {
		width: 64px;
		height: 64px;
		color: var(--color-gray-300);
		margin-bottom: var(--space-4);
	}

	.empty-state h3 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 var(--space-2);
	}

	.empty-state p {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0;
		max-width: 280px;
	}

	/* Print styles */
	@media print {
		.patient-timeline {
			border: none;
			padding: 0;
		}

		.print-btn {
			display: none;
		}

		.timeline-container {
			overflow: visible;
		}

		.expanded-card {
			display: none;
		}
	}

	/* High contrast mode */
	@media (forced-colors: active) {
		.expanded-card {
			border: 2px solid currentColor;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.timeline-header {
			flex-direction: column;
			gap: var(--space-3);
			align-items: flex-start;
		}

		.timeline-legend {
			flex-direction: column;
			gap: var(--space-2);
		}

		.expanded-card {
			width: 200px;
			left: 0;
			transform: none;
		}
	}
</style>
