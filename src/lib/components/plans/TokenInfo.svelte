<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import type { InstallToken } from '$lib/server/types';
	import { createFocusTrap, type FocusTrap } from '$lib/a11y/focus-trap';

	interface Props {
		token: InstallToken;
	}

	let { token }: Props = $props();

	let qrCodeDataUrl = $state<string>('');
	let copySuccess = $state(false);
	let qrError = $state<string | null>(null);
	let showQRModal = $state(false);
	let modalContentEl = $state<HTMLElement | null>(null);
	let focusTrap: FocusTrap | null = null;

	// Construct the token URL
	const tokenUrl = $derived(
		`${typeof window !== 'undefined' ? window.location.origin : ''}/access/${token.token}`
	);

	// Calculate expiration info
	const expiresAt = $derived(new Date(token.expires_at));
	const isExpired = $derived(expiresAt < new Date());
	const daysUntilExpiry = $derived(() => {
		const now = new Date();
		const diff = expiresAt.getTime() - now.getTime();
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
	});

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

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function closeModal() {
		showQRModal = false;
	}

	// Manage focus trap when modal opens/closes
	$effect(() => {
		if (showQRModal && modalContentEl) {
			focusTrap = createFocusTrap(modalContentEl, {
				onEscape: closeModal
			});
			focusTrap.activate();
		}

		return () => {
			if (focusTrap) {
				focusTrap.deactivate();
				focusTrap = null;
			}
		};
	});
</script>

