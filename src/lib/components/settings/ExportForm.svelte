<script lang="ts">
	import { generateA11yId } from '$lib/a11y';
	import { createFullBackup, generateBackupFilename, triggerDownload } from '$lib/crypto/backup';
	import { planPayload } from '$lib/stores/localPlan';

	type ExportState = 'form' | 'exporting' | 'success' | 'error';

	let exportState: ExportState = $state('form');
	let passphrase = $state('');
	let confirmPassphrase = $state('');
	let showPassphrase = $state(false);
	let showConfirmPassphrase = $state(false);
	let errorMessage = $state('');
	let passphraseError = $state('');
	let confirmError = $state('');

	const passphraseId = generateA11yId('passphrase');
	const confirmId = generateA11yId('confirm-passphrase');
	const passphraseErrorId = generateA11yId('passphrase-error');
	const confirmErrorId = generateA11yId('confirm-error');

	let planData = $derived($planPayload);

	function validatePassphrase(): boolean {
		let isValid = true;
		passphraseError = '';
		confirmError = '';

		if (!passphrase) {
			passphraseError = 'Please enter a passphrase';
			isValid = false;
		} else if (passphrase.length < 8) {
			passphraseError = 'Passphrase must be at least 8 characters';
			isValid = false;
		}

		if (!confirmPassphrase) {
			confirmError = 'Please confirm your passphrase';
			isValid = false;
		} else if (passphrase !== confirmPassphrase) {
			confirmError = 'Passphrases do not match';
			isValid = false;
		}

		return isValid;
	}

	async function handleExport() {
		if (!validatePassphrase()) {
			return;
		}

		exportState = 'exporting';
		errorMessage = '';

		try {
			const backupJson = await createFullBackup(passphrase);

			if (!backupJson) {
				throw new Error('No data to export. Please ensure you have an action plan installed.');
			}

			const filename = generateBackupFilename(planData?.patientNickname);
			triggerDownload(backupJson, filename);

			exportState = 'success';
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to create backup';
			exportState = 'error';
		}
	}

	function handleReset() {
		exportState = 'form';
		passphrase = '';
		confirmPassphrase = '';
		passphraseError = '';
		confirmError = '';
		errorMessage = '';
	}

	function togglePassphraseVisibility() {
		showPassphrase = !showPassphrase;
	}

	function toggleConfirmVisibility() {
		showConfirmPassphrase = !showConfirmPassphrase;
	}
</script>

