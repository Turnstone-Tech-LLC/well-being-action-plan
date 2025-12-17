<script lang="ts">
	import { createFocusTrap, type FocusTrap } from '$lib/a11y';

	interface Props {
		open: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { open, onConfirm, onCancel }: Props = $props();

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
			<h2 id="modal-title">Clear your plan data?</h2>
			<p id="modal-description" class="modal-body">
				This will remove your Well-Being Action Plan from this device. You can reload it anytime
				with your access code.
			</p>
			<div class="modal-actions">
				<button type="button" class="btn btn-outline" onclick={onCancel}>Cancel</button>
				<button type="button" class="btn btn-destructive" onclick={onConfirm}>Clear Data</button>
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
		margin-bottom: var(--space-6);
		line-height: 1.6;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
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
</style>
