<script lang="ts">
	import type { HelpMethod } from '$lib/types/database';
	import { ResourceCard } from '$lib/components/shared';
	import { truncateString } from '$lib/utils/validation';

	interface Props {
		method: HelpMethod;
		providerOrgId: string | null;
		onEdit?: (method: HelpMethod) => void;
		onDelete?: (method: HelpMethod) => void;
	}

	let { method, providerOrgId, onEdit, onDelete }: Props = $props();

	// Check if this is an org-specific (custom) help method
	const isCustomMethod = $derived(method.organization_id !== null);

	// Provider can only edit/delete their org's custom help methods
	const canModify = $derived(
		isCustomMethod && providerOrgId !== null && method.organization_id === providerOrgId
	);

	// Truncate description to first ~80 characters
	const truncatedDescription = $derived(truncateString(method.description, 80));

	function handleEdit() {
		onEdit?.(method);
	}

	function handleDelete() {
		onDelete?.(method);
	}
</script>

<ResourceCard
	title={method.title}
	isCustom={isCustomMethod}
	{canModify}
	accentColor="var(--color-accent)"
	customBadgeColor="#b45309"
	onEdit={handleEdit}
	onDelete={handleDelete}
>
	{#snippet content()}
		{#if truncatedDescription}
			<p class="method-description">{truncatedDescription}</p>
		{/if}
	{/snippet}
</ResourceCard>

<style>
	.method-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.5;
	}
</style>
