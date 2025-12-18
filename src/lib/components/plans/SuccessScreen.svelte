<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';

	interface Props {
		token: string;
		patientNickname?: string;
		onDone: () => void;
		onViewPlan: () => void;
	}

	let { token, patientNickname, onDone, onViewPlan }: Props = $props();

	let qrCodeDataUrl = $state<string>('');
	let copySuccess = $state(false);
	let qrError = $state<string | null>(null);

	// Construct the token URL
	const tokenUrl = $derived(
		`${typeof window !== 'undefined' ? window.location.origin : ''}/access/${token}`
	);

	// Generate QR code on mount
	onMount(async () => {
		try {
			qrCodeDataUrl = await QRCode.toDataURL(tokenUrl, {
				width: 256,
				margin: 2,
				color: {
					dark: '#00594C',
					light: '#FFFFFF'
				},
				errorCorrectionLevel: 'M'
			});
		} catch {
			qrError = 'Failed to generate QR code';
		}
	});

	// Copy link to clipboard
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(tokenUrl);
			copySuccess = true;
			// Reset the success message after 2 seconds
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch {
			// Fallback for browsers that don't support clipboard API
			const textArea = document.createElement('textarea');
			textArea.value = tokenUrl;
			textArea.style.position = 'fixed';
			textArea.style.left = '-9999px';
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				copySuccess = true;
				setTimeout(() => {
					copySuccess = false;
				}, 2000);
			} catch {
				// Silent fail
			}
			document.body.removeChild(textArea);
		}
	}
</script>

<div class="success-screen">
	<div class="success-header">
		<div class="success-icon">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
				/>
			</svg>
		</div>
		<h2>Action Plan Created!</h2>
		{#if patientNickname}
			<p class="success-subtitle">
				The action plan for <strong>{patientNickname}</strong> has been saved successfully.
			</p>
		{:else}
			<p class="success-subtitle">The action plan has been saved successfully.</p>
		{/if}
	</div>

	<div class="token-section">
		<h3>Share with Patient</h3>
		<p class="token-instructions">
			Have your patient scan this QR code or enter the link on their device to access their action
			plan.
		</p>

		<div class="qr-container" role="img" aria-label="QR code for action plan access">
			{#if qrCodeDataUrl}
				<img src={qrCodeDataUrl} alt="QR code to access action plan" class="qr-code" />
			{:else if qrError}
				<div class="qr-error">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
						/>
					</svg>
					<span>{qrError}</span>
				</div>
			{:else}
				<div class="qr-loading">
					<span class="spinner" aria-hidden="true"></span>
					<span>Generating QR code...</span>
				</div>
			{/if}
		</div>

		<div class="token-url-container">
			<label for="token-url" class="sr-only">Action plan access URL</label>
			<input
				id="token-url"
				type="text"
				readonly
				value={tokenUrl}
				class="token-url-input"
				onclick={(e) => e.currentTarget.select()}
			/>
			<button
				type="button"
				class="copy-btn"
				onclick={copyLink}
				aria-label={copySuccess ? 'Link copied!' : 'Copy link to clipboard'}
			>
				{#if copySuccess}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="copy-icon"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
					</svg>
					Copied!
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="copy-icon"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
						/>
					</svg>
					Copy Link
				{/if}
			</button>
		</div>

		<div class="access-code-display">
			<span class="access-code-label">Access Code:</span>
			<span class="access-code">{token}</span>
		</div>

		<p class="expiry-note">This access link will expire in 7 days.</p>
	</div>

	<div class="success-actions">
		<button type="button" class="btn btn-outline" onclick={onViewPlan}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="btn-icon"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
				/>
			</svg>
			View Action Plan
		</button>
		<button type="button" class="btn btn-primary" onclick={onDone}>
			Done
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="btn-icon"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
			</svg>
		</button>
	</div>
</div>

<style>
	.success-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-8);
		padding: var(--space-4);
	}

	.success-header {
		text-align: center;
	}

	.success-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		background-color: rgba(0, 89, 76, 0.1);
		border-radius: 50%;
		margin-bottom: var(--space-4);
	}

	.success-icon svg {
		width: 2.5rem;
		height: 2.5rem;
		color: var(--color-primary);
	}

	.success-header h2 {
		margin-bottom: var(--space-2);
		color: var(--color-primary);
	}

	.success-subtitle {
		color: var(--color-text-muted);
		font-size: var(--font-size-base);
		margin: 0;
	}

	.token-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		width: 100%;
		max-width: 28rem;
		padding: var(--space-6);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-xl);
	}

	.token-section h3 {
		margin: 0;
		font-size: var(--font-size-lg);
	}

	.token-instructions {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.qr-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16rem;
		height: 16rem;
		background-color: var(--color-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		padding: var(--space-4);
	}

	.qr-code {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.qr-loading,
	.qr-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	.qr-error svg {
		width: 2rem;
		height: 2rem;
		color: var(--color-error, #ef4444);
	}

	.spinner {
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid var(--color-gray-300);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.75s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.token-url-container {
		display: flex;
		width: 100%;
		gap: var(--space-2);
	}

	.token-url-input {
		flex: 1;
		padding: var(--space-3);
		font-family: monospace;
		font-size: var(--font-size-sm);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		background-color: var(--color-white);
		color: var(--color-text);
	}

	.token-url-input:focus {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.copy-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		font-weight: 500;
		font-size: var(--font-size-sm);
		color: var(--color-primary);
		background: var(--color-white);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
		white-space: nowrap;
	}

	.copy-btn:hover {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.copy-btn:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.copy-icon {
		width: 1rem;
		height: 1rem;
	}

	.access-code-display {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background-color: var(--color-white);
		border-radius: var(--radius-md);
	}

	.access-code-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.access-code {
		font-family: monospace;
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-primary);
		letter-spacing: 0.1em;
	}

	.expiry-note {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin: 0;
	}

	.success-actions {
		display: flex;
		gap: var(--space-4);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-6);
		font-weight: 500;
		font-size: var(--font-size-base);
		border-radius: var(--radius-md);
		border: none;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease;
		cursor: pointer;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover {
		background-color: #004a3f;
	}

	.btn-primary:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-text);
		border: 2px solid var(--color-gray-300);
	}

	.btn-outline:hover {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.btn-outline:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-icon {
		width: 1rem;
		height: 1rem;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	@media (max-width: 640px) {
		.token-url-container {
			flex-direction: column;
		}

		.success-actions {
			flex-direction: column;
			width: 100%;
		}

		.btn {
			width: 100%;
		}
	}

	@media (pointer: coarse) {
		.btn,
		.copy-btn {
			min-height: 44px;
		}
	}
</style>
