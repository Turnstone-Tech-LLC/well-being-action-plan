<script lang="ts">
	import type { Skill } from '$lib/types/database';
	import { ResourceCard } from '$lib/components/shared';
	import { capitalizeFirst } from '$lib/utils/validation';

	interface Props {
		skill: Skill;
		providerOrgId: string | null;
		onEdit?: (skill: Skill) => void;
		onDelete?: (skill: Skill) => void;
	}

	let { skill, providerOrgId, onEdit, onDelete }: Props = $props();

	// Check if this is an org-specific (custom) skill
	const isCustomSkill = $derived(skill.organization_id !== null);

	// Provider can only edit/delete their org's custom skills
	const canModify = $derived(
		isCustomSkill && providerOrgId !== null && skill.organization_id === providerOrgId
	);

	function handleEdit() {
		onEdit?.(skill);
	}

	function handleDelete() {
		onDelete?.(skill);
	}
</script>

<ResourceCard
	title={skill.title}
	isCustom={isCustomSkill}
	{canModify}
	accentColor="var(--color-primary)"
	customBadgeColor="var(--color-primary)"
	onEdit={handleEdit}
	onDelete={handleDelete}
>
	{#snippet badges()}
		{#if skill.category}
			<span class="badge badge-category">{capitalizeFirst(skill.category)}</span>
		{/if}
		{#if skill.has_fill_in}
			<span class="badge badge-fill-in" title="Has fill-in prompt">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="badge-icon"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
					/>
				</svg>
				<span class="visually-hidden">Has fill-in prompt</span>
			</span>
		{/if}
	{/snippet}

	{#snippet content()}
		{#if skill.has_fill_in && skill.fill_in_prompt}
			<p class="fill-in-preview">Fill-in: "{skill.fill_in_prompt}"</p>
		{/if}
	{/snippet}
</ResourceCard>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: 500;
	}

	.badge-category {
		background-color: var(--color-gray-100);
		color: var(--color-gray-700);
	}

	.badge-fill-in {
		background-color: var(--color-accent);
		color: var(--color-gray-900);
		padding: var(--space-1);
	}

	.badge-icon {
		width: 1rem;
		height: 1rem;
	}

	.fill-in-preview {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0;
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
</style>
