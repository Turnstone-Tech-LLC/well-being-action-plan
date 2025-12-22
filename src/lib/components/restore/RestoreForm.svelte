<script lang="ts">
	import { restoreBackup, isValidBackupFile, BACKUP_FILE_EXTENSION } from '$lib/crypto/backup';
	import { generateDeviceInstallId } from '$lib/db/index';
	import { saveLocalPlan } from '$lib/db/plans';
	import { restorePatientProfile } from '$lib/db/profile';
	import { restoreCheckIns } from '$lib/db/checkIns';
	import { goto } from '$app/navigation';
	import RestoreError from './RestoreError.svelte';
	import {
		detectRestoreErrorType,
		INLINE_PASSPHRASE_ERROR,
		type RestoreErrorType
	} from '$lib/restore/errors';

	type RestoreState = 'idle' | 'restoring' | 'success' | 'error';

	// Threshold for switching from inline error to full error state
	const MAX_INLINE_FAILURES = 2;

	let restoreState = $state<RestoreState>('idle');
	let errorMessage = $state('');
	let selectedFile: File | null = $state(null);
	let passphrase = $state('');
	let showPassphrase = $state(false);
	let isDragOver = $state(false);
	let fileInputRef: HTMLInputElement | null = $state(null);
	let failureCount = $state(0);
	let errorType = $state<RestoreErrorType>('unknown');

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			validateAndSetFile(file);
		}
	}

	function validateAndSetFile(file: File) {
		if (!isValidBackupFile(file.name)) {
			errorMessage = `Please select a valid backup file (${BACKUP_FILE_EXTENSION} or .json)`;
			selectedFile = null;
			return;
		}
		selectedFile = file;
		errorMessage = '';
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;

		const file = event.dataTransfer?.files?.[0];
		if (file) {
			validateAndSetFile(file);
		}
	}

	function clearFile() {
		selectedFile = null;
		errorMessage = '';
		if (fileInputRef) {
			fileInputRef.value = '';
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!selectedFile || !passphrase.trim()) {
			return;
		}

		restoreState = 'restoring';
		errorMessage = '';

		try {
			const fileContent = await selectedFile.text();
			const { plan, profile, checkIns } = await restoreBackup(fileContent, passphrase);

			// Generate a new device install ID for this restore
			const deviceInstallId = generateDeviceInstallId();

			// Save the plan
			await saveLocalPlan({
				actionPlanId: plan.actionPlanId,
				revisionId: plan.revisionId,
				revisionVersion: plan.revisionVersion,
				accessCode: plan.accessCode,
				planPayload: plan.planPayload,
				deviceInstallId
			});

			// Restore the patient profile if present
			if (profile) {
				await restorePatientProfile({
					actionPlanId: profile.actionPlanId,
					displayName: profile.displayName,
					onboardingComplete: profile.onboardingComplete,
					notificationsEnabled: profile.notificationsEnabled,
					notificationFrequency: profile.notificationFrequency,
					notificationTime: profile.notificationTime,
					lastReminderShown: profile.lastReminderShown
				});
			}

			// Restore check-ins if present
			if (checkIns && checkIns.length > 0) {
				await restoreCheckIns(
					plan.actionPlanId,
					checkIns.map((checkIn) => ({
						actionPlanId: checkIn.actionPlanId,
						zone: checkIn.zone,
						strategiesUsed: checkIn.strategiesUsed,
						supportiveAdultsContacted: checkIn.supportiveAdultsContacted,
						helpMethodsSelected: checkIn.helpMethodsSelected,
						notes: checkIn.notes,
						createdAt: checkIn.createdAt
					}))
				);
			}

			restoreState = 'success';
			failureCount = 0;

			// Redirect to the app after brief success message
			// The /app layout will initialize the stores from IndexedDB
			setTimeout(() => {
				goto('/app');
			}, 1500);
		} catch (err) {
			handleRestoreError(err);
		}
	}

	function handleRestoreError(error: unknown) {
		const detectedType = detectRestoreErrorType(error);
		failureCount++;

		// For passphrase errors with fewer than MAX_INLINE_FAILURES, show inline error
		if (detectedType === 'wrong_passphrase' && failureCount < MAX_INLINE_FAILURES) {
			errorMessage = INLINE_PASSPHRASE_ERROR;
			restoreState = 'idle';
			return;
		}

		// Show full error state for other errors or after multiple failures
		errorType = detectedType;
		restoreState = 'error';
		errorMessage = '';
	}

	function handleTryAgain() {
		// Reset form state without page reload
		restoreState = 'idle';
		selectedFile = null;
		passphrase = '';
		failureCount = 0;
		errorMessage = '';
		errorType = 'unknown';
		if (fileInputRef) {
			fileInputRef.value = '';
		}
	}

	function handleReturnHome() {
		goto('/');
	}

	function togglePassphraseVisibility() {
		showPassphrase = !showPassphrase;
	}

	const canSubmit = $derived(
		selectedFile !== null && passphrase.trim().length > 0 && restoreState !== 'restoring'
	);
</script>

