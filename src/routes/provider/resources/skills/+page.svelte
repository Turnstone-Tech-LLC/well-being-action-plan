<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Skill } from '$lib/types/database';
	import CategoryFilter from '$lib/components/resources/CategoryFilter.svelte';
	import SkillsList from '$lib/components/resources/SkillsList.svelte';
	import { DeleteResourceModal } from '$lib/components/shared';
	import { toastStore } from '$lib/stores/toast';

	let { data } = $props();

	// Filter state
	let searchQuery = $state('');
	let selectedCategory = $state<string | null>(null);

	// Delete modal state
	let deleteModalOpen = $state(false);
	let skillToDelete = $state<Skill | null>(null);
	let deleteLoading = $state(false);
	let deleteError = $state<string | null>(null);

	// Show toast messages based on URL params on mount
	$effect(() => {
		const url = $page.url;
		if (url.searchParams.has('created')) {
			toastStore.success('Skill created successfully');
			// Clean up URL
			goto('/provider/resources/skills', { replaceState: true });
		} else if (url.searchParams.has('updated')) {
			toastStore.success('Skill updated successfully');
			// Clean up URL
			goto('/provider/resources/skills', { replaceState: true });
		}
	});

	// Computed filtered skills
	const filteredSkills = $derived.by(() => {
		let result = data.skills;

		// Filter by category
		if (selectedCategory !== null) {
			result = result.filter((skill) => skill.category === selectedCategory);
		}

		// Filter by search query (case-insensitive title search)
		if (searchQuery.trim() !== '') {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter((skill) => skill.title.toLowerCase().includes(query));
		}

		return result;
	});

	// Get provider's organization ID
	const providerOrgId = $derived(data.providerProfile?.organization_id ?? null);

	// Navigate to edit page
	function handleEdit(skill: Skill) {
		goto(`/provider/resources/skills/${skill.id}/edit`);
	}

	// Open delete confirmation modal
	function handleDelete(skill: Skill) {
		skillToDelete = skill;
		deleteError = null;
		deleteModalOpen = true;
	}

	// Close delete modal
	function handleCancelDelete() {
		deleteModalOpen = false;
		skillToDelete = null;
		deleteError = null;
	}

	// Handle delete confirmation
	async function handleConfirmDelete() {
		if (!skillToDelete) return;

		deleteLoading = true;
		deleteError = null;

		// Submit the delete form programmatically
		const formData = new FormData();
		formData.append('skillId', skillToDelete.id);

		try {
			const response = await fetch('?/delete', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'failure') {
				deleteError = result.data?.error || 'Failed to delete skill';
				deleteLoading = false;
				return;
			}

			// Success
			deleteModalOpen = false;
			skillToDelete = null;
			deleteLoading = false;

			// Refresh the data
			await invalidateAll();

			// Show success toast
			if (result.data?.softDeleted) {
				toastStore.success('Skill has been archived (it was in use by action plans)');
			} else {
				toastStore.success('Skill deleted successfully');
			}
		} catch {
			deleteError = 'An unexpected error occurred. Please try again.';
			deleteLoading = false;
		}
	}

	function handleCategoryChange(category: string | null) {
		selectedCategory = category;
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
	<title>Skills Library | Well-Being Action Plan</title>
	<meta
		name="description"
		content="Browse and manage Green Zone coping strategies for Well-Being Action Plans"
	/>
</svelte:head>

<section class="skills-page">
	<header class="page-header">
		<div class="header-content">
			<h1>Skills Library</h1>
			<p class="subtitle">Green Zone coping strategies for Well-Being Action Plans</p>
		</div>
		<a href="/provider/resources/skills/new" class="btn btn-primary">
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
			Add Skill
		</a>
	</header>

	<div class="filters-section">
		<div class="search-container">
			<label for="skill-search" class="visually-hidden">Search skills by title</label>
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
					id="skill-search"
					type="search"
					placeholder="Search skills..."
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

		<CategoryFilter
			categories={data.categories}
			{selectedCategory}
			onCategoryChange={handleCategoryChange}
		/>
	</div>

	<div class="results-info" aria-live="polite" aria-atomic="true">
		<span class="results-count">
			{filteredSkills.length}
			{filteredSkills.length === 1 ? 'skill' : 'skills'}
			{#if selectedCategory || searchQuery}
				<span class="filter-context">
					{#if selectedCategory && searchQuery}
						matching "{searchQuery}" in {selectedCategory}
					{:else if selectedCategory}
						in {selectedCategory}
					{:else if searchQuery}
						matching "{searchQuery}"
					{/if}
				</span>
			{/if}
		</span>
	</div>

	<SkillsList skills={filteredSkills} {providerOrgId} onEdit={handleEdit} onDelete={handleDelete} />
</section>

<DeleteResourceModal
	open={deleteModalOpen}
	itemName={skillToDelete?.title ?? ''}
	title="Delete this skill?"
	loading={deleteLoading}
	error={deleteError}
	showWarningIcon={true}
	centered={true}
	onConfirm={handleConfirmDelete}
	onCancel={handleCancelDelete}
/>

<style>
	.skills-page {
		flex: 1;
		padding: var(--space-8) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
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
