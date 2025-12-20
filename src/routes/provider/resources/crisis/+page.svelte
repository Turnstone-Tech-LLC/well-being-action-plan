<script lang="ts">
	import type { CrisisResource } from '$lib/types/database';
	import CrisisResourcesList from '$lib/components/resources/CrisisResourcesList.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	// Filter state
	let searchQuery = $state('');

	// Check if user is admin
	const isAdmin = $derived(data.providerProfile?.role === 'admin');

	// Computed filtered crisis resources
	const filteredResources = $derived.by(() => {
		let result = data.crisisResources;

		// Filter by search query (case-insensitive name/contact search)
		if (searchQuery.trim() !== '') {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter(
				(resource) =>
					resource.name.toLowerCase().includes(query) ||
					resource.contact.toLowerCase().includes(query) ||
					(resource.description && resource.description.toLowerCase().includes(query))
			);
		}

		return result;
	});

	function handleEdit(resource: CrisisResource) {
		goto(`/provider/resources/crisis/${resource.id}/edit`);
	}

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;
	}

	function clearSearch() {
		searchQuery = '';
	}
</script>

<svelte:head>
	<title>Crisis Resources (Red Zone) | Well-Being Action Plan</title>
	<meta
		name="description"
		content="View and manage Red Zone crisis resources for Well-Being Action Plans"
	/>
</svelte:head>

<section class="crisis-resources-page">
	<a href="/provider/resources" class="back-link">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
		</svg>
		Back to Resources
	</a>

	<header class="page-header">
		<div class="header-content">
			<h1>Crisis Resources</h1>
			<p class="subtitle">Red Zone - Critical safety resources that appear on every action plan</p>
		</div>
	</header>

	<!-- Important Notice -->
	<div class="important-notice" role="alert">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="notice-icon"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
			/>
		</svg>
		<div class="notice-content">
			<strong>Important:</strong> These resources appear on every action plan. Changes affect all
			patients.
			{#if !isAdmin}
				<span class="admin-note">Only organization administrators can edit crisis resources.</span>
			{/if}
		</div>
	</div>

	<div class="filters-section">
		<div class="search-container">
			<label for="resource-search" class="visually-hidden">Search crisis resources</label>
			<div class="search-input-wrapper">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="search-icon"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
					/>
				</svg>
				<input
					id="resource-search"
					type="search"
					placeholder="Search crisis resources..."
					value={searchQuery}
					oninput={handleSearchInput}
					class="search-input"
				/>
				{#if searchQuery}
					<button
						type="button"
						class="clear-search-btn"
						onclick={clearSearch}
						aria-label="Clear search"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="results-info" aria-live="polite" aria-atomic="true">
		<span class="results-count">
			{filteredResources.length}
			{filteredResources.length === 1 ? 'resource' : 'resources'}
			{#if searchQuery}
				<span class="filter-context">matching "{searchQuery}"</span>
			{/if}
		</span>
	</div>

	<CrisisResourcesList crisisResources={filteredResources} {isAdmin} onEdit={handleEdit} />
</section>

<style>
	.crisis-resources-page {
		flex: 1;
		padding: var(--space-8) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
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

	.back-link svg {
		width: 1rem;
		height: 1rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-6);
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	h1 {
		color: var(--color-primary);
		margin: 0;
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.important-notice {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		background-color: rgba(220, 38, 38, 0.05);
		border-radius: var(--radius-lg);
		border: 1px solid rgba(220, 38, 38, 0.2);
		margin-bottom: var(--space-6);
	}

	.notice-icon {
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		color: #dc2626;
	}

	.notice-content {
		font-size: var(--font-size-sm);
		color: var(--color-text);
		line-height: 1.5;
	}

	.admin-note {
		display: block;
		margin-top: var(--space-1);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.filters-section {
		margin-bottom: var(--space-4);
	}

	.search-container {
		margin-bottom: var(--space-4);
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: var(--space-3);
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-gray-400);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		max-width: 24rem;
		padding: var(--space-3) var(--space-4);
		padding-left: var(--space-10);
		padding-right: var(--space-10);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-base);
		color: var(--color-text);
		background-color: var(--color-white);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.search-input::placeholder {
		color: var(--color-gray-400);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.clear-search-btn {
		position: absolute;
		right: var(--space-2);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		background-color: transparent;
		color: var(--color-gray-400);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition:
			color 0.15s ease,
			background-color 0.15s ease;
	}

	.clear-search-btn:hover {
		color: var(--color-gray-600);
		background-color: var(--color-gray-100);
	}

	.clear-search-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}

	.clear-search-btn svg {
		width: 1rem;
		height: 1rem;
	}

	.results-info {
		margin-bottom: var(--space-4);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.results-count {
		font-weight: 500;
	}

	.filter-context {
		font-weight: 400;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	@media (pointer: coarse) {
		.search-input {
			min-height: 44px;
		}

		.clear-search-btn {
			min-width: 44px;
			min-height: 44px;
		}
	}
</style>
