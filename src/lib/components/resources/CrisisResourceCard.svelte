<script lang="ts">
	import type { CrisisResource, CrisisContactType } from '$lib/types/database';
	import { ResourceCard } from '$lib/components/shared';
	import { truncateString } from '$lib/utils/validation';

	interface Props {
		resource: CrisisResource;
		isAdmin: boolean;
		onEdit?: (resource: CrisisResource) => void;
	}

	let { resource, isAdmin, onEdit }: Props = $props();

	// Crisis resources are always "standard" (global) for display purposes
	// Even org-specific crisis resources are treated as critical infrastructure
	const isCustom = $derived(resource.organization_id !== null);

	// Only admins can edit crisis resources
	const canModify = $derived(isAdmin);

	// Truncate description
	const truncatedDescription = $derived(truncateString(resource.description, 80));

	// Contact type display config
	const contactTypeConfig: Record<CrisisContactType, { label: string; color: string }> = {
		phone: { label: 'Phone', color: '#2563eb' },
		text: { label: 'Text', color: '#7c3aed' },
		website: { label: 'Website', color: '#059669' }
	};

	const contactTypeInfo = $derived(
		resource.contact_type ? contactTypeConfig[resource.contact_type] : null
	);

	function handleEdit() {
		onEdit?.(resource);
	}
</script>

<ResourceCard
	title={resource.name}
	{isCustom}
	{canModify}
	accentColor="#dc2626"
	customBadgeColor="#dc2626"
	onEdit={handleEdit}
>
	{#snippet badges()}
		{#if contactTypeInfo}
			<span class="contact-type-badge" style:--badge-color={contactTypeInfo.color}>
				{contactTypeInfo.label}
			</span>
		{/if}
	{/snippet}

	{#snippet content()}
		<div class="resource-content">
			<p class="contact-info">
				<span class="contact-label">Contact:</span>
				<span class="contact-value">{resource.contact}</span>
			</p>
			{#if truncatedDescription}
				<p class="resource-description">{truncatedDescription}</p>
			{/if}
		</div>
	{/snippet}
</ResourceCard>

<style>
	.contact-type-badge {
		display: inline-flex;
		align-items: center;
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-xs);
		font-weight: 500;
		border-radius: var(--radius-sm);
		background-color: color-mix(in srgb, var(--badge-color) 10%, transparent);
		color: var(--badge-color);
	}

	.resource-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.contact-info {
		font-size: var(--font-size-sm);
		margin: 0;
		display: flex;
		gap: var(--space-2);
	}

	.contact-label {
		color: var(--color-text-muted);
	}

	.contact-value {
		font-weight: 500;
		color: var(--color-text);
		font-family: var(--font-mono);
	}

	.resource-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.5;
	}
</style>
