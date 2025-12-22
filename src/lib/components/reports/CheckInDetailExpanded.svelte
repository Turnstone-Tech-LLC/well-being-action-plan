<script lang="ts">
	/**
	 * CheckInDetailExpanded component showing full check-in details.
	 * Expandable card that shows strategies used, adults contacted, and help methods.
	 */
	import type { CheckIn, PlanPayload } from '$lib/db/index';
	import { getZoneInfo } from '$lib/db/checkIns';

	interface Props {
		checkIn: CheckIn;
		planPayload: PlanPayload | null;
		isExpanded: boolean;
		onToggle: () => void;
	}

	let { checkIn, planPayload, isExpanded, onToggle }: Props = $props();

	let zoneInfo = $derived(getZoneInfo(checkIn.zone));

	// Format date with time
	function formatDateTime(date: Date): { date: string; time: string } {
		const d = new Date(date);
		const dateStr = d.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
		});
		const timeStr = d.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
		return { date: dateStr, time: timeStr };
	}

	// Get strategy details from plan payload
	function getStrategyDetails(strategyId: string): { title: string; description: string } | null {
		if (!planPayload) return null;
		const skill = planPayload.skills.find((s) => s.id === strategyId);
		if (skill) {
			return { title: skill.title, description: skill.description };
		}
		return null;
	}

	// Get adult details from plan payload
	function getAdultDetails(
		adultId: string
	): { name: string; type: string; contactInfo: string } | null {
		if (!planPayload) return null;
		const adult = planPayload.supportiveAdults.find((a) => a.id === adultId);
		if (adult) {
			return { name: adult.name, type: adult.type, contactInfo: adult.contactInfo };
		}
		return null;
	}

	// Get help method details from plan payload
	function getHelpMethodDetails(methodId: string): { title: string; description: string } | null {
		if (!planPayload) return null;
		const method = planPayload.helpMethods.find((m) => m.id === methodId);
		if (method) {
			return { title: method.title, description: method.description };
		}
		return null;
	}

	let dateTime = $derived(formatDateTime(checkIn.createdAt));
	let hasDetails = $derived(
		checkIn.strategiesUsed.length > 0 ||
			checkIn.supportiveAdultsContacted.length > 0 ||
			checkIn.helpMethodsSelected.length > 0 ||
			checkIn.notes ||
			checkIn.feelingNotes ||
			checkIn.contactedAdultName
	);
</script>

