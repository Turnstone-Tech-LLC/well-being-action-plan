<script lang="ts">
	import { createFocusTrap, type FocusTrap } from '$lib/a11y';

	interface Props {
		open: boolean;
		title: string;
		itemName: string;
		isInUse?: boolean;
		usageMessage?: string;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		open,
		title,
		itemName,
		isInUse = false,
		usageMessage = 'This item is currently in use and cannot be deleted.',
		onConfirm,
		onCancel
	}: Props = $props();

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
		if (event.target === event.currentTarget) {
			onCancel();
		}
	}

	function handleBackdropKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
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
			aria-labelledby="modal-title"
			aria-describedby="modal-description"
		>
			<h2 id="modal-title">{title}</h2>

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
				<p id="modal-description" class="modal-body">
					Are you sure you want to delete <strong>"{itemName}"</strong>? This action cannot be
					undone.
				</p>
			{/if}

			<div class="modal-actions">
				<button type="button" class="btn btn-outline" onclick={onCancel}>
					{isInUse ? 'Close' : 'Cancel'}
				</button>
				{#if !isInUse}
					<button type="button" class="btn btn-destructive" onclick={onConfirm}>Delete</button>
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

	.modal:focus {
		outline: none;
	}

	.modal h2 {
		margin-bottom: var(--space-4);
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

	.modal-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
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
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease;
		cursor: pointer;
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

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}
	}
</style>
