<script lang="ts">
	import { ClearDataModal } from '$lib/components/modals';
	import { goto } from '$app/navigation';
	import { clearAllData } from '$lib/db';
	import { localPlanStore } from '$lib/stores/localPlan';
	import { patientProfileStore } from '$lib/stores/patientProfile';
	import { toastStore } from '$lib/stores/toast';

	let showClearModal = $state(false);
	let isClearing = $state(false);

	function handleExportClick() {
		// Export flow is handled in a separate issue
		toastStore.info('Export feature coming soon');
	}

	function handleClearClick() {
		showClearModal = true;
	}

	function handleCancelClear() {
		showClearModal = false;
	}

	async function handleConfirmClear() {
		isClearing = true;
		try {
			await clearAllData();
			localPlanStore.reset();
			patientProfileStore.reset();
			toastStore.success('All data cleared');
			showClearModal = false;
			// Navigate to home page
			goto('/');
		} catch {
			toastStore.error('Failed to clear data');
		} finally {
			isClearing = false;
		}
	}
</script>

<section class="settings-section" aria-labelledby="data-heading">
	<h2 id="data-heading">Data Management</h2>

	<div class="setting-card">
		<div class="data-option">
			<div class="option-info">
				<span class="option-label">Export My Data</span>
				<span class="option-description">Download a copy of all your check-ins and settings</span>
			</div>
			<button type="button" class="btn btn-outline" onclick={handleExportClick}>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
						d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<polyline
						points="7 10 12 15 17 10"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<line
						x1="12"
						y1="15"
						x2="12"
						y2="3"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				Export
			</button>
		</div>
	</div>

	<div class="setting-card">
		<div class="data-option">
			<div class="option-info">
				<span class="option-label">Clear All Data</span>
				<span class="option-description">Remove your action plan from this device</span>
			</div>
			<button
				type="button"
				class="btn btn-destructive"
				onclick={handleClearClick}
				disabled={isClearing}
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<polyline
						points="3 6 5 6 21 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				{isClearing ? 'Clearing...' : 'Clear'}
			</button>
		</div>
	</div>

	<p class="data-note">Your data is stored only on this device and is never sent to any server.</p>
</section>

<ClearDataModal open={showClearModal} onConfirm={handleConfirmClear} onCancel={handleCancelClear} />

<style>
	.settings-section {
		margin-bottom: var(--space-6);
	}

	.settings-section h2 {
		font-size: var(--font-size-lg);
		color: var(--color-gray-700);
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.setting-card {
		padding: var(--space-4);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-2);
	}

	.data-option {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
	}

	.option-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.option-label {
		font-size: var(--font-size-base);
		color: var(--color-gray-800);
		font-weight: 500;
	}

	.option-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.btn-destructive {
		background-color: #dc2626;
		color: var(--color-white);
	}

	.btn-destructive:hover {
		background-color: #b91c1c;
	}

	.btn-destructive:focus-visible {
		outline-color: var(--color-white);
		box-shadow: 0 0 0 3px #dc2626;
	}

	.btn-destructive:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.data-note {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		text-align: center;
		margin-top: var(--space-4);
	}

	@media (max-width: 480px) {
		.data-option {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-3);
		}

		.btn {
			justify-content: center;
		}
	}
</style>
