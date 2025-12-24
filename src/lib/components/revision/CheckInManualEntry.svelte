<script lang="ts">
	import type { CheckInSummary } from '$lib/server/types';

	interface Props {
		/** Callback when summary is submitted */
		onSubmit: (summary: CheckInSummary) => void;
		/** Callback when cancelled */
		onCancel?: () => void;
		/** Existing summary to pre-fill (for editing) */
		existingSummary?: CheckInSummary | null;
	}

	let { onSubmit, onCancel, existingSummary = null }: Props = $props();

	// Form state
	let dateStart = $state(existingSummary?.dateRange.start.split('T')[0] || '');
	let dateEnd = $state(existingSummary?.dateRange.end.split('T')[0] || '');
	let totalCheckIns = $state(existingSummary?.totalCheckIns || 0);
	let greenCount = $state(existingSummary?.zoneDistribution.green || 0);
	let yellowCount = $state(existingSummary?.zoneDistribution.yellow || 0);
	let redCount = $state(existingSummary?.zoneDistribution.red || 0);

	// Error state
	let errors = $state<string[]>([]);

	function validateForm(): boolean {
		errors = [];

		if (!dateStart) {
			errors.push('Start date is required.');
		}
		if (!dateEnd) {
			errors.push('End date is required.');
		}
		if (dateStart && dateEnd && new Date(dateStart) > new Date(dateEnd)) {
			errors.push('Start date must be before end date.');
		}
		if (totalCheckIns < 0) {
			errors.push('Total check-ins cannot be negative.');
		}
		if (greenCount < 0 || yellowCount < 0 || redCount < 0) {
			errors.push('Zone counts cannot be negative.');
		}

		// Zone counts should roughly match total (allow some flexibility)
		const zoneTotal = greenCount + yellowCount + redCount;
		if (
			zoneTotal > 0 &&
			totalCheckIns > 0 &&
			Math.abs(zoneTotal - totalCheckIns) > totalCheckIns * 0.1
		) {
			errors.push(`Zone counts (${zoneTotal}) don't match total check-ins (${totalCheckIns}).`);
		}

		return errors.length === 0;
	}

	function handleSubmit(event: Event) {
		event.preventDefault();

		if (!validateForm()) {
			return;
		}

		const summary: CheckInSummary = {
			dateRange: {
				start: new Date(dateStart).toISOString(),
				end: new Date(dateEnd).toISOString()
			},
			totalCheckIns,
			zoneDistribution: {
				green: greenCount,
				yellow: yellowCount,
				red: redCount
			},
			topCopingSkills: existingSummary?.topCopingSkills || [],
			feelingNotes: existingSummary?.feelingNotes || [],
			adultsContacted: existingSummary?.adultsContacted || [],
			importedAt: new Date().toISOString()
		};

		onSubmit(summary);
	}

	function handleCancel() {
		if (onCancel) {
			onCancel();
		}
	}

	// Auto-update total when zone counts change
	$effect(() => {
		const zoneTotal = greenCount + yellowCount + redCount;
		if (zoneTotal > 0 && totalCheckIns === 0) {
			totalCheckIns = zoneTotal;
		}
	});

	const canSubmit = $derived(dateStart && dateEnd && totalCheckIns >= 0);
</script>

<form onsubmit={handleSubmit} class="manual-entry-form">
	<div class="form-header">
		<h3>Enter Check-In Summary</h3>
		<p class="form-description">
			Enter the key check-in data from the patient's report. You can estimate values if the exact
			numbers aren't available.
		</p>
	</div>

	{#if errors.length > 0}
		<div class="error-box" role="alert">
			<ul>
				{#each errors as error, i (i)}
					<li>{error}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="form-section">
		<h4>Date Range</h4>
		<div class="date-inputs">
			<div class="form-group">
				<label for="date-start">Start Date</label>
				<input
					type="date"
					id="date-start"
					bind:value={dateStart}
					max={dateEnd || undefined}
					required
				/>
			</div>
			<span class="date-separator">to</span>
			<div class="form-group">
				<label for="date-end">End Date</label>
				<input
					type="date"
					id="date-end"
					bind:value={dateEnd}
					min={dateStart || undefined}
					max={new Date().toISOString().split('T')[0]}
					required
				/>
			</div>
		</div>
	</div>

	<div class="form-section">
		<h4>Check-In Counts</h4>
		<div class="count-inputs">
			<div class="form-group">
				<label for="total-checkins">Total Check-Ins</label>
				<input type="number" id="total-checkins" bind:value={totalCheckIns} min="0" required />
			</div>
		</div>
	</div>

	<div class="form-section">
		<h4>Zone Distribution</h4>
		<p class="section-hint">How many check-ins were in each zone?</p>
		<div class="zone-inputs">
			<div class="zone-input green">
				<label for="green-count">
					<span class="zone-dot green"></span>
					Green
				</label>
				<input type="number" id="green-count" bind:value={greenCount} min="0" />
			</div>
			<div class="zone-input yellow">
				<label for="yellow-count">
					<span class="zone-dot yellow"></span>
					Yellow
				</label>
				<input type="number" id="yellow-count" bind:value={yellowCount} min="0" />
			</div>
			<div class="zone-input red">
				<label for="red-count">
					<span class="zone-dot red"></span>
					Red
				</label>
				<input type="number" id="red-count" bind:value={redCount} min="0" />
			</div>
		</div>
	</div>

	<div class="form-actions">
		{#if onCancel}
			<button type="button" class="btn btn-outline" onclick={handleCancel}>Cancel</button>
		{/if}
		<button type="submit" class="btn btn-primary" disabled={!canSubmit}>Save Summary</button>
	</div>
</form>

<style>
	.manual-entry-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.form-header h3 {
		margin: 0 0 var(--space-2) 0;
		font-size: var(--font-size-lg);
		color: var(--color-text);
	}

	.form-description {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.error-box {
		padding: var(--space-3);
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: var(--radius-md);
	}

	.error-box ul {
		margin: 0;
		padding: 0 0 0 var(--space-4);
		color: #dc2626;
		font-size: var(--font-size-sm);
	}

	.error-box li {
		margin-bottom: var(--space-1);
	}

	.error-box li:last-child {
		margin-bottom: 0;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.form-section h4 {
		margin: 0;
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text);
	}

	.section-hint {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.form-group label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text);
	}

	.form-group input {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.date-inputs {
		display: flex;
		align-items: flex-end;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.date-separator {
		padding-bottom: var(--space-2);
		color: var(--color-text-muted);
	}

	.count-inputs {
		max-width: 200px;
	}

	.zone-inputs {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.zone-input {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 100px;
	}

	.zone-input label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-sm);
		font-weight: 500;
	}

	.zone-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	.zone-dot.green {
		background-color: var(--color-primary);
	}

	.zone-dot.yellow {
		background-color: #eab308;
	}

	.zone-dot.red {
		background-color: #dc2626;
	}

	.zone-input input {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		width: 100%;
	}

	.zone-input input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.zone-input.green input:focus {
		border-color: var(--color-primary);
	}

	.zone-input.yellow input:focus {
		border-color: #eab308;
		box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.1);
	}

	.zone-input.red input:focus {
		border-color: #dc2626;
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-gray-200);
	}
</style>
