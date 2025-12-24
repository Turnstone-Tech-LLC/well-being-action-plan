<script lang="ts">
	import type { PageData } from './$types';
	import type { RevisionHistoryItem } from './+page.server';

	let { data }: { data: PageData } = $props();

	let selectedRevisions = $state<string[]>([]);
	let compareMode = $state(false);
	let viewingRevision = $state<RevisionHistoryItem | null>(null);

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

	function viewRevision(revision: RevisionHistoryItem): void {
		viewingRevision = revision;
	}

	function exitView(): void {
		viewingRevision = null;
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

			{#if !compareMode && !viewingRevision && data.revisions.length > 1}
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

			{#if viewingRevision}
				<div class="header-actions">
					<button type="button" class="btn btn-outline" onclick={exitView}>
						Back to Timeline
					</button>
				</div>
			{/if}
		</div>
	</header>

	{#if viewingRevision}
		<div class="view-revision">
			<div class="view-header">
				<h2>Version {viewingRevision.version}</h2>
				<span class="revision-type {getRevisionTypeClass(viewingRevision.revision_type)}">
					{getRevisionTypeLabel(viewingRevision.revision_type)}
				</span>
			</div>
			<p class="view-meta">
				{formatDate(viewingRevision.created_at)}
				{#if viewingRevision.created_by_name}
					<span class="separator">&bull;</span>
					by {viewingRevision.created_by_name}
				{/if}
			</p>

			{#if viewingRevision.revision_notes}
				<div class="view-section">
					<h3>Revision Notes</h3>
					<p>{viewingRevision.revision_notes}</p>
				</div>
			{/if}

			{#if viewingRevision.revision_type === 'revision'}
				{#if viewingRevision.what_worked_notes}
					<div class="view-section">
						<h3>What Worked Well</h3>
						<p>{viewingRevision.what_worked_notes}</p>
					</div>
				{/if}

				{#if viewingRevision.what_didnt_work_notes}
					<div class="view-section">
						<h3>What to Improve</h3>
						<p>{viewingRevision.what_didnt_work_notes}</p>
					</div>
				{/if}

				{#if viewingRevision.check_in_summary}
					<div class="view-section check-in-detail">
						<h3>Check-In Summary</h3>
						<div class="check-in-grid">
							<div class="check-in-stat">
								<span class="stat-value">{viewingRevision.check_in_summary.totalCheckIns}</span>
								<span class="stat-label">Total Check-ins</span>
							</div>
							<div class="check-in-stat">
								<span class="stat-value"
									>{viewingRevision.check_in_summary.dateRange.start} - {viewingRevision
										.check_in_summary.dateRange.end}</span
								>
								<span class="stat-label">Date Range</span>
							</div>
						</div>

						<div class="zone-distribution">
							<h4>Zone Distribution</h4>
							<div class="zone-bars">
								<div class="zone-bar zone-green">
									<span class="zone-count"
										>{viewingRevision.check_in_summary.zoneDistribution.green}</span
									>
									<span class="zone-label">Green</span>
								</div>
								<div class="zone-bar zone-yellow">
									<span class="zone-count"
										>{viewingRevision.check_in_summary.zoneDistribution.yellow}</span
									>
									<span class="zone-label">Yellow</span>
								</div>
								<div class="zone-bar zone-red">
									<span class="zone-count"
										>{viewingRevision.check_in_summary.zoneDistribution.red}</span
									>
									<span class="zone-label">Red</span>
								</div>
							</div>
						</div>

						{#if viewingRevision.check_in_summary.topCopingSkills?.length}
							<div class="coping-skills-used">
								<h4>Top Coping Skills Used</h4>
								<ul>
									{#each viewingRevision.check_in_summary.topCopingSkills as skill (skill.id)}
										<li>
											<span class="skill-title">{skill.title}</span>
											<span class="skill-count">Used {skill.count} times</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if viewingRevision.check_in_summary.adultsContacted?.length}
							<div class="adults-contacted">
								<h4>Supportive Adults Contacted</h4>
								<ul>
									{#each viewingRevision.check_in_summary.adultsContacted as adult (adult.name)}
										<li>
											<span class="adult-name">{adult.name}</span>
											<span class="adult-count">Contacted {adult.count} times</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if viewingRevision.check_in_summary.feelingNotes?.length}
							<div class="feeling-notes">
								<h4>Feeling Notes</h4>
								<ul>
									{#each viewingRevision.check_in_summary.feelingNotes as note (note.date)}
										<li>
											<span class="note-zone zone-{note.zone.toLowerCase()}">{note.zone}</span>
											<span class="note-date">{note.date}</span>
											<p class="note-text">{note.note}</p>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/if}
			{/if}

			<div class="view-section">
				<h3>Coping Skills ({viewingRevision.plan_payload.skills.length})</h3>
				<ul class="content-list">
					{#each viewingRevision.plan_payload.skills as skill (skill.id)}
						<li>
							<span class="item-title">{skill.title}</span>
							<span class="item-category">{skill.category}</span>
						</li>
					{/each}
				</ul>
			</div>

			<div class="view-section">
				<h3>Supportive Adults ({viewingRevision.plan_payload.supportiveAdults.length})</h3>
				<ul class="content-list">
					{#each viewingRevision.plan_payload.supportiveAdults as adult (adult.id)}
						<li>
							<span class="item-title">{adult.name}</span>
							<span class="item-category">{adult.type}</span>
							{#if adult.isPrimary}
								<span class="primary-badge">Primary</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>

			<div class="view-section">
				<h3>Help Methods ({viewingRevision.plan_payload.helpMethods.length})</h3>
				<ul class="content-list">
					{#each viewingRevision.plan_payload.helpMethods as method (method.id)}
						<li>
							<span class="item-title">{method.title}</span>
							{#if method.additionalInfo}
								<span class="item-info">{method.additionalInfo}</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{:else if compareMode && revision1 && revision2}
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
								{#each revision1.plan_payload.skills as skill (skill.id)}
									<li>{skill.title}</li>
								{/each}
							</ul>
						</div>
						<div class="compare-section">
							<h4>Supportive Adults ({revision1.plan_payload.supportiveAdults.length})</h4>
							<ul>
								{#each revision1.plan_payload.supportiveAdults as adult (adult.id)}
									<li>{adult.name} ({adult.type})</li>
								{/each}
							</ul>
						</div>
						<div class="compare-section">
							<h4>Help Methods ({revision1.plan_payload.helpMethods.length})</h4>
							<ul>
								{#each revision1.plan_payload.helpMethods as method (method.id)}
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
								{#each revision2.plan_payload.skills as skill (skill.id)}
									<li>{skill.title}</li>
								{/each}
							</ul>
						</div>
						<div class="compare-section">
							<h4>Supportive Adults ({revision2.plan_payload.supportiveAdults.length})</h4>
							<ul>
								{#each revision2.plan_payload.supportiveAdults as adult (adult.id)}
									<li>{adult.name} ({adult.type})</li>
								{/each}
							</ul>
						</div>
						<div class="compare-section">
							<h4>Help Methods ({revision2.plan_payload.helpMethods.length})</h4>
							<ul>
								{#each revision2.plan_payload.helpMethods as method (method.id)}
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
							<div class="revision-actions">
								<button
									type="button"
									class="btn btn-sm btn-outline"
									onclick={() => viewRevision(revision)}
								>
									View
								</button>
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

	/* View revision styles */
	.view-revision {
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-xl);
		padding: var(--space-6);
	}

	.view-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}

	.view-header h2 {
		margin: 0;
		font-size: var(--font-size-xl);
	}

	.view-meta {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0 0 var(--space-4);
	}

	.view-section {
		padding: var(--space-4);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-4);
	}

	.view-section h3 {
		margin: 0 0 var(--space-3);
		font-size: var(--font-size-lg);
		color: var(--color-text);
	}

	.view-section h4 {
		margin: var(--space-3) 0 var(--space-2);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.view-section p {
		margin: 0;
		font-size: var(--font-size-sm);
		line-height: 1.6;
	}

	.content-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.content-list li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-gray-200);
		flex-wrap: wrap;
	}

	.content-list li:last-child {
		border-bottom: none;
	}

	.item-title {
		font-weight: 500;
		color: var(--color-text);
	}

	.item-category,
	.item-info {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		background-color: var(--color-gray-100);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
	}

	.primary-badge {
		font-size: var(--font-size-xs);
		color: var(--color-primary);
		background-color: rgba(0, 89, 76, 0.1);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-weight: 500;
	}

	/* Check-in detail styles */
	.check-in-detail {
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
	}

	.check-in-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.check-in-stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.stat-value {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
	}

	.stat-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.zone-distribution {
		margin: var(--space-4) 0;
	}

	.zone-bars {
		display: flex;
		gap: var(--space-3);
	}

	.zone-bar {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-3);
		border-radius: var(--radius-md);
		min-width: 80px;
	}

	.zone-bar.zone-green {
		background-color: #dcfce7;
	}

	.zone-bar.zone-yellow {
		background-color: #fef9c3;
	}

	.zone-bar.zone-red {
		background-color: #fee2e2;
	}

	.zone-count {
		font-size: var(--font-size-xl);
		font-weight: 600;
	}

	.zone-bar.zone-green .zone-count {
		color: #166534;
	}

	.zone-bar.zone-yellow .zone-count {
		color: #854d0e;
	}

	.zone-bar.zone-red .zone-count {
		color: #991b1b;
	}

	.zone-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.coping-skills-used ul,
	.adults-contacted ul,
	.feeling-notes ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.coping-skills-used li,
	.adults-contacted li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-gray-100);
	}

	.coping-skills-used li:last-child,
	.adults-contacted li:last-child {
		border-bottom: none;
	}

	.skill-title,
	.adult-name {
		font-weight: 500;
	}

	.skill-count,
	.adult-count {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.feeling-notes li {
		padding: var(--space-3);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-2);
	}

	.feeling-notes li:last-child {
		margin-bottom: 0;
	}

	.note-zone {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: 500;
		margin-right: var(--space-2);
	}

	.note-zone.zone-green {
		background-color: #dcfce7;
		color: #166534;
	}

	.note-zone.zone-yellow {
		background-color: #fef9c3;
		color: #854d0e;
	}

	.note-zone.zone-red {
		background-color: #fee2e2;
		color: #991b1b;
	}

	.note-date {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.note-text {
		margin: var(--space-2) 0 0;
		font-size: var(--font-size-sm);
		line-height: 1.6;
	}

	/* Revision actions */
	.revision-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.btn-sm {
		padding: var(--space-1) var(--space-3);
		font-size: var(--font-size-xs);
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
