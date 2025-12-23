<script lang="ts">
	interface Props {
		revisionNotes?: string | null;
		onUpdate: () => void;
		onDismiss: () => void;
	}

	let { revisionNotes, onUpdate, onDismiss }: Props = $props();
</script>

<div class="update-banner" role="alert" aria-live="polite">
	<div class="banner-content">
		<div class="banner-icon">
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
					d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
				/>
			</svg>
		</div>
		<div class="banner-text">
			<p class="banner-title">Your provider updated your action plan</p>
			{#if revisionNotes}
				<p class="banner-notes">{revisionNotes}</p>
			{/if}
		</div>
	</div>
	<div class="banner-actions">
		<button type="button" class="btn btn-primary" onclick={onUpdate}> Update Now </button>
		<button type="button" class="btn btn-text" onclick={onDismiss}> Later </button>
	</div>
</div>

<style>
	.update-banner {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: var(--color-white);
		border-top: 3px solid var(--color-primary);
		box-shadow:
			0 -4px 6px -1px rgba(0, 0, 0, 0.1),
			0 -2px 4px -1px rgba(0, 0, 0, 0.06);
		padding: var(--space-4);
		z-index: 100;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.banner-content {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.banner-icon {
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 89, 76, 0.1);
		border-radius: 50%;
		color: var(--color-primary);
	}

	.banner-icon svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.banner-text {
		flex: 1;
	}

	.banner-title {
		margin: 0;
		font-weight: 600;
		color: var(--color-text);
	}

	.banner-notes {
		margin: var(--space-1) 0 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.banner-actions {
		display: flex;
		gap: var(--space-3);
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		font-weight: 500;
		font-size: var(--font-size-sm);
		border-radius: var(--radius-md);
		border: none;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover {
		background-color: var(--color-primary-dark, #004a3f);
	}

	.btn-text {
		background-color: transparent;
		color: var(--color-text-muted);
	}

	.btn-text:hover {
		color: var(--color-text);
		background-color: var(--color-gray-100);
	}

	@media (min-width: 640px) {
		.update-banner {
			bottom: var(--space-4);
			left: 50%;
			right: auto;
			transform: translateX(-50%);
			max-width: 32rem;
			border-radius: var(--radius-xl);
			border: 1px solid var(--color-gray-200);
			border-top: 3px solid var(--color-primary);
		}

		@keyframes slideUp {
			from {
				transform: translateX(-50%) translateY(calc(100% + var(--space-4)));
			}
			to {
				transform: translateX(-50%) translateY(0);
			}
		}
	}

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
			padding: var(--space-3) var(--space-4);
		}
	}
</style>
