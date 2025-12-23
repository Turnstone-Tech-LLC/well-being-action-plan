<script lang="ts">
	import type { PageData } from './$types';
	import type { RevisionHistoryItem } from './+page.server';

	let { data }: { data: PageData } = $props();

	let selectedRevisions = $state<string[]>([]);
	let compareMode = $state(false);

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getRevisionTypeLabel(type: string): string {
		switch (type) {
			case 'initial':
				return 'Initial Creation';
			case 'edit':
				return 'Quick Edit';
			case 'revision':
				return 'Follow-up Revision';
			default:
				return 'Edit';
		}
	}

	function getRevisionTypeClass(type: string): string {
		switch (type) {
			case 'initial':
				return 'type-initial';
			case 'revision':
				return 'type-revision';
			default:
				return 'type-edit';
		}
	}

	function toggleRevisionSelection(revisionId: string): void {
		if (selectedRevisions.includes(revisionId)) {
			selectedRevisions = selectedRevisions.filter((id) => id !== revisionId);
		} else if (selectedRevisions.length < 2) {
			selectedRevisions = [...selectedRevisions, revisionId];
		}
	}

	function startCompare(): void {
		if (selectedRevisions.length === 2) {
			compareMode = true;
		}
	}

	function exitCompare(): void {
		compareMode = false;
		selectedRevisions = [];
	}

	function getRevisionById(id: string): RevisionHistoryItem | undefined {
		return data.revisions.find((r) => r.id === id);
	}

	// Computed values for compare mode
	let revision1 = $derived(selectedRevisions[0] ? getRevisionById(selectedRevisions[0]) : null);
	let revision2 = $derived(selectedRevisions[1] ? getRevisionById(selectedRevisions[1]) : null);
</script>

<svelte:head>
	<title>Revision History - {data.patientNickname} - Well-Being Action Plan</title>
</svelte:head>

