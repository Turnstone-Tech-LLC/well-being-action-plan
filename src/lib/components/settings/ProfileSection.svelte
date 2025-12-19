<script lang="ts">
	import { generateA11yId } from '$lib/a11y';
	import { patientProfileStore } from '$lib/stores/patientProfile';
	import { toastStore } from '$lib/stores/toast';

	interface Props {
		displayName: string;
		actionPlanId: string;
	}

	let { displayName, actionPlanId }: Props = $props();

	let isEditing = $state(false);
	let editedName = $state(displayName);
	let isSaving = $state(false);
	let inputError = $state('');

	const inputId = generateA11yId('display-name');
	const errorId = generateA11yId('display-name-error');

	function startEditing() {
		editedName = displayName;
		inputError = '';
		isEditing = true;
	}

	function cancelEditing() {
		editedName = displayName;
		inputError = '';
		isEditing = false;
	}

	function validateName(name: string): string {
		const trimmed = name.trim();
		if (!trimmed) {
			return 'Please enter a display name';
		}
		if (trimmed.length < 2) {
			return 'Name must be at least 2 characters';
		}
		if (trimmed.length > 50) {
			return 'Name must be 50 characters or less';
		}
		return '';
	}

	async function handleSave() {
		const error = validateName(editedName);
		if (error) {
			inputError = error;
			return;
		}

		isSaving = true;
		inputError = '';

		try {
			await patientProfileStore.updateDisplayName(actionPlanId, editedName.trim());
			toastStore.success('Display name updated');
			isEditing = false;
		} catch {
			toastStore.error('Failed to update display name');
		} finally {
			isSaving = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSave();
		} else if (event.key === 'Escape') {
			cancelEditing();
		}
	}
</script>

<section class="settings-section" aria-labelledby="profile-heading">
	<h2 id="profile-heading">Profile</h2>

	<div class="setting-card">
		{#if isEditing}
			<div class="edit-form">
				<label for={inputId} class="form-label">Display Name</label>
				<div class="input-row">
					<input
						id={inputId}
						type="text"
						class="form-input"
						class:has-error={inputError}
						bind:value={editedName}
						onkeydown={handleKeyDown}
						aria-describedby={inputError ? errorId : undefined}
						aria-invalid={inputError ? 'true' : undefined}
						disabled={isSaving}
					/>
					<div class="button-row">
						<button
							type="button"
							class="btn btn-outline btn-sm"
							onclick={cancelEditing}
							disabled={isSaving}
						>
							Cancel
						</button>
						<button
							type="button"
							class="btn btn-primary btn-sm"
							onclick={handleSave}
							disabled={isSaving}
						>
							{#if isSaving}
								Saving...
							{:else}
								Save
							{/if}
						</button>
					</div>
				</div>
				{#if inputError}
					<p id={errorId} class="form-error" role="alert">{inputError}</p>
				{/if}
			</div>
		{:else}
			<div class="setting-display">
				<div class="setting-info">
					<span class="setting-label">Display Name</span>
					<span class="setting-value">{displayName || 'Not set'}</span>
				</div>
				<button type="button" class="btn btn-outline btn-sm" onclick={startEditing}>Edit</button>
			</div>
		{/if}
	</div>
</section>

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
	}

	.setting-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.setting-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.setting-value {
		font-size: var(--font-size-base);
		color: var(--color-gray-800);
		font-weight: 500;
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.input-row {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
	}

	.form-input {
		flex: 1;
		padding: var(--space-2) var(--space-3);
		font-size: var(--font-size-base);
		border: 2px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.form-input.has-error {
		border-color: #dc2626;
	}

	.form-input:disabled {
		background-color: var(--color-gray-100);
		cursor: not-allowed;
	}

	.button-row {
		display: flex;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.btn-sm {
		padding: var(--space-2) var(--space-3);
		font-size: var(--font-size-sm);
	}

	.form-error {
		color: #dc2626;
		font-size: var(--font-size-sm);
		margin: 0;
	}

	@media (max-width: 480px) {
		.input-row {
			flex-direction: column;
		}

		.form-input {
			width: 100%;
		}

		.button-row {
			width: 100%;
			justify-content: flex-end;
		}
	}
</style>
