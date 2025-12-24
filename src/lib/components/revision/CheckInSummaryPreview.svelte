<script lang="ts">
	import type { CheckInSummary } from '$lib/server/types';

	interface Props {
		/** The check-in summary to display */
		summary: CheckInSummary;
		/** Callback when summary is edited */
		onEdit?: (updated: CheckInSummary) => void;
		/** Callback when summary is cleared */
		onClear?: () => void;
		/** Whether to show in compact mode */
		compact?: boolean;
	}

	let { summary, onEdit, onClear, compact = false }: Props = $props();

	let isEditing = $state(false);
	let expandedNotes = $state(false);

	// Local editing state - only used when isEditing is true
	// We use a function to create fresh state when entering edit mode
	let editedSummary = $state<CheckInSummary | null>(null);

	function startEditing() {
		editedSummary = { ...summary };
		isEditing = true;
	}

	function formatDate(dateStr: string): string {
		try {
			return new Date(dateStr).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return dateStr;
		}
	}

	function formatDateRange(start: string, end: string): string {
		return `${formatDate(start)} - ${formatDate(end)}`;
	}

	function handleCancel() {
		editedSummary = null;
		isEditing = false;
	}

	function handleSave() {
		if (onEdit && editedSummary) {
			onEdit(editedSummary);
		}
		editedSummary = null;
		isEditing = false;
	}

	function handleClear() {
		if (onClear) {
			onClear();
		}
	}

	function toggleNotes() {
		expandedNotes = !expandedNotes;
	}

	// Calculate total for zone percentages
	const total = $derived(
		summary.zoneDistribution.green + summary.zoneDistribution.yellow + summary.zoneDistribution.red
	);
	const greenPercent = $derived(
		total > 0 ? Math.round((summary.zoneDistribution.green / total) * 100) : 0
	);
	const yellowPercent = $derived(
		total > 0 ? Math.round((summary.zoneDistribution.yellow / total) * 100) : 0
	);
	const redPercent = $derived(
		total > 0 ? Math.round((summary.zoneDistribution.red / total) * 100) : 0
	);
</script>

