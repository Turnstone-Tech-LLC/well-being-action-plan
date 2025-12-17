<script lang="ts">
	import RestoreForm from '$lib/components/restore/RestoreForm.svelte';
</script>

<svelte:head>
	<title>Restore Your Plan | Well-Being Action Plan</title>
	<meta name="description" content="Restore your Well-Being Action Plan from a backup" />
</svelte:head>

<section class="restore-page">
	<div class="container">
		<h1>Restore Your Plan</h1>
		<p class="description">
			Upload your encrypted backup file to restore your Well-Being Action Plan on this device.
		</p>

		<RestoreForm />

		<div class="info-box">
			<h2>About Backup Files</h2>
			<p>
				Your backup file contains your encrypted Well-Being Action Plan data. You'll need your
				recovery passphrase to decrypt and restore your plan.
			</p>
		</div>
	</div>
</section>

<style>
	.restore-page {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8) var(--space-4);
	}

	.container {
		max-width: 32rem;
		width: 100%;
	}

	h1 {
		color: var(--color-primary);
		text-align: center;
		margin-bottom: var(--space-4);
	}

	.description {
		text-align: center;
		color: var(--color-text-muted);
		margin-bottom: var(--space-8);
	}

	.info-box {
		margin-top: var(--space-8);
		background-color: var(--color-bg-subtle);
		padding: var(--space-6);
		border-radius: var(--radius-lg);
	}

	.info-box h2 {
		font-size: var(--font-size-lg);
		color: var(--color-primary);
		margin-bottom: var(--space-2);
	}

	.info-box p {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}
</style>