<article class="check-in-detail {zoneInfo.cssClass}" aria-label="Check-in from {dateTime.date}">
	<button
		type="button"
		class="check-in-header"
		onclick={onToggle}
		aria-expanded={isExpanded}
		aria-controls="check-in-content-{checkIn.id}"
		disabled={!hasDetails}
	>
		<div class="zone-indicator" aria-hidden="true">
			<span class="zone-dot"></span>
		</div>

		<div class="header-content">
			<div class="header-primary">
				<span class="check-in-date">{dateTime.date}</span>
				<span class="check-in-time">{dateTime.time}</span>
			</div>
			<span class="zone-label">{zoneInfo.label}</span>
		</div>

		{#if hasDetails}
			<span class="expand-icon" aria-hidden="true" class:expanded={isExpanded}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</span>
		{/if}
	</button>

	{#if isExpanded && hasDetails}
		<div id="check-in-content-{checkIn.id}" class="check-in-content">
			<!-- Strategies Used (Green zone) -->
			{#if checkIn.strategiesUsed.length > 0}
				<div class="detail-section">
					<h4 class="detail-title">
						<span class="detail-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M12 2L2 7l10 5 10-5-10-5z" />
								<path d="M2 17l10 5 10-5" />
								<path d="M2 12l10 5 10-5" />
							</svg>
						</span>
						Coping Skills Used
					</h4>
					<ul class="detail-list">
						{#each checkIn.strategiesUsed as strategyId (strategyId)}
							{@const details = getStrategyDetails(strategyId)}
							<li class="detail-item">
								{#if details}
									<span class="item-title">{details.title}</span>
								{:else}
									<span class="item-title muted">Unknown skill</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Supportive Adults Contacted (Yellow zone) -->
			{#if checkIn.supportiveAdultsContacted.length > 0}
				<div class="detail-section">
					<h4 class="detail-title">
						<span class="detail-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
								<circle cx="9" cy="7" r="4" />
								<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
								<path d="M16 3.13a4 4 0 0 1 0 7.75" />
							</svg>
						</span>
						Adults Contacted
					</h4>
					<ul class="detail-list">
						{#each checkIn.supportiveAdultsContacted as adultId (adultId)}
							{@const details = getAdultDetails(adultId)}
							<li class="detail-item">
								{#if details}
									<span class="item-title">{details.name}</span>
									<span class="item-subtitle">{details.type}</span>
								{:else}
									<span class="item-title muted">Unknown contact</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Help Methods Selected (Yellow zone) -->
			{#if checkIn.helpMethodsSelected.length > 0}
				<div class="detail-section">
					<h4 class="detail-title">
						<span class="detail-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10" />
								<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
								<line x1="12" y1="17" x2="12.01" y2="17" />
							</svg>
						</span>
						Help Methods Used
					</h4>
					<ul class="detail-list">
						{#each checkIn.helpMethodsSelected as methodId (methodId)}
							{@const details = getHelpMethodDetails(methodId)}
							<li class="detail-item">
								{#if details}
									<span class="item-title">{details.title}</span>
								{:else}
									<span class="item-title muted">Unknown method</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Feeling Notes (Yellow/Red zone context) -->
			{#if checkIn.feelingNotes}
				<div class="detail-section">
					<h4 class="detail-title">
						<span class="detail-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
							</svg>
						</span>
						What was going on
					</h4>
					<p class="notes-text feeling-notes">{checkIn.feelingNotes}</p>
				</div>
			{/if}

			<!-- Contacted Adult (Red zone) -->
			{#if checkIn.contactedAdultName}
				<div class="detail-section">
					<h4 class="detail-title">
						<span class="detail-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path
									d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
								/>
							</svg>
						</span>
						Reached out to
					</h4>
					<div class="contacted-adult">
						<span class="contacted-adult-name">{checkIn.contactedAdultName}</span>
					</div>
				</div>
			{/if}

			<!-- Notes -->
			{#if checkIn.notes}
				<div class="detail-section">
					<h4 class="detail-title">
						<span class="detail-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
								<polyline points="14 2 14 8 20 8" />
								<line x1="16" y1="13" x2="8" y2="13" />
								<line x1="16" y1="17" x2="8" y2="17" />
								<polyline points="10 9 9 9 8 9" />
							</svg>
						</span>
						Notes
					</h4>
					<p class="notes-text">{checkIn.notes}</p>
				</div>
			{/if}
		</div>
	{/if}
</article>

<style>
	.check-in-detail {
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.check-in-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-4);
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.2s ease;
	}

	.check-in-header:hover:not(:disabled) {
		background-color: var(--color-gray-50);
	}

	.check-in-header:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: -3px;
	}

	.check-in-header:disabled {
		cursor: default;
	}

	/* Zone indicator */
	.zone-indicator {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-gray-100);
		flex-shrink: 0;
	}

	.zone-dot {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background-color: var(--color-gray-300);
	}

	.zone-green .zone-indicator {
		background-color: #dcfce7;
	}

	.zone-green .zone-dot {
		background-color: #22c55e;
	}

	.zone-yellow .zone-indicator {
		background-color: #fef9c3;
	}

	.zone-yellow .zone-dot {
		background-color: #eab308;
	}

	.zone-red .zone-indicator {
		background-color: #fee2e2;
	}

	.zone-red .zone-dot {
		background-color: #ef4444;
	}

	/* Header content */
	.header-content {
		flex: 1;
		min-width: 0;
	}

	.header-primary {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.check-in-date {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text);
	}

	.check-in-time {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.zone-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-top: var(--space-1);
		display: block;
	}

	/* Expand icon */
	.expand-icon {
		width: 24px;
		height: 24px;
		color: var(--color-gray-400);
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.expand-icon svg {
		width: 100%;
		height: 100%;
	}

	.expand-icon.expanded {
		transform: rotate(180deg);
	}

	/* Content section */
	.check-in-content {
		padding: 0 var(--space-4) var(--space-4);
		border-top: 1px solid var(--color-gray-100);
		margin-top: 0;
	}

	.detail-section {
		padding-top: var(--space-4);
	}

	.detail-section:not(:first-child) {
		border-top: 1px solid var(--color-gray-100);
		margin-top: var(--space-4);
	}

	.detail-title {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 var(--space-3);
	}

	.detail-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.detail-icon svg {
		width: 100%;
		height: 100%;
	}

	.detail-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
		background-color: var(--color-bg-subtle);
		border-radius: var(--radius-md);
	}

	.item-title {
		font-size: var(--font-size-sm);
		color: var(--color-text);
		font-weight: 500;
	}

	.item-title.muted {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.item-subtitle {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.notes-text {
		font-size: var(--font-size-sm);
		color: var(--color-text);
		line-height: 1.6;
		margin: 0;
		padding: var(--space-3);
		background-color: var(--color-bg-subtle);
		border-radius: var(--radius-md);
		white-space: pre-wrap;
	}

	.notes-text.feeling-notes {
		border-left: 3px solid var(--color-gray-300);
	}

	.zone-yellow .notes-text.feeling-notes {
		border-left-color: #eab308;
	}

	.zone-red .notes-text.feeling-notes {
		border-left-color: #ef4444;
	}

	.contacted-adult {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background-color: #fee2e2;
		border-radius: var(--radius-md);
	}

	.contacted-adult-name {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: #991b1b;
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.check-in-header,
		.expand-icon {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.check-in-detail {
			border: 2px solid currentColor;
		}

		.zone-dot {
			border: 2px solid currentColor;
		}

		.check-in-header:focus-visible {
			outline: 3px solid CanvasText;
		}
	}

	/* Touch targets */
	@media (pointer: coarse) {
		.check-in-header {
			min-height: 56px;
		}
	}
</style>
