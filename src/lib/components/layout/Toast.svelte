<script lang="ts">
	import { toastStore, type Toast } from '$lib/stores/toast';
	import { prefersReducedMotion } from '$lib/a11y';

	// Subscribe to toasts store
	let toasts: Toast[] = $state([]);

	$effect(() => {
		const unsubscribe = toastStore.subscribe((value) => {
			toasts = value;
		});

		return () => {
			unsubscribe();
		};
	});

	// Check reduced motion preference
	// eslint-disable-next-line svelte/prefer-writable-derived
	let reducedMotion = $state(false);

	$effect(() => {
		reducedMotion = prefersReducedMotion();
	});

	function handleDismiss(id: string) {
		toastStore.remove(id);
	}
</script>

{#if toasts.length > 0}
	<div class="toast-container" role="region" aria-label="Notifications" aria-live="polite">
		{#each toasts as toast (toast.id)}
			<div
				class="toast toast-{toast.type}"
				class:no-animation={reducedMotion}
				role="alert"
				aria-atomic="true"
			>
				<div class="toast-icon" aria-hidden="true">
					{#if toast.type === 'success'}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
						</svg>
					{:else if toast.type === 'error'}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
						</svg>
					{:else if toast.type === 'warning'}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
							/>
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
							/>
						</svg>
					{/if}
				</div>
				<span class="toast-message">{toast.message}</span>
				<button
					type="button"
					class="toast-dismiss"
					onclick={() => handleDismiss(toast.id)}
					aria-label="Dismiss notification"
				>
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
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		bottom: var(--space-4);
		right: var(--space-4);
		z-index: 200;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-width: 24rem;
		width: calc(100% - var(--space-8));
	}

	.toast {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-lg);
		background-color: var(--color-white);
		box-shadow: var(--shadow-lg);
		border: 1px solid var(--color-gray-200);
		animation: slideIn 0.3s ease-out;
	}

	.toast.no-animation {
		animation: none;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.toast-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
	}

	.toast-icon svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.toast-success .toast-icon {
		color: #16a34a;
	}

	.toast-error .toast-icon {
		color: #dc2626;
	}

	.toast-warning .toast-icon {
		color: #d97706;
	}

	.toast-info .toast-icon {
		color: #2563eb;
	}

	.toast-message {
		flex: 1;
		font-size: var(--font-size-sm);
		color: var(--color-text);
		line-height: 1.4;
	}

	.toast-dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background-color: transparent;
		color: var(--color-gray-400);
		cursor: pointer;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
		transition:
			color 0.15s ease,
			background-color 0.15s ease;
	}

	.toast-dismiss:hover {
		color: var(--color-gray-600);
		background-color: var(--color-gray-100);
	}

	.toast-dismiss:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}

	.toast-dismiss svg {
		width: 1rem;
		height: 1rem;
	}

	/* Visual indicator bar on left side */
	.toast-success {
		border-left: 4px solid #16a34a;
	}

	.toast-error {
		border-left: 4px solid #dc2626;
	}

	.toast-warning {
		border-left: 4px solid #d97706;
	}

	.toast-info {
		border-left: 4px solid #2563eb;
	}

	@media (pointer: coarse) {
		.toast-dismiss {
			min-width: 44px;
			min-height: 44px;
		}
	}

	@media (max-width: 480px) {
		.toast-container {
			left: var(--space-4);
			right: var(--space-4);
			width: auto;
			max-width: none;
		}
	}
</style>
