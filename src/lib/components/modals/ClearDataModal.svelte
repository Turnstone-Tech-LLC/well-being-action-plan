<script lang="ts">
	import { createFocusTrap, type FocusTrap } from '$lib/a11y';

	interface Props {
		open: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { open, onConfirm, onCancel }: Props = $props();

	let modalElement: HTMLElement | null = $state(null);
	// Use a plain variable for focusTrap - NOT $state - to avoid triggering effects when we modify it
	let focusTrap: FocusTrap | null = null;

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
			<div class="modal-header">
				<svg
					class="warning-icon"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<h2 id="modal-title">Clear all your data?</h2>
			</div>
			<div id="modal-description" class="modal-body">
				<p class="warning-text">
					This will permanently remove your Well-Being Action Plan and all check-in history from
					this device.
				</p>
				<p class="info-text">
					You can reload your plan anytime with a new access code from your provider.
				</p>
				<p class="suggestion-text">
					Consider <a href="/app/settings/export" onclick={onCancel}>exporting your data</a> first.
				</p>
			</div>
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

	.modal-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.warning-icon {
		color: #dc2626;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.modal h2 {
		font-size: var(--font-size-xl);
		margin: 0;
	}

	.modal-body {
		margin-bottom: var(--space-6);
		line-height: 1.6;
	}

	.modal-body p {
		margin: 0 0 var(--space-3);
	}

	.modal-body p:last-child {
		margin-bottom: 0;
	}

	.warning-text {
		color: var(--color-gray-800);
		font-weight: 500;
	}

	.info-text {
		color: var(--color-text-muted);
	}

	.suggestion-text {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	.suggestion-text a {
		color: var(--color-primary);
		text-decoration: underline;
	}

	.suggestion-text a:hover {
		text-decoration: none;
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
