<script lang="ts">
	import SkillForm from '$lib/components/resources/SkillForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Edit Skill | Well-Being Action Plan</title>
	<meta name="description" content="Edit an existing custom skill for your organization" />
</svelte:head>

<section class="edit-skill-page">
	<header class="page-header">
		<a href="/provider/resources/skills" class="back-link">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="back-icon"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
			</svg>
			Back to Skills
		</a>
		<h1>Edit Skill</h1>
		<p class="subtitle">Update the details of this custom skill</p>
	</header>

	<div class="form-container">
		<SkillForm skill={data.skill} formError={form?.error} fieldErrors={form?.fieldErrors} />
	</div>
</section>

<style>
	.edit-skill-page {
		flex: 1;
		padding: var(--space-8) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
	}

	.page-header {
		margin-bottom: var(--space-8);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--font-size-sm);
		font-weight: 500;
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
		margin: 0 0 var(--space-2) 0;
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: var(--font-size-base);
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
