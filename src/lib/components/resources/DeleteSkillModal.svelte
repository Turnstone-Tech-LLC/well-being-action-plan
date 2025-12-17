<script lang="ts">
	import { createFocusTrap, type FocusTrap } from '$lib/a11y';
	import type { Skill } from '$lib/types/database';

	interface Props {
		open: boolean;
		skill: Skill | null;
		loading?: boolean;
		error?: string | null;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { open, skill, loading = false, error = null, onConfirm, onCancel }: Props = $props();

	let modalElement: HTMLElement | null = $state(null);
	let focusTrap: FocusTrap | null = $state(null);

	// Manage focus trap when modal opens/closes
	$effect(() => {
		if (open && modalElement) {
			focusTrap = createFocusTrap(modalElement, {
				onEscape: loading ? undefined : onCancel
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
		// Don't close if loading
		if (event.target === event.currentTarget && !loading) {
			onCancel();
		}
	}

	function handleBackdropKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !loading) {
			onCancel();
		}
	}
</script>

{#if open && skill}
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
			aria-labelledby="modal-title"
			aria-describedby="modal-description"
		>
			<div class="modal-icon" aria-hidden="true">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
					/>
				</svg>
			</div>

			<h2 id="modal-title">Delete this skill?</h2>
			<p id="modal-description" class="modal-body">
				Are you sure you want to delete <strong>"{skill.title}"</strong>? This action cannot be
				undone.
			</p>

			{#if error}
				<div class="modal-error" role="alert">
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
					{error}
				</div>
			{/if}

			<div class="modal-actions">
				<button type="button" class="btn btn-outline" onclick={onCancel} disabled={loading}>
					Cancel
				</button>
				<button type="button" class="btn btn-destructive" onclick={onConfirm} disabled={loading}>
					{#if loading}
						<span class="spinner" aria-hidden="true"></span>
						Deleting...
					{:else}
						Delete Skill
					{/if}
				</button>
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
		text-align: center;
	}

	.modal:focus {
		outline: none;
	}

	.modal-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background-color: rgba(220, 38, 38, 0.1);
		border-radius: 50%;
		margin: 0 auto var(--space-4);
	}

	.modal-icon svg {
		width: 1.5rem;
		height: 1.5rem;
		color: #dc2626;
	}

	.modal h2 {
		margin-bottom: var(--space-2);
		font-size: var(--font-size-xl);
		color: var(--color-text);
	}

	.modal-body {
		color: var(--color-text-muted);
		margin-bottom: var(--space-6);
		line-height: 1.6;
	}

	.modal-body strong {
		color: var(--color-text);
	}

	.modal-error {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background-color: rgba(220, 38, 38, 0.1);
		border: 1px solid rgba(220, 38, 38, 0.3);
		border-radius: var(--radius-md);
		color: #dc2626;
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-4);
		text-align: left;
	}

	.error-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-5);
		font-weight: 500;
		font-size: var(--font-size-sm);
		border-radius: var(--radius-md);
		border: none;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			opacity 0.15s ease;
	}

	.btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-text);
		border: 2px solid var(--color-gray-300);
	}

	.btn-outline:hover:not(:disabled) {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.btn-outline:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-destructive {
		background-color: #dc2626;
		color: var(--color-white);
	}

	.btn-destructive:hover:not(:disabled) {
		background-color: #b91c1c;
	}

	.btn-destructive:focus-visible {
		outline-color: var(--color-white);
		box-shadow: 0 0 0 3px #dc2626;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.75s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}
	}
</style>
