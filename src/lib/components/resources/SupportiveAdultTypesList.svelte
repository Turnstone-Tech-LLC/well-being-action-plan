<script lang="ts">
	import type { SupportiveAdultType } from '$lib/types/database';
	import SupportiveAdultTypeCard from './SupportiveAdultTypeCard.svelte';

	interface Props {
		types: SupportiveAdultType[];
		providerOrgId: string | null;
		onEdit?: (type: SupportiveAdultType) => void;
		onDelete?: (type: SupportiveAdultType) => void;
	}

	let { types, providerOrgId, onEdit, onDelete }: Props = $props();
</script>

{#if types.length === 0}
	<div class="empty-state">
		<div class="empty-icon">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
				/>
			</svg>
		</div>
		<h3 class="empty-title">No supportive adult types found</h3>
		<p class="empty-description">
			No supportive adult types match your current filters. Try adjusting your search.
		</p>
	</div>
{:else}
	<ul class="types-list" role="list" aria-label="Supportive adult types list">
		{#each types as type (type.id)}
			<li>
				<SupportiveAdultTypeCard {type} {providerOrgId} {onEdit} {onDelete} />
			</li>
		{/each}
	</ul>
{/if}

<style>
	.types-list {
		display: grid;
		gap: var(--space-4);
		list-style: none;
		padding: 0;
		margin: 0;
	}

	@media (min-width: 768px) {
		.types-list {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.types-list {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--space-12) var(--space-4);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-lg);
		border: 2px dashed var(--color-gray-200);
	}

	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background-color: var(--color-gray-100);
		border-radius: 50%;
		margin-bottom: var(--space-4);
	}

	.empty-icon svg {
		width: 1.5rem;
		height: 1.5rem;
		color: var(--color-gray-400);
	}

	.empty-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 var(--space-2);
	}

	.empty-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0;
		max-width: 24rem;
	}
</style>
