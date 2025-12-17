<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = 'Validating your access code...' }: Props = $props();
</script>

<div class="validating-state" role="status" aria-live="polite" aria-busy="true">
	<div class="spinner" aria-hidden="true"></div>
	<p class="message">{message}</p>
</div>

<style>
	.validating-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-8);
	}

	.spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid var(--color-gray-200);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.message {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
		text-align: center;
	}
</style>
