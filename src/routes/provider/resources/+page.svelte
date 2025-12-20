<script lang="ts">
	const resourceCategories = [
		{
			title: 'Skills',
			description: 'Green Zone coping strategies for Well-Being Action Plans',
			href: '/provider/resources/skills',
			icon: 'skills'
		},
		{
			title: 'Supportive Adults',
			description: 'Types of supportive adults patients can identify',
			href: '/provider/resources/supportive-adults',
			icon: 'adults'
		},
		{
			title: 'Help Methods',
			description: 'Yellow Zone help resources and strategies',
			href: '/provider/resources/help-methods',
			icon: 'help'
		},
		{
			title: 'Crisis Resources',
			description: 'Red Zone emergency contacts and crisis lines',
			href: '/provider/resources/crisis',
			icon: 'crisis'
		}
	];
</script>

<svelte:head>
	<title>Resources | Well-Being Action Plan</title>
	<meta name="description" content="Manage resources for Well-Being Action Plans" />
</svelte:head>

<section class="resources-page">
	<header class="page-header">
		<h1>Resources</h1>
		<p class="subtitle">Manage the building blocks for Well-Being Action Plans</p>
	</header>

	<div class="resource-grid">
		{#each resourceCategories as category}
			<a href={category.href} class="resource-card">
				<div class="card-icon" data-icon={category.icon}>
					{#if category.icon === 'skills'}
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
						</svg>
					{:else if category.icon === 'adults'}
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
						</svg>
					{:else if category.icon === 'help'}
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
						</svg>
					{:else if category.icon === 'crisis'}
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
						</svg>
					{/if}
				</div>
				<div class="card-content">
					<h2>{category.title}</h2>
					<p>{category.description}</p>
				</div>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="card-arrow" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			</a>
		{/each}
	</div>
</section>

<style>
	.resources-page {
		flex: 1;
		padding: var(--space-8) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
	}

	.page-header {
		margin-bottom: var(--space-8);
	}

	h1 {
		color: var(--color-primary);
		margin: 0 0 var(--space-2);
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: var(--font-size-lg);
		margin: 0;
	}

	.resource-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-4);
	}

	.resource-card {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5);
		background-color: var(--color-white);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
	}

	.resource-card:hover {
		border-color: var(--color-primary);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.resource-card:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: var(--radius-md);
		flex-shrink: 0;
	}

	.card-icon[data-icon="skills"] {
		background-color: #dcfce7;
		color: #16a34a;
	}

	.card-icon[data-icon="adults"] {
		background-color: #dbeafe;
		color: #2563eb;
	}

	.card-icon[data-icon="help"] {
		background-color: #fef3c7;
		color: #d97706;
	}

	.card-icon[data-icon="crisis"] {
		background-color: #fee2e2;
		color: #dc2626;
	}

	.card-icon svg {
		width: 1.5rem;
		height: 1.5rem;
	}

	.card-content {
		flex: 1;
		min-width: 0;
	}

	.card-content h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 var(--space-1);
	}

	.card-content p {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0;
	}

	.card-arrow {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-gray-400);
		flex-shrink: 0;
		transition: color 0.15s ease, transform 0.15s ease;
	}

	.resource-card:hover .card-arrow {
		color: var(--color-primary);
		transform: translateX(4px);
	}

	@media (max-width: 640px) {
		.resource-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