<div class="export-form">
	{#if exportState === 'form'}
		<div class="form-header">
			<h2>Export Your Data</h2>
			<p class="description">
				Create an encrypted backup of your action plan, check-in history, and settings.
			</p>
		</div>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleExport();
			}}
		>
			<div class="form-group">
				<label for={passphraseId} class="form-label">
					Create a passphrase to protect your backup
				</label>
				<div class="password-input-wrapper">
					<input
						id={passphraseId}
						type={showPassphrase ? 'text' : 'password'}
						class="form-input"
						class:has-error={passphraseError}
						bind:value={passphrase}
						autocomplete="new-password"
						aria-describedby={passphraseError ? passphraseErrorId : undefined}
						aria-invalid={passphraseError ? 'true' : undefined}
					/>
					<button
						type="button"
						class="toggle-visibility"
						onclick={togglePassphraseVisibility}
						aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
					>
						{#if showPassphrase}
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<line
									x1="1"
									y1="1"
									x2="23"
									y2="23"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						{:else}
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<circle
									cx="12"
									cy="12"
									r="3"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						{/if}
					</button>
				</div>
				{#if passphraseError}
					<p id={passphraseErrorId} class="form-error" role="alert">{passphraseError}</p>
				{/if}
			</div>

			<div class="form-group">
				<label for={confirmId} class="form-label"> Confirm passphrase </label>
				<div class="password-input-wrapper">
					<input
						id={confirmId}
						type={showConfirmPassphrase ? 'text' : 'password'}
						class="form-input"
						class:has-error={confirmError}
						bind:value={confirmPassphrase}
						autocomplete="new-password"
						aria-describedby={confirmError ? confirmErrorId : undefined}
						aria-invalid={confirmError ? 'true' : undefined}
					/>
					<button
						type="button"
						class="toggle-visibility"
						onclick={toggleConfirmVisibility}
						aria-label={showConfirmPassphrase ? 'Hide confirmation' : 'Show confirmation'}
					>
						{#if showConfirmPassphrase}
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<line
									x1="1"
									y1="1"
									x2="23"
									y2="23"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						{:else}
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
								<circle
									cx="12"
									cy="12"
									r="3"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						{/if}
					</button>
				</div>
				{#if confirmError}
					<p id={confirmErrorId} class="form-error" role="alert">{confirmError}</p>
				{/if}
			</div>

			<div class="warning-box">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<p>Keep your passphrase safe. You'll need it to restore your data.</p>
			</div>

			<button type="submit" class="btn btn-primary btn-full"> Create Backup </button>
		</form>
	{:else if exportState === 'exporting'}
		<div class="status-screen">
			<div class="spinner" role="status" aria-label="Creating backup"></div>
			<p>Creating your encrypted backup...</p>
		</div>
	{:else if exportState === 'success'}
		<div class="status-screen success">
			<svg
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				class="success-icon"
				aria-hidden="true"
			>
				<path
					d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<polyline
					points="22 4 12 14.01 9 11.01"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<h2>Backup Created!</h2>
			<p>Your backup has been downloaded. Store it somewhere safe.</p>
			<a href="/app/settings" class="btn btn-primary">Done</a>
		</div>
	{:else if exportState === 'error'}
		<div class="status-screen error">
			<svg
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				class="error-icon"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
				<line
					x1="15"
					y1="9"
					x2="9"
					y2="15"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
				<line
					x1="9"
					y1="9"
					x2="15"
					y2="15"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
			<h2>Export Failed</h2>
			<p class="error-message">{errorMessage}</p>
			<button type="button" class="btn btn-primary" onclick={handleReset}>Try Again</button>
		</div>
	{/if}
</div>

<style>
	.export-form {
		max-width: 28rem;
		margin: 0 auto;
	}

	.form-header {
		text-align: center;
		margin-bottom: var(--space-6);
	}

	.form-header h2 {
		font-size: var(--font-size-xl);
		color: var(--color-gray-900);
		margin-bottom: var(--space-2);
	}

	.description {
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.form-group {
		margin-bottom: var(--space-4);
	}

	.form-label {
		display: block;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-gray-700);
		margin-bottom: var(--space-2);
	}

	.password-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.form-input {
		width: 100%;
		padding: var(--space-3);
		padding-right: var(--space-10);
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

	.toggle-visibility {
		position: absolute;
		right: var(--space-2);
		padding: var(--space-2);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-gray-500);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toggle-visibility:hover {
		color: var(--color-gray-700);
	}

	.toggle-visibility:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.form-error {
		color: #dc2626;
		font-size: var(--font-size-sm);
		margin-top: var(--space-1);
	}

	.warning-box {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-3);
		background-color: #fef3c7;
		border: 1px solid #f59e0b;
		border-radius: var(--radius-md);
		margin-bottom: var(--space-6);
		color: #92400e;
	}

	.warning-box svg {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.warning-box p {
		font-size: var(--font-size-sm);
		line-height: 1.5;
		margin: 0;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		font-size: var(--font-size-base);
		font-weight: 500;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease;
		text-decoration: none;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
		border: none;
	}

	.btn-primary:hover {
		background-color: var(--color-primary-dark);
	}

	.btn-primary:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.btn-full {
		width: 100%;
	}

	.status-screen {
		text-align: center;
		padding: var(--space-8) var(--space-4);
	}

	.status-screen h2 {
		font-size: var(--font-size-xl);
		color: var(--color-gray-900);
		margin-bottom: var(--space-2);
	}

	.status-screen p {
		color: var(--color-text-muted);
		margin-bottom: var(--space-6);
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid var(--color-gray-200);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		margin: 0 auto var(--space-4);
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.success-icon {
		color: #16a34a;
		margin-bottom: var(--space-4);
	}

	.error-icon {
		color: #dc2626;
		margin-bottom: var(--space-4);
	}

	.error-message {
		color: #dc2626;
	}

	.success h2 {
		color: #16a34a;
	}

	.error h2 {
		color: #dc2626;
	}
</style>
