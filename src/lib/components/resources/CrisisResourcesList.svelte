<script lang="ts">
	import type { CrisisResource } from '$lib/types/database';
	import CrisisResourceCard from './CrisisResourceCard.svelte';

	interface Props {
		crisisResources: CrisisResource[];
		isAdmin: boolean;
		onEdit?: (resource: CrisisResource) => void;
	}

	let { crisisResources, isAdmin, onEdit }: Props = $props();
</script>

{#if crisisResources.length === 0}
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
					d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
				/>
			</svg>
		</div>
		<h3 class="empty-title">No crisis resources found</h3>
		<p class="empty-description">
			No crisis resources are currently configured. Contact your system administrator.
		</p>
	</div>
{:else}
	<ul class="resources-list" role="list" aria-label="Crisis resources list">
		{#each crisisResources as resource (resource.id)}
			<li>
				<CrisisResourceCard {resource} {isAdmin} {onEdit} />
			</li>
		{/each}
	</ul>
{/if}

<style>
	.resources-list {
		display: grid;
		gap: var(--space-4);
		list-style: none;
		padding: 0;
		margin: 0;
	}

	@media (min-width: 768px) {
		.resources-list {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.resources-list {
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
		background-color: rgba(220, 38, 38, 0.1);
		border-radius: 50%;
		margin-bottom: var(--space-4);
	}

	.empty-icon svg {
		width: 1.5rem;
		height: 1.5rem;
		color: #dc2626;
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
