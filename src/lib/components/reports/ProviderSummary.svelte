<script lang="ts">
	/**
	 * ProviderSummary component displaying a clinical dashboard for providers.
	 * View 2 of the Three-View Architecture.
	 *
	 * Provides a 30-second scannable summary:
	 * - Engagement card: Total check-ins, frequency, days since last check-in
	 * - Zone distribution card: Simple breakdown with percentages
	 * - Top coping skills card: Most frequently used skills with counts
	 * - Alerts card: Red zone check-ins since last visit
	 */
	import type { CheckIn, PlanPayload, PatientProfile } from '$lib/db/index';
	import {
		calculateZoneDistribution,
		calculateSkillFrequency,
		calculateEngagementMetrics,
		calculateAdultContactSummary,
		calculateRedZoneAlerts,
		formatDaysSince
	} from '$lib/reports/aggregations';
	import ZoneDot from './ZoneDot.svelte';

	interface Props {
		checkIns: CheckIn[];
		planPayload: PlanPayload | null;
		profile: PatientProfile | null;
		/** Date of last visit for calculating alerts */
		lastVisitDate?: Date | null;
		onPrint?: () => void;
	}

	let { checkIns, planPayload, profile, lastVisitDate = null, onPrint }: Props = $props();

	// Use shared aggregation utilities
	let zoneDistribution = $derived(calculateZoneDistribution(checkIns));
	let topCopingSkills = $derived(
		planPayload ? calculateSkillFrequency(checkIns, planPayload, 5) : []
	);
	let engagementMetrics = $derived(calculateEngagementMetrics(checkIns));
	let adultContactInfo = $derived(calculateAdultContactSummary(checkIns));
	let redZoneAlerts = $derived(calculateRedZoneAlerts(checkIns, lastVisitDate ?? undefined));

	function formatAlertDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<section class="provider-summary" aria-label="Clinical summary dashboard">
	<div class="summary-header">
		<div class="header-content">
			<h2>Provider Summary</h2>
			{#if profile}
				<span class="patient-name">{profile.displayName}</span>
			{/if}
		</div>
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

	{#if engagementMetrics.totalCheckIns === 0}
		<div class="empty-dashboard">
			<p>No check-in data available for this patient.</p>
		</div>
	{:else}
		<div class="dashboard-grid">
			<!-- Engagement Card -->
			<div class="card engagement-card">
				<h3 class="card-title">Engagement</h3>
				<div class="metric-primary">{engagementMetrics.totalCheckIns}</div>
				<div class="metric-label">check-in{engagementMetrics.totalCheckIns !== 1 ? 's' : ''}</div>

				<div class="metric-details">
					{#if engagementMetrics.averageFrequency}
						<div class="detail-row">
							<span class="detail-label">Frequency</span>
							<span class="detail-value">{engagementMetrics.averageFrequency}</span>
						</div>
					{/if}
					{#if engagementMetrics.daysSinceLastCheckIn !== null}
						<div class="detail-row">
							<span class="detail-label">Last check-in</span>
							<span class="detail-value"
								>{formatDaysSince(engagementMetrics.daysSinceLastCheckIn)}</span
							>
						</div>
					{/if}
				</div>
			</div>

			<!-- Zone Overview Card -->
			<div class="card zone-card">
				<h3 class="card-title">Zone Overview</h3>
				<div class="zone-bars">
					<div class="zone-row">
						<ZoneDot zone="green" size={12} label="Green zone" />
						<span class="zone-label">Green</span>
						<span class="zone-percent">{zoneDistribution.green.percent}%</span>
						<div class="zone-bar-container">
							<div
								class="zone-bar zone-green-bg"
								style="width: {zoneDistribution.green.percent}%"
							></div>
						</div>
					</div>
					<div class="zone-row">
						<ZoneDot zone="yellow" size={12} label="Yellow zone" />
						<span class="zone-label">Yellow</span>
						<span class="zone-percent">{zoneDistribution.yellow.percent}%</span>
						<div class="zone-bar-container">
							<div
								class="zone-bar zone-yellow-bg"
								style="width: {zoneDistribution.yellow.percent}%"
							></div>
						</div>
					</div>
					<div class="zone-row">
						<ZoneDot zone="red" size={12} label="Red zone" />
						<span class="zone-label">Red</span>
						<span class="zone-percent">{zoneDistribution.red.percent}%</span>
						<div class="zone-bar-container">
							<div
								class="zone-bar zone-red-bg"
								style="width: {zoneDistribution.red.percent}%"
							></div>
						</div>
					</div>
				</div>
			</div>

			<!-- Top Coping Skills Card -->
			<div class="card skills-card">
				<h3 class="card-title">Top Coping Skills</h3>
				{#if topCopingSkills.length > 0}
					<ul class="skills-list">
						{#each topCopingSkills as skill (skill.id)}
							<li class="skill-item">
								<span class="skill-bullet" aria-hidden="true"></span>
								<span class="skill-name">{skill.title}</span>
								<span class="skill-count">{skill.count}x</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="no-data">No coping skills recorded</p>
				{/if}
			</div>

			<!-- Alerts Card -->
			<div class="card alerts-card" class:has-alerts={redZoneAlerts}>
				<h3 class="card-title">Alerts</h3>
				{#if redZoneAlerts}
					<div class="alert-content">
						<svg
							class="alert-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
						<div class="alert-text">
							<strong>{redZoneAlerts.count} red zone</strong>
							check-in{redZoneAlerts.count !== 1 ? 's' : ''}
							{#if lastVisitDate}
								<span class="alert-context">since last visit</span>
							{/if}
						</div>
						<div class="alert-date">
							Most recent: {formatAlertDate(redZoneAlerts.mostRecentDate)}
						</div>
					</div>
				{:else}
					<div class="no-alerts">
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>No red zone check-ins</span>
					</div>
				{/if}
			</div>

			<!-- Adult Contact Card -->
			<div class="card contact-card">
				<h3 class="card-title">Supportive Adult Contact</h3>
				<div class="contact-content">
					{#if adultContactInfo.hasContacted}
						<span class="contact-badge contacted">Yes</span>
						<span class="contact-count"
							>{adultContactInfo.contactCount} time{adultContactInfo.contactCount !== 1
								? 's'
								: ''}</span
						>
					{:else}
						<span class="contact-badge not-contacted">No</span>
						<span class="contact-note">No recorded contact</span>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</section>

<style>
	.provider-summary {
		padding: var(--space-4);
		background-color: var(--color-gray-50);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
	}

	.summary-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-6);
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.summary-header h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.patient-name {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
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

	/* Dashboard grid */
	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}

	/* Card base styles */
	.card {
		padding: var(--space-4);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
	}

	.card-title {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Engagement card */
	.engagement-card .metric-primary {
		font-size: var(--font-size-3xl);
		font-weight: 700;
		color: var(--color-primary);
		line-height: 1;
	}

	.engagement-card .metric-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--space-3);
	}

	.metric-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-gray-100);
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		font-size: var(--font-size-sm);
	}

	.detail-label {
		color: var(--color-text-muted);
	}

	.detail-value {
		color: var(--color-text);
		font-weight: 500;
	}

	/* Zone card */
	.zone-bars {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.zone-row {
		display: grid;
		grid-template-columns: 12px 50px 40px 1fr;
		align-items: center;
		gap: var(--space-2);
	}

	.zone-label {
		font-size: var(--font-size-sm);
		color: var(--color-text);
	}

	.zone-percent {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text);
		text-align: right;
	}

	.zone-bar-container {
		height: 8px;
		background-color: var(--color-gray-100);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.zone-bar {
		height: 100%;
		border-radius: var(--radius-sm);
		transition: width 0.3s ease;
	}

	.zone-green-bg {
		background-color: var(--color-primary);
	}

	.zone-yellow-bg {
		background-color: #eab308;
	}

	.zone-red-bg {
		background-color: #dc2626;
	}

	/* Skills card */
	.skills-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.skill-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-sm);
	}

	.skill-bullet {
		width: 6px;
		height: 6px;
		background-color: var(--color-primary);
		border-radius: 50%;
		flex-shrink: 0;
	}

	.skill-name {
		flex: 1;
		color: var(--color-text);
	}

	.skill-count {
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.no-data {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0;
	}

	/* Alerts card */
	.alerts-card.has-alerts {
		background-color: #fef2f2;
		border-color: #fecaca;
	}

	.alerts-card.has-alerts .card-title {
		color: #991b1b;
	}

	.alert-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.alert-icon {
		width: 24px;
		height: 24px;
		color: #dc2626;
	}

	.alert-text {
		font-size: var(--font-size-sm);
		color: #991b1b;
	}

	.alert-context {
		color: #b91c1c;
	}

	.alert-date {
		font-size: var(--font-size-xs);
		color: #991b1b;
	}

	.no-alerts {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-sm);
		color: var(--color-primary);
	}

	.check-icon {
		width: 20px;
		height: 20px;
	}

	/* Contact card */
	.contact-content {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.contact-badge {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 600;
	}

	.contact-badge.contacted {
		background-color: #dcfce7;
		color: #166534;
	}

	.contact-badge.not-contacted {
		background-color: var(--color-gray-100);
		color: var(--color-text-muted);
	}

	.contact-count {
		font-size: var(--font-size-sm);
		color: var(--color-text);
	}

	.contact-note {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	/* Empty state */
	.empty-dashboard {
		text-align: center;
		padding: var(--space-8);
		color: var(--color-text-muted);
	}

	/* Print styles */
	@media print {
		.provider-summary {
			border: none;
			background-color: white;
		}

		.print-btn {
			display: none;
		}

		.card {
			break-inside: avoid;
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.zone-bar {
			transition: none;
		}
	}

	/* High contrast mode */
	@media (forced-colors: active) {
		.card {
			border: 2px solid currentColor;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 600px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}

		.zone-row {
			grid-template-columns: 12px 50px 1fr 40px;
		}

		.zone-bar-container {
			order: 3;
			grid-column: 2 / -1;
			margin-top: var(--space-1);
		}

		.zone-percent {
			order: 2;
		}
	}
</style>