<div class="summary-preview" class:compact>
	<div class="preview-header">
		<h3>Check-In Summary</h3>
		<div class="header-actions">
			{#if isEditing}
				<button type="button" class="btn btn-outline btn-sm" onclick={handleCancel}>Cancel</button>
				<button type="button" class="btn btn-primary btn-sm" onclick={handleSave}>Save</button>
			{:else}
				{#if onEdit}
					<button type="button" class="btn btn-outline btn-sm" onclick={startEditing}>Edit</button>
				{/if}
				{#if onClear}
					<button type="button" class="btn btn-outline btn-sm danger" onclick={handleClear}
						>Clear</button
					>
				{/if}
			{/if}
		</div>
	</div>

	<div class="preview-content">
		<!-- Date Range & Total -->
		<div class="summary-row">
			<div class="summary-item">
				<span class="label">Date Range</span>
				<span class="value">{formatDateRange(summary.dateRange.start, summary.dateRange.end)}</span>
			</div>
			<div class="summary-item">
				<span class="label">Total Check-Ins</span>
				{#if isEditing && editedSummary}
					<input
						type="number"
						min="0"
						bind:value={editedSummary.totalCheckIns}
						class="edit-input compact"
					/>
				{:else}
					<span class="value highlight">{summary.totalCheckIns}</span>
				{/if}
			</div>
		</div>

		<!-- Zone Distribution -->
		<div class="zone-distribution">
			<span class="label">Zone Distribution</span>
			<div
				class="zone-bar"
				role="img"
				aria-label="Zone distribution: {greenPercent}% green, {yellowPercent}% yellow, {redPercent}% red"
			>
				{#if total > 0}
					<div class="zone-segment green" style="width: {greenPercent}%"></div>
					<div class="zone-segment yellow" style="width: {yellowPercent}%"></div>
					<div class="zone-segment red" style="width: {redPercent}%"></div>
				{:else}
					<div class="zone-segment empty" style="width: 100%"></div>
				{/if}
			</div>
			<div class="zone-legend">
				<div class="legend-item">
					<span class="dot green"></span>
					{#if isEditing && editedSummary}
						<input
							type="number"
							min="0"
							bind:value={editedSummary.zoneDistribution.green}
							class="edit-input tiny"
						/>
					{:else}
						<span>{summary.zoneDistribution.green}</span>
					{/if}
					<span class="zone-label">Green ({greenPercent}%)</span>
				</div>
				<div class="legend-item">
					<span class="dot yellow"></span>
					{#if isEditing && editedSummary}
						<input
							type="number"
							min="0"
							bind:value={editedSummary.zoneDistribution.yellow}
							class="edit-input tiny"
						/>
					{:else}
						<span>{summary.zoneDistribution.yellow}</span>
					{/if}
					<span class="zone-label">Yellow ({yellowPercent}%)</span>
				</div>
				<div class="legend-item">
					<span class="dot red"></span>
					{#if isEditing && editedSummary}
						<input
							type="number"
							min="0"
							bind:value={editedSummary.zoneDistribution.red}
							class="edit-input tiny"
						/>
					{:else}
						<span>{summary.zoneDistribution.red}</span>
					{/if}
					<span class="zone-label">Red ({redPercent}%)</span>
				</div>
			</div>
		</div>

		<!-- Top Coping Skills -->
		{#if summary.topCopingSkills.length > 0}
			<div class="skills-section">
				<span class="label">Most Used Coping Skills</span>
				<ul class="skills-list">
					{#each summary.topCopingSkills as skill (skill.id)}
						<li>
							<span class="skill-name">{skill.title}</span>
							<span class="skill-count">{skill.count}x</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Adults Contacted -->
		{#if summary.adultsContacted.length > 0}
			<div class="adults-section">
				<span class="label">Supportive Adults Contacted</span>
				<ul class="adults-list">
					{#each summary.adultsContacted as adult (adult.name)}
						<li>
							<span class="adult-name">{adult.name}</span>
							<span class="contact-count">{adult.count}x</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Feeling Notes (collapsible) -->
		{#if summary.feelingNotes.length > 0 && !compact}
			<div class="notes-section">
				<button type="button" class="notes-toggle" onclick={toggleNotes}>
					<span class="label">Feeling Notes ({summary.feelingNotes.length})</span>
					<svg
						class="toggle-icon"
						class:expanded={expandedNotes}
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</button>
				{#if expandedNotes}
					<ul class="notes-list">
						{#each summary.feelingNotes as note (note.date)}
							<li>
								<div class="note-header">
									<span
										class="note-zone"
										class:yellow={note.zone === 'yellow'}
										class:red={note.zone === 'red'}
									>
										{note.zone === 'yellow' ? 'Yellow' : 'Red'}
									</span>
									<span class="note-date">{formatDate(note.date)}</span>
								</div>
								<p class="note-text">{note.note}</p>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}

		<!-- Import timestamp -->
		<div class="import-info">
			<span class="imported-at">Imported {formatDate(summary.importedAt)}</span>
		</div>
	</div>
</div>

<style>
	.summary-preview {
		background-color: var(--color-bg);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.summary-preview.compact {
		font-size: var(--font-size-sm);
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-4);
		background-color: var(--color-bg-subtle);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.preview-header h3 {
		margin: 0;
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text);
	}

	.header-actions {
		display: flex;
		gap: var(--space-2);
	}

	.btn-sm {
		padding: var(--space-1) var(--space-3);
		font-size: var(--font-size-sm);
	}

	.btn-sm.danger {
		color: #dc2626;
		border-color: #dc2626;
	}

	.btn-sm.danger:hover {
		background-color: #dc2626;
		color: white;
	}

	.preview-content {
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.summary-row {
		display: flex;
		gap: var(--space-6);
		flex-wrap: wrap;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.value {
		color: var(--color-text);
	}

	.value.highlight {
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--color-primary);
	}

	.edit-input {
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-sm);
		font-size: inherit;
	}

	.edit-input.compact {
		width: 80px;
	}

	.edit-input.tiny {
		width: 50px;
	}

	/* Zone Distribution */
	.zone-distribution {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.zone-bar {
		display: flex;
		height: 12px;
		border-radius: 6px;
		overflow: hidden;
		background-color: var(--color-gray-100);
	}

	.zone-segment {
		height: 100%;
		transition: width 0.3s ease;
	}

	.zone-segment.green {
		background-color: var(--color-primary);
	}

	.zone-segment.yellow {
		background-color: #eab308;
	}

	.zone-segment.red {
		background-color: #dc2626;
	}

	.zone-segment.empty {
		background-color: var(--color-gray-200);
	}

	.zone-legend {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--font-size-sm);
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.dot.green {
		background-color: var(--color-primary);
	}

	.dot.yellow {
		background-color: #eab308;
	}

	.dot.red {
		background-color: #dc2626;
	}

	.zone-label {
		color: var(--color-text-muted);
	}

	/* Skills List */
	.skills-section,
	.adults-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.skills-list,
	.adults-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.skills-list li,
	.adults-list li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-3);
		background-color: var(--color-bg-subtle);
		border-radius: var(--radius-full);
		font-size: var(--font-size-sm);
	}

	.skill-name,
	.adult-name {
		color: var(--color-text);
	}

	.skill-count,
	.contact-count {
		color: var(--color-text-muted);
		font-size: var(--font-size-xs);
	}

	/* Notes Section */
	.notes-section {
		border-top: 1px solid var(--color-gray-200);
		padding-top: var(--space-3);
	}

	.notes-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		background: none;
		border: none;
		padding: var(--space-2) 0;
		cursor: pointer;
		text-align: left;
	}

	.toggle-icon {
		transition: transform 0.2s ease;
		color: var(--color-text-muted);
	}

	.toggle-icon.expanded {
		transform: rotate(180deg);
	}

	.notes-list {
		list-style: none;
		padding: 0;
		margin: var(--space-2) 0 0 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.notes-list li {
		padding: var(--space-3);
		background-color: var(--color-bg-subtle);
		border-radius: var(--radius-md);
	}

	.note-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: var(--space-2);
	}

	.note-zone {
		font-size: var(--font-size-xs);
		font-weight: 500;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
	}

	.note-zone.yellow {
		background-color: #fef3c7;
		color: #92400e;
	}

	.note-zone.red {
		background-color: #fef2f2;
		color: #dc2626;
	}

	.note-date {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.note-text {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text);
		line-height: 1.5;
	}

	/* Import Info */
	.import-info {
		border-top: 1px solid var(--color-gray-200);
		padding-top: var(--space-3);
		margin-top: var(--space-2);
	}

	.imported-at {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
</style>
