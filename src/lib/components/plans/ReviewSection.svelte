<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		badgeText?: string;
		badgeColor?: 'green' | 'yellow' | 'red' | 'blue';
		itemCount?: number;
		defaultExpanded?: boolean;
		onEdit?: () => void;
		children: Snippet;
	}

	let {
		title,
		badgeText,
		badgeColor = 'green',
		itemCount,
		defaultExpanded = true,
		onEdit,
		children
	}: Props = $props();

	let expanded = $state(defaultExpanded);

	function toggleExpanded() {
		expanded = !expanded;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleExpanded();
		}
	}

	const sectionId = $derived(`review-section-${title.toLowerCase().replace(/\s+/g, '-')}`);
	const contentId = $derived(`${sectionId}-content`);
</script>

<div class="review-section" class:expanded>
	<div
		class="section-header"
		role="button"
		tabindex="0"
		aria-expanded={expanded}
		aria-controls={contentId}
		onclick={toggleExpanded}
		onkeydown={handleKeydown}
	>
		<div class="header-left">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="chevron-icon"
				class:rotated={expanded}
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
			</svg>

			<h3 class="section-title">{title}</h3>

			{#if badgeText}
				<span class="zone-badge zone-badge-{badgeColor}">
					<span class="zone-indicator"></span>
					{badgeText}
				</span>
			{/if}

			{#if itemCount !== undefined}
				<span class="item-count">{itemCount} item{itemCount === 1 ? '' : 's'}</span>
			{/if}
		</div>

		{#if onEdit}
			<button
				type="button"
				class="edit-btn"
				onclick={(e) => {
					e.stopPropagation();
					onEdit();
				}}
				aria-label="Edit {title}"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="edit-icon"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
					/>
				</svg>
				Edit
			</button>
		{/if}
	</div>

	{#if expanded}
		<div id={contentId} class="section-content" role="region" aria-labelledby={sectionId}>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.review-section {
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background-color: var(--color-white);
	}

	.review-section.expanded {
		border-color: var(--color-gray-300);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
		background-color: var(--color-gray-50);
		cursor: pointer;
		user-select: none;
		transition: background-color 0.15s ease;
	}

	.section-header:hover {
		background-color: var(--color-gray-100);
	}

	.section-header:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: -3px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.chevron-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-text-muted);
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.chevron-icon.rotated {
		transform: rotate(90deg);
	}

	.section-title {
		font-size: var(--font-size-base);
		font-weight: 600;
		margin: 0;
		color: var(--color-text);
	}

	.zone-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-md);
		font-size: var(--font-size-xs);
		font-weight: 600;
	}

	.zone-indicator {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
	}

	.zone-badge-green {
		background-color: rgba(0, 89, 76, 0.1);
		color: var(--color-primary);
	}

	.zone-badge-green .zone-indicator {
		background-color: var(--color-primary);
	}

	.zone-badge-yellow {
		background-color: rgba(253, 224, 71, 0.2);
		color: #92400e;
	}

	.zone-badge-yellow .zone-indicator {
		background-color: #fbbf24;
	}

	.zone-badge-red {
		background-color: rgba(239, 68, 68, 0.1);
		color: #b91c1c;
	}

	.zone-badge-red .zone-indicator {
		background-color: #ef4444;
	}

	.zone-badge-blue {
		background-color: rgba(59, 130, 246, 0.1);
		color: #1d4ed8;
	}

	.zone-badge-blue .zone-indicator {
		background-color: #3b82f6;
	}

	.item-count {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.edit-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-primary);
		background: transparent;
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	.edit-btn:hover {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.edit-btn:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.edit-icon {
		width: 1rem;
		height: 1rem;
	}

	.section-content {
		padding: var(--space-4);
		border-top: 1px solid var(--color-gray-200);
	}

	@media (max-width: 640px) {
		.section-header {
			padding: var(--space-3);
		}

		.header-left {
			flex-wrap: wrap;
			gap: var(--space-2);
		}

		.edit-btn {
			padding: var(--space-2);
		}

		.edit-btn span {
			display: none;
		}
	}

	@media (pointer: coarse) {
		.section-header {
			min-height: 44px;
		}

		.edit-btn {
			min-height: 44px;
			min-width: 44px;
		}
	}
</style>
