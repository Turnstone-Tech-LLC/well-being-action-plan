<script lang="ts">
	import type { HelpMethod } from '$lib/types/database';
	import HelpMethodsList from '$lib/components/resources/HelpMethodsList.svelte';
	import { DeleteResourceModal } from '$lib/components/shared';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { data } = $props();

	// Filter state
	let searchQuery = $state('');

	// Modal state
	let showDeleteModal = $state(false);
	let methodToDelete = $state<HelpMethod | null>(null);
	let deleteError = $state<string | null>(null);
	let isDeleting = $state(false);

	// Computed filtered help methods
	const filteredMethods = $derived.by(() => {
		let result = data.helpMethods;

		// Filter by search query (case-insensitive title search)
		if (searchQuery.trim() !== '') {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter(
				(method) =>
					method.title.toLowerCase().includes(query) ||
					(method.description && method.description.toLowerCase().includes(query))
			);
		}

		return result;
	});

	// Get provider's organization ID
	const providerOrgId = $derived(data.providerProfile?.organization_id ?? null);

	function handleEdit(method: HelpMethod) {
		goto(`/provider/resources/help-methods/${method.id}/edit`);
	}

	function handleDelete(method: HelpMethod) {
		methodToDelete = method;
		deleteError = null;
		showDeleteModal = true;
	}

	function handleCancelDelete() {
		showDeleteModal = false;
		methodToDelete = null;
		deleteError = null;
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
	<title>Help Methods (Yellow Zone) | Well-Being Action Plan</title>
	<meta
		name="description"
		content="Browse and manage Yellow Zone help methods for Well-Being Action Plans"
	/>
</svelte:head>

<section class="help-methods-page">
	<a href="/provider/resources" class="back-link">
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
		</svg>
		Back to Resources
	</a>

	<header class="page-header">
		<div class="header-content">
			<h1>Help Methods</h1>
			<p class="subtitle">Yellow Zone - Types of help patients can request</p>
		</div>
		<a href="/provider/resources/help-methods/new" class="btn btn-primary">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="btn-icon"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Add Method
		</a>
	</header>

	<div class="filters-section">
		<div class="search-container">
			<label for="method-search" class="visually-hidden">Search help methods</label>
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
					id="method-search"
					type="search"
					placeholder="Search help methods..."
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
			{filteredMethods.length}
			{filteredMethods.length === 1 ? 'method' : 'methods'}
			{#if searchQuery}
				<span class="filter-context">matching "{searchQuery}"</span>
			{/if}
		</span>
	</div>

	<HelpMethodsList
		helpMethods={filteredMethods}
		{providerOrgId}
		onEdit={handleEdit}
		onDelete={handleDelete}
	/>
</section>

<DeleteResourceModal
	open={showDeleteModal}
	itemName={methodToDelete?.title ?? ''}
	title="Delete help method?"
	error={deleteError}
	loading={isDeleting}
	onCancel={handleCancelDelete}
>
	{#snippet actions()}
		<form
			method="POST"
			action="?/delete"
			use:enhance={() => {
				isDeleting = true;
				deleteError = null;
				return async ({ result, update }) => {
					isDeleting = false;
					if (result.type === 'failure' && result.data?.error) {
						deleteError = result.data.error as string;
					} else if (result.type === 'success') {
						showDeleteModal = false;
						methodToDelete = null;
						await update();
					}
				};
			}}
		>
			<input type="hidden" name="id" value={methodToDelete?.id ?? ''} />
			<button type="submit" class="btn btn-destructive" disabled={isDeleting}>
				{isDeleting ? 'Deleting...' : 'Delete Method'}
			</button>
		</form>
	{/snippet}
</DeleteResourceModal>

<style>
	.help-methods-page {
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

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-5);
		font-weight: 500;
		font-size: var(--font-size-sm);
		border-radius: var(--radius-md);
		border: none;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease;
		cursor: pointer;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover {
		background-color: #004a3f;
	}

	.btn-primary:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-icon {
		width: 1.25rem;
		height: 1.25rem;
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

	.btn-destructive {
		background-color: #dc2626;
		color: var(--color-white);
	}

	.btn-destructive:hover:not(:disabled) {
		background-color: #b91c1c;
	}

	.btn-destructive:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-destructive:focus-visible {
		outline-color: var(--color-white);
		box-shadow: 0 0 0 3px #dc2626;
	}

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}

		.search-input {
			min-height: 44px;
		}

		.clear-search-btn {
			min-width: 44px;
			min-height: 44px;
		}
	}
</style>
