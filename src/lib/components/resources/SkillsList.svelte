<script lang="ts">
	import type { Skill } from '$lib/types/database';
	import SkillCard from './SkillCard.svelte';

	interface Props {
		skills: Skill[];
		providerOrgId: string | null;
		onEdit?: (skill: Skill) => void;
		onDelete?: (skill: Skill) => void;
	}

	let { skills, providerOrgId, onEdit, onDelete }: Props = $props();
</script>

{#if skills.length === 0}
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
					d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
				/>
			</svg>
		</div>
		<h3 class="empty-title">No skills found</h3>
		<p class="empty-description">
			No skills match your current filters. Try adjusting your search or category selection.
		</p>
	</div>
{:else}
	<ul class="skills-list" role="list" aria-label="Skills list">
		{#each skills as skill (skill.id)}
			<li>
				<SkillCard {skill} {providerOrgId} {onEdit} {onDelete} />
			</li>
		{/each}
	</ul>
{/if}

<style>
	.skills-list {
		display: grid;
		gap: var(--space-4);
		list-style: none;
		padding: 0;
		margin: 0;
	}

	@media (min-width: 768px) {
		.skills-list {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.skills-list {
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
