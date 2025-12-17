<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createFocusTrap, type FocusTrap } from '$lib/a11y';

	interface Props {
		open: boolean;
		methodTitle: string;
		error: string | null;
		isDeleting: boolean;
		onCancel: () => void;
		children: Snippet;
	}

	let { open, methodTitle, error, isDeleting, onCancel, children }: Props = $props();

	let modalElement: HTMLElement | null = $state(null);
	let focusTrap: FocusTrap | null = $state(null);

	// Manage focus trap when modal opens/closes
	$effect(() => {
		if (open && modalElement) {
			focusTrap = createFocusTrap(modalElement, {
				onEscape: onCancel
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

	function handleBackdropClick(event: MouseEvent) {
		// Only close if clicking directly on backdrop, not on modal content
		if (event.target === event.currentTarget && !isDeleting) {
			onCancel();
		}
	}

	function handleBackdropKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !isDeleting) {
			onCancel();
		}
	}
</script>

{#if open}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeyDown}
		role="presentation"
	>
		<div
			bind:this={modalElement}
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-modal-title"
			aria-describedby="delete-modal-description"
		>
			<h2 id="delete-modal-title">Delete help method?</h2>
			<p id="delete-modal-description" class="modal-body">
				Are you sure you want to delete "<strong>{methodTitle}</strong>"? This action cannot be
				undone.
			</p>

			{#if error}
				<div class="error-message" role="alert">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="error-icon"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
						/>
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			<div class="modal-actions">
				<button type="button" class="btn btn-outline" onclick={onCancel} disabled={isDeleting}>
					Cancel
				</button>
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		z-index: 100;
	}

	.modal {
		background-color: var(--color-white);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		max-width: 28rem;
		width: 100%;
		box-shadow: var(--shadow-lg);
	}

	.modal:focus {
		outline: none;
	}

	.modal h2 {
		margin-bottom: var(--space-4);
		font-size: var(--font-size-xl);
	}

	.modal-body {
		color: var(--color-text-muted);
		margin-bottom: var(--space-4);
		line-height: 1.6;
	}

	.modal-body strong {
		color: var(--color-text);
	}

	.error-message {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		padding: var(--space-3);
		background-color: rgba(220, 38, 38, 0.1);
		border-radius: var(--radius-md);
		color: #dc2626;
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-4);
	}

	.error-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2) var(--space-4);
		font-weight: 500;
		font-size: var(--font-size-sm);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}

	.btn-outline {
		background-color: transparent;
		border: 2px solid var(--color-gray-300);
		color: var(--color-text);
	}

	.btn-outline:hover:not(:disabled) {
		border-color: var(--color-gray-400);
		background-color: var(--color-gray-50);
	}

	.btn-outline:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-outline:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}
	}
</style>
