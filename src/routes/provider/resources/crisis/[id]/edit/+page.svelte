<script lang="ts">
	import CrisisResourceForm from '$lib/components/resources/CrisisResourceForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Edit Crisis Resource | Well-Being Action Plan</title>
	<meta name="description" content="Edit Red Zone crisis resource" />
</svelte:head>

<section class="edit-resource-page">
	<header class="page-header">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<ol>
				<li>
					<a href="/provider/resources/crisis">Crisis Resources</a>
				</li>
				<li aria-current="page">Edit Resource</li>
			</ol>
		</nav>
		<h1>Edit Crisis Resource</h1>
		<p class="subtitle">Update this Red Zone crisis resource</p>
	</header>

	<CrisisResourceForm resource={data.resource} action="?/default" error={form?.error ?? null} />
</section>

<style>
	.edit-resource-page {
		flex: 1;
		padding: var(--space-8) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
	}

	.page-header {
		margin-bottom: var(--space-8);
	}

	.breadcrumb {
		margin-bottom: var(--space-4);
	}

	.breadcrumb ol {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		list-style: none;
		padding: 0;
		margin: 0;
		font-size: var(--font-size-sm);
	}

	.breadcrumb li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.breadcrumb li:not(:last-child)::after {
		content: '/';
		color: var(--color-gray-400);
	}

	.breadcrumb a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.breadcrumb a:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.breadcrumb li[aria-current='page'] {
		color: var(--color-text-muted);
	}

	h1 {
		color: var(--color-primary);
		margin: 0 0 var(--space-2);
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}
</style>
