<script lang="ts">
	import { ExportForm } from '$lib/components/settings';
</script>

<svelte:head>
	<title>Export Data | Well-Being Action Plan</title>
	<meta
		name="description"
		content="Create an encrypted backup of your Well-Being Action Plan data"
	/>
</svelte:head>

<div class="export-page">
	<nav class="page-nav" aria-label="Back to settings">
		<a href="/app/settings" class="back-link">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M19 12H5M12 19l-7-7 7-7"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Back to Settings
		</a>
	</nav>

	<ExportForm />
</div>

<style>
	.export-page {
		padding: var(--space-6) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.page-nav {
		margin-bottom: var(--space-6);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-primary);
		text-decoration: none;
		font-size: var(--font-size-sm);
		font-weight: 500;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.back-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}
</style>
