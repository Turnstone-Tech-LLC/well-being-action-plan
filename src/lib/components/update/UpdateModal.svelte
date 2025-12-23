<script lang="ts">
	import { createFocusTrap } from '$lib/a11y';
	import { onMount } from 'svelte';

	interface Props {
		revisionNotes?: string | null;
		isUpdating: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { revisionNotes, isUpdating, onConfirm, onCancel }: Props = $props();

	let modalRef = $state<HTMLDivElement | null>(null);

	onMount(() => {
		if (modalRef) {
			const { activate, deactivate } = createFocusTrap(modalRef);
			activate();
			return () => deactivate();
		}
	});

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape' && !isUpdating) {
			onCancel();
		}
	}

	function handleBackdropClick(event: MouseEvent): void {
		if (event.target === event.currentTarget && !isUpdating) {
			onCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-backdrop" role="presentation" onclick={handleBackdropClick}>
	<div
		bind:this={modalRef}
		class="modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		aria-describedby="modal-description"
	>
		<div class="modal-header">
			<div class="modal-icon">
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
			<h2 id="modal-title">Update Your Action Plan</h2>
		</div>

		<div class="modal-content">
			<p id="modal-description">
				Your provider has made changes to your action plan. Updating will give you the latest
				version while keeping all your check-in history.
			</p>

			{#if revisionNotes}
				<div class="revision-notes">
					<strong>What changed:</strong>
					<p>{revisionNotes}</p>
				</div>
			{/if}

			<div class="info-box">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="info-icon"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
					/>
				</svg>
				<p>Your check-in history will be preserved. This update only changes your plan content.</p>
			</div>
		</div>

		<div class="modal-actions">
			<button type="button" class="btn btn-outline" onclick={onCancel} disabled={isUpdating}>
				Cancel
			</button>
			<button type="button" class="btn btn-primary" onclick={onConfirm} disabled={isUpdating}>
				{#if isUpdating}
					<span class="spinner" aria-hidden="true"></span>
					Updating...
				{:else}
					Update Plan
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		z-index: 200;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background-color: var(--color-white);
		border-radius: var(--radius-xl);
		max-width: 28rem;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-6) var(--space-6) var(--space-4);
		text-align: center;
	}

	.modal-icon {
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 89, 76, 0.1);
		border-radius: 50%;
		color: var(--color-primary);
		margin-bottom: var(--space-4);
	}

	.modal-icon svg {
		width: 1.5rem;
		height: 1.5rem;
	}

	.modal-header h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		color: var(--color-text);
	}

	.modal-content {
		padding: 0 var(--space-6) var(--space-4);
	}

	.modal-content p {
		margin: 0 0 var(--space-4);
		color: var(--color-text-muted);
		text-align: center;
	}

	.revision-notes {
		padding: var(--space-3);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-4);
	}

	.revision-notes strong {
		display: block;
		margin-bottom: var(--space-1);
		font-size: var(--font-size-sm);
		color: var(--color-text);
	}

	.revision-notes p {
		margin: 0;
		font-size: var(--font-size-sm);
		text-align: left;
	}

	.info-box {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-3);
		background-color: rgba(0, 89, 76, 0.05);
		border: 1px solid rgba(0, 89, 76, 0.2);
		border-radius: var(--radius-md);
	}

	.info-icon {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-primary);
	}

	.info-box p {
		margin: 0;
		font-size: var(--font-size-sm);
		text-align: left;
	}

	.modal-actions {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-6) var(--space-6);
	}

	.btn {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		font-weight: 500;
		font-size: var(--font-size-sm);
		border-radius: var(--radius-md);
		border: none;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover:not(:disabled) {
		background-color: var(--color-primary-dark, #004a3f);
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-text);
		border: 1px solid var(--color-gray-300);
	}

	.btn-outline:hover:not(:disabled) {
		background-color: var(--color-gray-100);
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top-color: currentColor;
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