<section class="token-info-section" aria-labelledby="token-heading">
	<header class="section-header">
		<div class="header-content">
			<h2 id="token-heading">Access Link</h2>
			<span class="status-indicator" class:expired={isExpired}>
				{#if isExpired}
					<span class="status-dot expired"></span>
					Expired
				{:else}
					<span class="status-dot active"></span>
					Active
				{/if}
			</span>
		</div>
		{#if !isExpired}
			<p class="expiry-info">
				Expires {formatDate(token.expires_at)}
				<span class="days-remaining"
					>({daysUntilExpiry()} day{daysUntilExpiry() === 1 ? '' : 's'} remaining)</span
				>
			</p>
		{/if}
	</header>

	<div class="section-content">
		<div class="token-display-row">
			<!-- QR Code Preview -->
			<button
				type="button"
				class="qr-preview"
				onclick={() => (showQRModal = true)}
				aria-label="Click to enlarge QR code"
			>
				{#if qrCodeDataUrl}
					<img src={qrCodeDataUrl} alt="QR code for action plan access" class="qr-thumbnail" />
					<span class="qr-overlay">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="expand-icon"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
							/>
						</svg>
					</span>
				{:else if qrError}
					<span class="qr-error-small">QR Error</span>
				{:else}
					<span class="qr-loading-small">
						<span class="spinner-small" aria-hidden="true"></span>
					</span>
				{/if}
			</button>

			<!-- URL and Actions -->
			<div class="url-section">
				<div class="url-container">
					<label for="access-url" class="sr-only">Action plan access URL</label>
					<input
						id="access-url"
						type="text"
						readonly
						value={tokenUrl}
						class="url-input"
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
							<span class="btn-text">Copied!</span>
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
							<span class="btn-text">Copy</span>
						{/if}
					</button>
				</div>

				<div class="access-code-row">
					<span class="access-code-label">Access Code:</span>
					<code class="access-code">{token.token}</code>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- QR Code Modal -->
{#if showQRModal}
	<div class="modal-backdrop">
		<!-- Backdrop click handler as a separate invisible button for a11y -->
		<button
			type="button"
			class="modal-backdrop-close"
			onclick={closeModal}
			aria-label="Close modal"
			tabindex="-1"
		></button>
		<div
			bind:this={modalContentEl}
			class="modal-content"
			role="dialog"
			aria-modal="true"
			aria-labelledby="qr-modal-title"
		>
			<header class="modal-header">
				<h3 id="qr-modal-title">Scan QR Code</h3>
				<button type="button" class="modal-close" onclick={closeModal} aria-label="Close modal">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			</header>
			<div class="modal-body">
				{#if qrCodeDataUrl}
					<img src={qrCodeDataUrl} alt="QR code to access action plan" class="qr-large" />
				{/if}
				<p class="modal-instructions">
					Have the patient scan this QR code with their device's camera to access their action plan.
				</p>
			</div>
		</div>
	</div>
{/if}

<style>
	.token-info-section {
		background-color: var(--color-white);
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		border: 2px solid var(--color-primary);
	}

	.section-header {
		padding: var(--space-4) var(--space-5);
		background: linear-gradient(135deg, rgba(0, 89, 76, 0.05) 0%, rgba(0, 89, 76, 0.1) 100%);
		border-bottom: 1px solid rgba(0, 89, 76, 0.2);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.section-header h2 {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-primary);
	}

	.status-indicator {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: #166534;
	}

	.status-indicator.expired {
		color: #b91c1c;
	}

	.status-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
	}

	.status-dot.active {
		background-color: #22c55e;
	}

	.status-dot.expired {
		background-color: #ef4444;
	}

	.expiry-info {
		margin: var(--space-1) 0 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.days-remaining {
		color: var(--color-primary);
		font-weight: 500;
	}

	.section-content {
		padding: var(--space-5);
	}

	.token-display-row {
		display: flex;
		gap: var(--space-4);
		align-items: flex-start;
	}

	.qr-preview {
		position: relative;
		width: 100px;
		height: 100px;
		flex-shrink: 0;
		padding: var(--space-2);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.qr-preview:hover {
		border-color: var(--color-primary);
		box-shadow: var(--shadow-md);
	}

	.qr-preview:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.qr-thumbnail {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.qr-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 89, 76, 0.8);
		border-radius: var(--radius-lg);
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.qr-preview:hover .qr-overlay {
		opacity: 1;
	}

	.expand-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: var(--color-white);
	}

	.qr-error-small,
	.qr-loading-small {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.spinner-small {
		width: 1rem;
		height: 1rem;
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

	.url-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.url-container {
		display: flex;
		gap: var(--space-2);
	}

	.url-input {
		flex: 1;
		padding: var(--space-2) var(--space-3);
		font-family: monospace;
		font-size: var(--font-size-sm);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		background-color: var(--color-gray-50);
		color: var(--color-text);
	}

	.url-input:focus {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.copy-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
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

	.access-code-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.access-code-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.access-code {
		font-family: monospace;
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-primary);
		letter-spacing: 0.05em;
		background-color: var(--color-gray-100);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
	}

	/* Modal styles */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		padding: var(--space-4);
	}

	.modal-backdrop-close {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
	}

	.modal-content {
		position: relative;
		background-color: var(--color-white);
		border-radius: var(--radius-xl);
		max-width: 24rem;
		width: 100%;
		box-shadow: var(--shadow-lg);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.modal-header h3 {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
	}

	.modal-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		color: var(--color-text-muted);
		transition: color 0.15s ease;
	}

	.modal-close:hover {
		color: var(--color-text);
	}

	.modal-close:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.modal-close svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.modal-body {
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.qr-large {
		width: 16rem;
		height: 16rem;
		object-fit: contain;
	}

	.modal-instructions {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
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
		.token-display-row {
			flex-direction: column;
		}

		.qr-preview {
			width: 120px;
			height: 120px;
			align-self: center;
		}

		.url-container {
			flex-direction: column;
		}

		.btn-text {
			display: inline;
		}
	}

	@media print {
		.token-info-section {
			border: 1px solid var(--color-gray-200);
			box-shadow: none;
		}

		.qr-preview {
			border: none;
		}

		.qr-overlay {
			display: none;
		}

		.copy-btn {
			display: none;
		}
	}
</style>
