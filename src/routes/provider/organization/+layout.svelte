<script lang="ts">
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	const tabs = [
		{ href: '/provider/organization', label: 'General' },
		{ href: '/provider/organization/team', label: 'Team' }
	];
</script>

<section class="organization-page">
	<header class="page-header">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<ol>
				<li><a href="/provider">Dashboard</a></li>
				<li aria-current="page">Organization</li>
			</ol>
		</nav>
		<h1>Organization Settings</h1>
		<p class="org-name">{data.organization.name}</p>
	</header>

	<nav class="tab-nav" aria-label="Organization settings navigation">
		<ul role="tablist">
			{#each tabs as tab (tab.href)}
				{@const isActive = $page.url.pathname === tab.href}
				<li role="presentation">
					<a href={tab.href} role="tab" aria-selected={isActive} class:active={isActive}>
						{tab.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<div class="tab-content">
		{@render children()}
	</div>
</section>

<style>
	.organization-page {
		flex: 1;
		padding: var(--space-8) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
	}

	.page-header {
		margin-bottom: var(--space-6);
	}

	.page-header h1 {
		font-size: var(--font-size-3xl);
		color: var(--color-gray-900);
		margin: 0;
	}

	.org-name {
		color: var(--color-text-muted);
		margin: var(--space-2) 0 0 0;
		font-size: var(--font-size-base);
	}

	/* Breadcrumb */
	.breadcrumb ol {
		display: flex;
		gap: var(--space-2);
		list-style: none;
		padding: 0;
		margin: 0 0 var(--space-4) 0;
		font-size: var(--font-size-sm);
	}

	.breadcrumb li::after {
		content: '>';
		margin-left: var(--space-2);
		color: var(--color-gray-400);
	}

	.breadcrumb li:last-child::after {
		content: '';
	}

	.breadcrumb a {
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.breadcrumb a:hover {
		color: var(--color-primary);
		text-decoration: underline;
	}

	/* Tab navigation */
	.tab-nav {
		margin-bottom: var(--space-6);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.tab-nav ul {
		display: flex;
		gap: var(--space-1);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.tab-nav a {
		display: block;
		padding: var(--space-3) var(--space-4);
		color: var(--color-text-muted);
		text-decoration: none;
		font-weight: 500;
		font-size: var(--font-size-sm);
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.tab-nav a:hover {
		color: var(--color-text);
	}

	.tab-nav a.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}

	.tab-nav a:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.tab-content {
		min-height: 300px;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.organization-page {
			padding: var(--space-4);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tab-nav a {
			transition: none;
		}
	}
</style>
