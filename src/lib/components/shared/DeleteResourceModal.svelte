<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createFocusTrap } from '$lib/a11y';

	interface Props {
		/** Whether the modal is open */
		open: boolean;
		/** The title of the resource to delete (shown in confirmation message) */
		itemName: string;
		/** Custom modal title (defaults to "Delete this item?") */
		title?: string;
		/** Whether a delete operation is in progress */
		loading?: boolean;
		/** Error message to display */
		error?: string | null;
		/** Whether the item is in use and cannot be deleted */
		isInUse?: boolean;
		/** Custom message when item is in use */
		usageMessage?: string;
		/** Whether to show a warning icon at the top of the modal */
		showWarningIcon?: boolean;
		/** Whether to center the modal content */
		centered?: boolean;
		/** Called when the user cancels/closes the modal */
		onCancel: () => void;
		/** Called when the user confirms deletion */
		onConfirm?: () => void;
		/** Optional slot for custom action buttons (e.g., form submission) */
		actions?: Snippet;
	}

	let {
		open,
		itemName,
		title = 'Delete this item?',
		loading = false,
		error = null,
		isInUse = false,
		usageMessage = 'This item is currently in use and cannot be deleted.',
		showWarningIcon = false,
		centered = false,
		onCancel,
		onConfirm,
		actions
	}: Props = $props();

	let modalElement: HTMLElement | null = $state(null);

	// Manage focus trap when modal opens/closes
	$effect(() => {
		if (open && modalElement) {
			const trap = createFocusTrap(modalElement, {
				onEscape: loading ? undefined : onCancel
			});
			trap.activate();

			return () => {
				trap.deactivate();
			};
		}
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

	function handleConfirm() {
		onConfirm?.();
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
			class:centered
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-modal-title"
			aria-describedby="delete-modal-description"
		>
			{#if showWarningIcon && !isInUse}
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
			{/if}

			<h2 id="delete-modal-title">{title}</h2>

			{#if isInUse}
				<div class="warning-message" role="alert">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="warning-icon"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
						/>
					</svg>
					<p>{usageMessage}</p>
				</div>
			{:else}
				<p id="delete-modal-description" class="modal-body">
					Are you sure you want to delete <strong>"{itemName}"</strong>? This action cannot be
					undone.
				</p>
			{/if}

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

			<div class="modal-actions" class:centered>
				<button type="button" class="btn btn-outline" onclick={onCancel} disabled={loading}>
					{isInUse ? 'Close' : 'Cancel'}
				</button>

				{#if actions}
					{@render actions()}
				{:else if !isInUse}
					<button
						type="button"
						class="btn btn-destructive"
						onclick={handleConfirm}
						disabled={loading}
					>
						{#if loading}
							<span class="spinner" aria-hidden="true"></span>
							Deleting...
						{:else}
							Delete
						{/if}
					</button>
				{/if}
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

	.modal.centered {
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
		margin-bottom: var(--space-4);
		font-size: var(--font-size-xl);
		color: var(--color-text);
	}

	.centered h2 {
		margin-bottom: var(--space-2);
	}

	.modal-body {
		color: var(--color-text-muted);
		margin-bottom: var(--space-6);
		line-height: 1.6;
	}

	.modal-body strong {
		color: var(--color-text);
	}

	.warning-message {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4);
		background-color: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-6);
	}

	.warning-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: #f59e0b;
		flex-shrink: 0;
	}

	.warning-message p {
		margin: 0;
		color: var(--color-text);
		line-height: 1.5;
	}

	.error-message {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		padding: var(--space-3);
		background-color: rgba(220, 38, 38, 0.1);
		border: 1px solid rgba(220, 38, 38, 0.3);
		border-radius: var(--radius-md);
		color: #dc2626;
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-4);
	}

	.centered .error-message {
		justify-content: center;
		text-align: left;
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

	.modal-actions.centered {
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
