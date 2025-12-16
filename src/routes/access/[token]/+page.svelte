<script lang="ts">
	import { page } from '$app/stores';

	const token = $derived($page.params.token);
</script>

<svelte:head>
	<title>Access Your Plan | Well-Being Action Plan</title>
	<meta name="description" content="Access your Well-Being Action Plan" />
</svelte:head>

<section class="access-page">
	<div class="container">
		<h1>Accessing Your Plan</h1>
		<p class="description">
			Loading your Well-Being Action Plan...
		</p>
		<div class="token-info">
			<p class="label">Access Token:</p>
			<code>{token}</code>
		</div>
		<p class="note">
			Your plan data will be stored locally on this device for privacy.
		</p>
	</div>
</section>

<style>
	.access-page {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8) var(--space-4);
	}

	.container {
		max-width: 32rem;
		text-align: center;
	}

	h1 {
		color: var(--color-primary);
		margin-bottom: var(--space-4);
	}

	.description {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
		margin-bottom: var(--space-6);
	}

	.token-info {
		background-color: var(--color-bg-subtle);
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-6);
	}

	.label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--space-2);
	}

	code {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		background-color: var(--color-gray-200);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		word-break: break-all;
	}

	.note {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}
</style>
