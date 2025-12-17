<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** The title to display on the card */
		title: string;
		/** Whether this is a custom (org-specific) resource */
		isCustom: boolean;
		/** Whether the user can modify (edit/delete) this resource */
		canModify: boolean;
		/** Custom color for the accent border (uses CSS variable) */
		accentColor?: string;
		/** Custom color for the custom badge */
		customBadgeColor?: string;
		/** Called when edit button is clicked */
		onEdit?: () => void;
		/** Called when delete button is clicked */
		onDelete?: () => void;
		/** Optional slot for badges/tags to display in the header */
		badges?: Snippet;
		/** Optional slot for content below the title */
		content?: Snippet;
	}

	let {
		title,
		isCustom,
		canModify,
		accentColor = 'var(--color-primary)',
		customBadgeColor = 'var(--color-primary)',
		onEdit,
		onDelete,
		badges,
		content
	}: Props = $props();

	function handleEdit() {
		onEdit?.();
	}

	function handleDelete() {
		onDelete?.();
	}
</script>

<article class="resource-card" class:custom={isCustom} style:--accent-color={accentColor}>
	<div class="card-content">
		<div class="card-header">
			<h3 class="card-title">{title}</h3>
			{#if badges}
				<div class="card-badges">
					{@render badges()}
				</div>
			{/if}
		</div>

		{#if content}
			<div class="card-body">
				{@render content()}
			</div>
		{/if}

		<div class="card-footer">
			<span
				class="source-indicator"
				class:standard={!isCustom}
				class:custom={isCustom}
				style:--custom-badge-color={customBadgeColor}
			>
				{isCustom ? 'Custom' : 'Standard'}
			</span>

			{#if canModify}
				<div class="card-actions">
					<button type="button" class="action-btn" onclick={handleEdit} aria-label="Edit {title}">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="action-icon"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
							/>
						</svg>
						<span class="action-label">Edit</span>
					</button>
					<button
						type="button"
						class="action-btn action-btn-danger"
						onclick={handleDelete}
						aria-label="Delete {title}"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="action-icon"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
							/>
						</svg>
						<span class="action-label">Delete</span>
					</button>
				</div>
			{/if}
		</div>
	</div>
</article>

<style>
	.resource-card {
		background-color: var(--color-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--color-gray-200);
		transition:
			box-shadow 0.15s ease,
			border-color 0.15s ease;
	}

	.resource-card:hover {
		box-shadow: var(--shadow-md);
		border-color: var(--color-gray-300);
	}

	.resource-card.custom {
		border-left: 4px solid var(--accent-color);
	}

	.card-content {
		padding: var(--space-4);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}

	.card-title {
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
		flex: 1;
	}

	.card-badges {
		display: flex;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.card-body {
		margin: var(--space-2) 0;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-gray-100);
	}

	.source-indicator {
		font-size: var(--font-size-xs);
		font-weight: 500;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
	}

	.source-indicator.standard {
		background-color: var(--color-gray-100);
		color: var(--color-gray-600);
	}

	.source-indicator.custom {
		background-color: color-mix(in srgb, var(--custom-badge-color) 10%, transparent);
		color: var(--custom-badge-color);
	}

	.card-actions {
		display: flex;
		gap: var(--space-2);
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		border: none;
		background-color: transparent;
		color: var(--color-text-muted);
		font-size: var(--font-size-xs);
		font-weight: 500;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	.action-btn:hover {
		background-color: var(--color-gray-100);
		color: var(--color-text);
	}

	.action-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}

	.action-btn-danger:hover {
		background-color: rgba(220, 38, 38, 0.1);
		color: #dc2626;
	}

	.action-icon {
		width: 1rem;
		height: 1rem;
	}

	.action-label {
		display: none;
	}

	@media (min-width: 640px) {
		.action-label {
			display: inline;
		}
	}

	@media (pointer: coarse) {
		.action-btn {
			min-height: 44px;
			min-width: 44px;
			padding: var(--space-2);
		}
	}
</style>