{#if restoreState === 'error'}
	<RestoreError {errorType} onTryAgain={handleTryAgain} onReturnHome={handleReturnHome} />
{:else if restoreState === 'success'}
	<div class="success-message" role="status" aria-live="polite">
		<div class="success-icon">
			<svg
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
				<polyline points="22 4 12 14.01 9 11.01" />
			</svg>
		</div>
		<h2>Plan Restored Successfully</h2>
		<p>Taking you to your plan...</p>
	</div>
{:else}
	<form onsubmit={handleSubmit} class="restore-form" aria-label="Restore backup">
		<!-- File Upload Area -->
		<div
			class="upload-area"
			class:drag-over={isDragOver}
			class:has-file={selectedFile !== null}
			role="region"
			aria-label="File upload drop zone"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			{#if selectedFile}
				<div class="selected-file">
					<div class="file-icon">
						<svg
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="16" y1="13" x2="8" y2="13" />
							<line x1="16" y1="17" x2="8" y2="17" />
							<polyline points="10 9 9 9 8 9" />
						</svg>
					</div>
					<span class="file-name">{selectedFile.name}</span>
					<button type="button" class="clear-file" onclick={clearFile} aria-label="Remove file">
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
			{:else}
				<div class="upload-icon" aria-hidden="true">
					<svg
						width="48"
						height="48"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="17 8 12 3 7 8" />
						<line x1="12" y1="3" x2="12" y2="15" />
					</svg>
				</div>
				<p class="upload-text" id="upload-instructions">Drag and drop your backup file here, or</p>
				<label class="btn btn-outline file-select-btn">
					<span>Choose File</span>
					<input
						bind:this={fileInputRef}
						type="file"
						accept=".wbap,.json"
						class="visually-hidden"
						onchange={handleFileSelect}
						aria-describedby="upload-instructions"
					/>
				</label>
			{/if}
		</div>

		<!-- Passphrase Input -->
		<div class="form-group">
			<label for="passphrase">Recovery Passphrase</label>
			<div class="passphrase-input-wrapper">
				<input
					type={showPassphrase ? 'text' : 'password'}
					id="passphrase"
					bind:value={passphrase}
					placeholder="Enter your recovery passphrase"
					autocomplete="off"
					disabled={restoreState === 'restoring'}
					aria-describedby="passphrase-help{errorMessage ? ' passphrase-error' : ''}"
					aria-invalid={errorMessage ? 'true' : undefined}
					required
				/>
				<button
					type="button"
					class="toggle-visibility"
					onclick={togglePassphraseVisibility}
					aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
				>
					{#if showPassphrase}
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
							/>
							<line x1="1" y1="1" x2="23" y2="23" />
						</svg>
					{:else}
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
					{/if}
				</button>
			</div>
			<p id="passphrase-help" class="helper-text">
				This is the passphrase you created when you made your backup. Take your time - there's no
				rush.
			</p>
		</div>

		<!-- Error Message -->
		{#if errorMessage}
			<div id="passphrase-error" class="error-message" role="alert" aria-live="assertive">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
				<span>{errorMessage}</span>
			</div>
		{/if}

		<!-- Submit Button -->
		<button
			type="submit"
			class="btn btn-primary submit-btn"
			disabled={!canSubmit}
			aria-busy={restoreState === 'restoring'}
		>
			{#if restoreState === 'restoring'}
				<span class="spinner" aria-hidden="true"></span>
				Restoring...
			{:else}
				Restore My Plan
			{/if}
		</button>
	</form>
{/if}

<style>
	.restore-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.upload-area {
		border: 2px dashed var(--color-gray-300);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		text-align: center;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	.upload-area:has(.file-select-btn:focus-within) {
		border-color: var(--color-primary);
		background-color: var(--color-bg-subtle);
	}

	.upload-area.drag-over {
		border-color: var(--color-primary);
		background-color: rgba(0, 89, 76, 0.05);
	}

	.upload-area.has-file {
		border-style: solid;
		background-color: var(--color-bg-subtle);
	}

	.upload-icon {
		color: var(--color-gray-400);
		margin-bottom: var(--space-4);
	}

	.upload-text {
		color: var(--color-text-muted);
		margin-bottom: var(--space-4);
	}

	.file-select-btn {
		cursor: pointer;
	}

	.selected-file {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
	}

	.file-icon {
		color: var(--color-primary);
	}

	.file-name {
		font-weight: 500;
		color: var(--color-text);
		word-break: break-all;
	}

	.clear-file {
		background: none;
		border: none;
		padding: var(--space-1);
		cursor: pointer;
		color: var(--color-text-muted);
		border-radius: var(--radius-sm);
		transition:
			color 0.15s ease,
			background-color 0.15s ease;
	}

	.clear-file:hover {
		color: var(--color-text);
		background-color: var(--color-gray-200);
	}

	.form-group {
		text-align: left;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		margin-bottom: var(--space-2);
		color: var(--color-text);
	}

	.passphrase-input-wrapper {
		position: relative;
		display: flex;
	}

	.passphrase-input-wrapper input {
		flex: 1;
		padding: var(--space-3);
		padding-right: var(--space-12);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
	}

	.passphrase-input-wrapper input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.passphrase-input-wrapper input:disabled {
		background-color: var(--color-bg-subtle);
		cursor: not-allowed;
	}

	.toggle-visibility {
		position: absolute;
		right: var(--space-2);
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		padding: var(--space-2);
		cursor: pointer;
		color: var(--color-text-muted);
		border-radius: var(--radius-sm);
		transition: color 0.15s ease;
	}

	.toggle-visibility:hover {
		color: var(--color-text);
	}

	.helper-text {
		margin-top: var(--space-2);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.error-message {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		padding: var(--space-3);
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: var(--radius-md);
		color: #dc2626;
		font-size: var(--font-size-sm);
	}

	.error-message svg {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.submit-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.success-message {
		text-align: center;
		padding: var(--space-8);
	}

	.success-icon {
		color: var(--color-primary);
		margin-bottom: var(--space-4);
	}

	.success-message h2 {
		color: var(--color-primary);
		margin-bottom: var(--space-2);
	}

	.success-message p {
		color: var(--color-text-muted);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
