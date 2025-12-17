<script lang="ts">
	interface Props {
		categories: string[];
		selectedCategory: string | null;
		onCategoryChange: (category: string | null) => void;
	}

	let { categories, selectedCategory, onCategoryChange }: Props = $props();

	function handleCategoryClick(category: string | null) {
		onCategoryChange(category);
	}

	function formatCategoryLabel(category: string): string {
		return category.charAt(0).toUpperCase() + category.slice(1);
	}
</script>

<nav class="category-filter" aria-label="Filter skills by category">
	<ul class="filter-list" role="tablist">
		<li role="presentation">
			<button
				type="button"
				role="tab"
				aria-selected={selectedCategory === null}
				class="filter-pill"
				class:active={selectedCategory === null}
				onclick={() => handleCategoryClick(null)}
			>
				All
			</button>
		</li>
		{#each categories as category (category)}
			<li role="presentation">
				<button
					type="button"
					role="tab"
					aria-selected={selectedCategory === category}
					class="filter-pill"
					class:active={selectedCategory === category}
					onclick={() => handleCategoryClick(category)}
				>
					{formatCategoryLabel(category)}
				</button>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.category-filter {
		margin-bottom: var(--space-6);
	}

	.filter-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.filter-pill {
		padding: var(--space-2) var(--space-4);
		border-radius: 9999px;
		border: 2px solid var(--color-gray-200);
		background-color: var(--color-white);
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.filter-pill:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.filter-pill.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-white);
	}

	.filter-pill:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	@media (pointer: coarse) {
		.filter-pill {
			min-height: 44px;
			min-width: 44px;
		}
	}
</style>
