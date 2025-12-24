<script lang="ts">
	import { enhance } from '$app/forms';

	let { form, data } = $props();
	let loading = $state(false);
	let email = $state(form?.email ?? '');

	// Show error from callback redirect or form submission
	let errorMessage = $derived(form?.error ?? data.error);
</script>

<svelte:head>
	<title>Provider Login | Well-Being Action Plan</title>
	<meta name="description" content="Provider login for Well-Being Action Plan" />
</svelte:head>

<section class="auth-page">
	<div class="container">
		<h1>Provider Login</h1>
		<p class="description">
			Enter your email to receive a secure sign-in link. No password required.
		</p>

		<form
			method="POST"
			action="?/login"
			class="auth-form"
			aria-label="Provider login"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<div class="form-group">
				<label for="email">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					bind:value={email}
					placeholder="provider@example.com"
					autocomplete="email"
					required
					aria-required="true"
					aria-describedby={errorMessage ? 'error-message' : undefined}
					aria-invalid={errorMessage ? 'true' : undefined}
					disabled={loading}
				/>
			</div>

			{#if errorMessage}
				<div class="error-message" id="error-message" role="alert">
					{errorMessage}
				</div>
			{/if}

			<button type="submit" class="btn btn-primary btn-full" disabled={loading}>
				{#if loading}
					<span class="loading-text">Sending link...</span>
				{:else}
					Send Magic Link
				{/if}
			</button>
		</form>

		<p class="help-text">Don't have access? Contact your administrator.</p>
	</div>
</section>

<style>
	.auth-page {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8) var(--space-4);
		background-color: var(--color-bg-subtle);
	}

	.container {
		max-width: 24rem;
		width: 100%;
		background-color: var(--color-white);
		padding: var(--space-8);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
	}

	h1 {
		color: var(--color-primary);
		text-align: center;
		margin-bottom: var(--space-2);
	}

	.description {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-8);
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-group label {
		font-weight: 500;
		font-size: var(--font-size-sm);
		color: var(--color-text);
	}

	.form-group input {
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.form-group input::placeholder {
		color: var(--color-gray-400);
	}

	.form-group input:disabled {
		background-color: var(--color-gray-100);
		cursor: not-allowed;
	}

	.form-group input[aria-invalid='true'] {
		border-color: #dc2626;
	}

	.error-message {
		padding: var(--space-3) var(--space-4);
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: var(--radius-md);
		color: #dc2626;
		font-size: var(--font-size-sm);
	}

	.btn-full {
		width: 100%;
		margin-top: var(--space-2);
	}

	.btn-full:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.loading-text {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.help-text {
		text-align: center;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-top: var(--space-6);
	}
</style>
