<script lang="ts">
	import type { CrisisResource } from '$lib/types/database';

	interface Props {
		crisisResources: CrisisResource[];
	}

	let { crisisResources }: Props = $props();

	function formatContact(resource: CrisisResource): string {
		if (resource.contact_type === 'phone') {
			return `Call: ${resource.contact}`;
		} else if (resource.contact_type === 'text') {
			return `Text: ${resource.contact}`;
		} else if (resource.contact_type === 'website') {
			return resource.contact;
		}
		return resource.contact;
	}

	function getContactIcon(contactType: string | null): string {
		switch (contactType) {
			case 'phone':
				return 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z';
			case 'text':
				return 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z';
			case 'website':
				return 'M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418';
			default:
				return 'M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z';
		}
	}
</script>

<div class="red-zone-preview">
	<div class="zone-header">
		<div class="zone-badge">
			<span class="zone-indicator"></span>
			Red Zone: Reach Out!
		</div>
		<p class="zone-description">
			If coping skills and supportive adults are not enough, or if you are in crisis, please reach
			out to these resources:
		</p>
	</div>

	{#if crisisResources.length > 0}
		<div class="resources-list">
			{#each crisisResources as resource (resource.id)}
				<div class="resource-card">
					<div class="resource-icon" aria-hidden="true">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d={getContactIcon(resource.contact_type)}
							/>
						</svg>
					</div>
					<div class="resource-content">
						<h4 class="resource-name">{resource.name}</h4>
						<p class="resource-contact">{formatContact(resource)}</p>
						{#if resource.description}
							<p class="resource-description">{resource.description}</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="no-resources">Crisis resources will be displayed here.</p>
	{/if}

	<div class="preview-notice">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="notice-icon"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
			/>
		</svg>
		<p>This section is for information only and will appear on the completed action plan.</p>
	</div>
</div>

<style>
	.red-zone-preview {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-6);
		background-color: rgba(239, 68, 68, 0.05);
		border: 2px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--radius-lg);
	}

	.zone-header {
		text-align: center;
	}

	.zone-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background-color: rgba(239, 68, 68, 0.1);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: #991b1b;
		margin-bottom: var(--space-2);
	}

	.zone-indicator {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		background-color: #ef4444;
	}

	.zone-description {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		max-width: 36rem;
		margin: 0 auto;
	}

	.resources-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.resource-card {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-white);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--radius-md);
	}

	.resource-icon {
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(239, 68, 68, 0.1);
		border-radius: var(--radius-sm);
		color: #dc2626;
	}

	.resource-icon svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.resource-content {
		flex: 1;
		min-width: 0;
	}

	.resource-name {
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.resource-contact {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: #dc2626;
		margin: var(--space-1) 0 0 0;
	}

	.resource-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: var(--space-1) 0 0 0;
	}

	.no-resources {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		padding: var(--space-4);
	}

	.preview-notice {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background-color: rgba(239, 68, 68, 0.05);
		border-radius: var(--radius-md);
	}

	.notice-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		color: #991b1b;
	}

	.preview-notice p {
		font-size: var(--font-size-sm);
		color: #991b1b;
		margin: 0;
	}
</style>
