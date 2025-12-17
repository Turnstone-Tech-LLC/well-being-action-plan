<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Check Your Email | Well-Being Action Plan</title>
	<meta name="description" content="Verify your email to complete login" />
</svelte:head>

<section class="verify-page">
	<div class="container">
		<div class="icon-wrapper" aria-hidden="true">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect width="20" height="16" x="2" y="4" rx="2" />
				<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
			</svg>
		</div>

		<h1>Check Your Email</h1>

		<p class="message">
			We've sent a magic link to
			{#if data.email}
				<strong>{data.email}</strong>
			{:else}
				<strong>your email</strong>
			{/if}
		</p>

		<p class="instructions">
			Click the link in the email to sign in. The link will expire in 1 hour.
		</p>

		<div class="tips">
			<h2>Didn't receive the email?</h2>
			<ul>
				<li>Check your spam or junk folder</li>
				<li>Make sure you entered the correct email address</li>
				<li>Wait a few minutes for the email to arrive</li>
			</ul>
		</div>

		<div class="actions">
			<a href="/auth" class="btn btn-outline">Try a Different Email</a>
		</div>
	</div>
</section>

<style>
	.verify-page {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8) var(--space-4);
		background-color: var(--color-bg-subtle);
	}

	.container {
		max-width: 28rem;
		width: 100%;
		background-color: var(--color-white);
		padding: var(--space-8);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		text-align: center;
	}

	.icon-wrapper {
		display: flex;
		justify-content: center;
		margin-bottom: var(--space-6);
		color: var(--color-primary);
	}

	h1 {
		color: var(--color-primary);
		margin-bottom: var(--space-4);
	}

	.message {
		font-size: var(--font-size-lg);
		margin-bottom: var(--space-2);
	}

	.message strong {
		color: var(--color-primary);
		word-break: break-all;
	}

	.instructions {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-8);
	}

	.tips {
		background-color: var(--color-bg-subtle);
		padding: var(--space-5);
		border-radius: var(--radius-lg);
		text-align: left;
		margin-bottom: var(--space-6);
	}

	.tips h2 {
		font-size: var(--font-size-sm);
		font-weight: 600;
		margin-bottom: var(--space-3);
		color: var(--color-text);
	}

	.tips ul {
		margin: 0;
		padding-left: var(--space-5);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.tips li {
		margin-bottom: var(--space-1);
	}

	.tips li:last-child {
		margin-bottom: 0;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.btn-outline {
		width: 100%;
	}
</style>
