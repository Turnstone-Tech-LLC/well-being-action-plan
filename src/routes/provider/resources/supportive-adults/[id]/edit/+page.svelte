<script lang="ts">
	import SupportiveAdultTypeForm from '$lib/components/resources/SupportiveAdultTypeForm.svelte';

	let { data, form } = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>Edit {data.type.label} | Well-Being Action Plan</title>
	<meta name="description" content="Edit supportive adult type settings" />
</svelte:head>

<section class="edit-type-page">
	<header class="page-header">
		<a href="/provider/resources/supportive-adults" class="back-link">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="back-icon"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
				/>
			</svg>
			Back to Supportive Adult Types
		</a>
		<h1>Edit Supportive Adult Type</h1>
		<p class="subtitle">Update the settings for "{data.type.label}"</p>
	</header>

	<div class="form-container">
		<SupportiveAdultTypeForm type={data.type} error={form?.error} bind:loading />
	</div>
</section>

<style>
	.edit-type-page {
		flex: 1;
		padding: var(--space-8) var(--space-4);
		max-width: 40rem;
		margin: 0 auto;
		width: 100%;
	}

	.page-header {
		margin-bottom: var(--space-8);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-4);
		transition: color 0.15s ease;
	}

	.back-link:hover {
		color: var(--color-primary);
	}

	.back-link:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.back-icon {
		width: 1rem;
		height: 1rem;
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

	.form-container {
		background-color: var(--color-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--color-gray-200);
		padding: var(--space-6);
	}

	@media (pointer: coarse) {
		.back-link {
			min-height: 44px;
			display: inline-flex;
			align-items: center;
		}
	}
</style>