<div class="history-page">
	<header class="page-header">
		<div class="header-content">
			<div class="header-top">
				<a href="/provider/plans/{data.planId}" class="back-link">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="back-icon"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
						/>
					</svg>
					Back to Plan
				</a>
			</div>

			<div class="header-main">
				<h1>Revision History</h1>
				<p class="subtitle">
					{data.patientNickname} - {data.revisions.length} revision{data.revisions.length !== 1
						? 's'
						: ''}
				</p>
			</div>

			{#if !compareMode && data.revisions.length > 1}
				<div class="header-actions">
					{#if selectedRevisions.length === 2}
						<button type="button" class="btn btn-primary" onclick={startCompare}>
							Compare Selected
						</button>
					{:else}
						<p class="compare-hint">Select 2 revisions to compare</p>
					{/if}
				</div>
			{/if}

			{#if compareMode}
				<div class="header-actions">
					<button type="button" class="btn btn-outline" onclick={exitCompare}>
						Exit Comparison
					</button>
				</div>
			{/if}
		</div>
	</header>

	{#if compareMode && revision1 && revision2}
		<div class="compare-view">
			<div class="compare-header">
				<h2>Comparing Versions</h2>
			</div>
			<div class="compare-grid">
				<div class="compare-column">
					<h3>Version {revision1.version} ({getRevisionTypeLabel(revision1.revision_type)})</h3>
					<p class="compare-date">{formatDate(revision1.created_at)}</p>
					{#if revision1.revision_notes}
						<div class="compare-notes">
							<strong>Notes:</strong>
							{revision1.revision_notes}
						</div>
					{/if}
					<div class="compare-content">
						<div class="compare-section">
							<h4>Coping Skills ({revision1.plan_payload.skills.length})</h4>
							<ul>
								{#each revision1.plan_payload.skills as skill}
									<li>{skill.title}</li>
								{/each}
							</ul>
						</div>
						<div class="compare-section">
							<h4>Supportive Adults ({revision1.plan_payload.supportiveAdults.length})</h4>
							<ul>
								{#each revision1.plan_payload.supportiveAdults as adult}
									<li>{adult.name} ({adult.type})</li>
								{/each}
							</ul>
						</div>
						<div class="compare-section">
							<h4>Help Methods ({revision1.plan_payload.helpMethods.length})</h4>
							<ul>
								{#each revision1.plan_payload.helpMethods as method}
									<li>{method.title}</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
				<div class="compare-column">
					<h3>Version {revision2.version} ({getRevisionTypeLabel(revision2.revision_type)})</h3>
					<p class="compare-date">{formatDate(revision2.created_at)}</p>
					{#if revision2.revision_notes}
						<div class="compare-notes">
							<strong>Notes:</strong>
							{revision2.revision_notes}
						</div>
					{/if}
					<div class="compare-content">
						<div class="compare-section">
							<h4>Coping Skills ({revision2.plan_payload.skills.length})</h4>
							<ul>
								{#each revision2.plan_payload.skills as skill}
									<li>{skill.title}</li>
								{/each}
							</ul>
						</div>
						<div class="compare-section">
							<h4>Supportive Adults ({revision2.plan_payload.supportiveAdults.length})</h4>
							<ul>
								{#each revision2.plan_payload.supportiveAdults as adult}
									<li>{adult.name} ({adult.type})</li>
								{/each}
							</ul>
						</div>
						<div class="compare-section">
							<h4>Help Methods ({revision2.plan_payload.helpMethods.length})</h4>
							<ul>
								{#each revision2.plan_payload.helpMethods as method}
									<li>{method.title}</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="timeline">
			{#each data.revisions as revision, index (revision.id)}
				<div class="timeline-item" class:selected={selectedRevisions.includes(revision.id)}>
					<div class="timeline-marker">
						<div class="marker-dot {getRevisionTypeClass(revision.revision_type)}"></div>
						{#if index < data.revisions.length - 1}
							<div class="marker-line"></div>
						{/if}
					</div>
					<div class="timeline-content">
						<div class="revision-header">
							<div class="revision-title">
								<h3>Version {revision.version}</h3>
								<span class="revision-type {getRevisionTypeClass(revision.revision_type)}">
									{getRevisionTypeLabel(revision.revision_type)}
								</span>
							</div>
							{#if data.revisions.length > 1}
								<label class="compare-checkbox">
									<input
										type="checkbox"
										checked={selectedRevisions.includes(revision.id)}
										disabled={!selectedRevisions.includes(revision.id) &&
											selectedRevisions.length >= 2}
										onchange={() => toggleRevisionSelection(revision.id)}
									/>
									<span class="checkbox-label">Select</span>
								</label>
							{/if}
						</div>

						<p class="revision-meta">
							{formatDate(revision.created_at)}
							{#if revision.created_by_name}
								<span class="separator">&bull;</span>
								by {revision.created_by_name}
							{/if}
						</p>

						{#if revision.revision_notes}
							<div class="revision-notes">
								<strong>Change notes:</strong>
								{revision.revision_notes}
							</div>
						{/if}

						{#if revision.revision_type === 'revision'}
							{#if revision.what_worked_notes}
								<div class="revision-feedback">
									<strong>What worked:</strong>
									{revision.what_worked_notes}
								</div>
							{/if}
							{#if revision.what_didnt_work_notes}
								<div class="revision-feedback">
									<strong>What to improve:</strong>
									{revision.what_didnt_work_notes}
								</div>
							{/if}
							{#if revision.check_in_summary}
								<div class="check-in-summary">
									<strong
										>Check-in summary ({revision.check_in_summary.totalCheckIns} check-ins):</strong
									>
									<div class="zone-stats">
										<span class="zone-stat zone-green"
											>{revision.check_in_summary.zoneDistribution.green} Green</span
										>
										<span class="zone-stat zone-yellow"
											>{revision.check_in_summary.zoneDistribution.yellow} Yellow</span
										>
										<span class="zone-stat zone-red"
											>{revision.check_in_summary.zoneDistribution.red} Red</span
										>
									</div>
								</div>
							{/if}
						{/if}

						<div class="revision-summary">
							<span class="summary-item">
								<strong>{revision.plan_payload.skills.length}</strong> skills
							</span>
							<span class="summary-item">
								<strong>{revision.plan_payload.supportiveAdults.length}</strong> adults
							</span>
							<span class="summary-item">
								<strong>{revision.plan_payload.helpMethods.length}</strong> help methods
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.history-page {
		max-width: 64rem;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.page-header {
		margin-bottom: var(--space-6);
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.header-top {
		display: flex;
		align-items: center;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--font-size-sm);
		transition: color 0.15s ease;
	}

	.back-link:hover {
		color: var(--color-primary);
	}

	.back-link:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.back-icon {
		width: 1rem;
		height: 1rem;
	}

	.header-main h1 {
		margin: 0;
		font-size: var(--font-size-2xl);
		color: var(--color-text);
	}

	.subtitle {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.compare-hint {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-weight: 500;
		font-size: var(--font-size-sm);
		border-radius: var(--radius-md);
		border: none;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
		cursor: pointer;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover {
		background-color: var(--color-primary-dark, #004a3f);
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-primary);
		border: 1px solid var(--color-primary);
	}

	.btn-outline:hover {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	/* Timeline styles */
	.timeline {
		position: relative;
	}

	.timeline-item {
		display: flex;
		gap: var(--space-4);
		padding: var(--space-4);
		margin-bottom: var(--space-2);
		border-radius: var(--radius-lg);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.timeline-item:hover {
		border-color: var(--color-primary);
	}

	.timeline-item.selected {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(0, 89, 76, 0.1);
	}

	.timeline-marker {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
	}

	.marker-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background-color: var(--color-gray-400);
		border: 2px solid var(--color-white);
		box-shadow: 0 0 0 2px var(--color-gray-200);
	}

	.marker-dot.type-initial {
		background-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(0, 89, 76, 0.2);
	}

	.marker-dot.type-revision {
		background-color: #2563eb;
		box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
	}

	.marker-line {
		width: 2px;
		flex: 1;
		min-height: 20px;
		background-color: var(--color-gray-200);
		margin-top: var(--space-2);
	}

	.timeline-content {
		flex: 1;
	}

	.revision-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-4);
	}

	.revision-title {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.revision-title h3 {
		margin: 0;
		font-size: var(--font-size-lg);
		color: var(--color-text);
	}

	.revision-type {
		display: inline-flex;
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-xs);
		font-weight: 500;
		border-radius: var(--radius-full);
	}

	.revision-type.type-initial {
		background-color: rgba(0, 89, 76, 0.1);
		color: var(--color-primary);
	}

	.revision-type.type-edit {
		background-color: var(--color-gray-100);
		color: var(--color-text-muted);
	}

	.revision-type.type-revision {
		background-color: rgba(37, 99, 235, 0.1);
		color: #2563eb;
	}

	.compare-checkbox {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
	}

	.compare-checkbox input {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
	}

	.compare-checkbox input:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.checkbox-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.revision-meta {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: var(--space-2) 0;
	}

	.separator {
		margin: 0 var(--space-2);
	}

	.revision-notes,
	.revision-feedback {
		padding: var(--space-2) var(--space-3);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		margin-top: var(--space-2);
	}

	.check-in-summary {
		padding: var(--space-3);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		margin-top: var(--space-2);
	}

	.zone-stats {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}

	.zone-stat {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: 500;
	}

	.zone-green {
		background-color: #dcfce7;
		color: #166534;
	}

	.zone-yellow {
		background-color: #fef9c3;
		color: #854d0e;
	}

	.zone-red {
		background-color: #fee2e2;
		color: #991b1b;
	}

	.revision-summary {
		display: flex;
		gap: var(--space-4);
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-gray-100);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	/* Compare view styles */
	.compare-view {
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-xl);
		padding: var(--space-6);
	}

	.compare-header {
		margin-bottom: var(--space-4);
	}

	.compare-header h2 {
		margin: 0;
		font-size: var(--font-size-xl);
	}

	.compare-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-6);
	}

	.compare-column {
		padding: var(--space-4);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-lg);
	}

	.compare-column h3 {
		margin: 0 0 var(--space-1);
		font-size: var(--font-size-lg);
	}

	.compare-date {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0 0 var(--space-3);
	}

	.compare-notes {
		padding: var(--space-2) var(--space-3);
		background-color: var(--color-white);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-3);
	}

	.compare-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.compare-section h4 {
		margin: 0 0 var(--space-2);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.compare-section ul {
		margin: 0;
		padding-left: var(--space-4);
	}

	.compare-section li {
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-1);
	}

	@media (max-width: 768px) {
		.history-page {
			padding: var(--space-4);
		}

		.compare-grid {
			grid-template-columns: 1fr;
		}

		.timeline-item {
			flex-direction: column;
		}

		.timeline-marker {
			flex-direction: row;
			gap: var(--space-2);
		}

		.marker-line {
			display: none;
		}
	}
</style>
