<script lang="ts">
	interface CrisisResource {
		id: string;
		name: string;
		contact: string;
		contactType: string;
		description: string;
		displayOrder: number;
	}

	interface Props {
		crisisResources: CrisisResource[];
	}

	let { crisisResources }: Props = $props();

	const sortedResources = $derived(
		[...crisisResources].sort((a, b) => a.displayOrder - b.displayOrder)
	);

	function getContactTypeLabel(type: string): string {
		switch (type) {
			case 'phone':
				return 'Call';
			case 'text':
				return 'Text';
			case 'website':
				return 'Website';
			default:
				return type;
		}
	}

	function getContactTypeIcon(type: string): string {
		switch (type) {
			case 'phone':
				return 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z';
			case 'text':
				return 'M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z';
			case 'website':
				return 'M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418';
			default:
				return 'M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z';
		}
	}
</script>

<section class="red-zone-section detail-section" aria-labelledby="red-zone-heading">
	<header class="section-header red-header">
		<h2 id="red-zone-heading">Red Zone - Crisis Resources</h2>
		<span class="zone-badge zone-badge-red">
			<span class="zone-indicator"></span>
			Emergency Help
		</span>
	</header>

	<div class="section-content">
		<p class="section-intro">
			If I'm in crisis or having thoughts of hurting myself, I can reach out to these resources:
		</p>

		{#if crisisResources.length > 0}
			<div class="resources-grid">
				{#each sortedResources as resource (resource.id)}
					<div class="resource-card">
						<div class="resource-header">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="resource-type-icon"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d={getContactTypeIcon(resource.contactType)}
								/>
							</svg>
							<div class="resource-title-group">
								<h3 class="resource-name">{resource.name}</h3>
								<span class="contact-type-badge">
									{getContactTypeLabel(resource.contactType)}
								</span>
							</div>
						</div>
						<div class="resource-contact">
							{#if resource.contactType === 'website'}
								<a
									href={resource.contact.startsWith('http')
										? resource.contact
										: `https://${resource.contact}`}
									target="_blank"
									rel="noopener noreferrer"
									class="contact-link"
								>
									{resource.contact}
								</a>
							{:else if resource.contactType === 'phone'}
								<a href="tel:{resource.contact.replace(/\D/g, '')}" class="contact-link">
									{resource.contact}
								</a>
							{:else if resource.contactType === 'text'}
								<a href="sms:{resource.contact.replace(/\D/g, '')}" class="contact-link">
									{resource.contact}
								</a>
							{:else}
								<span class="contact-value">{resource.contact}</span>
							{/if}
						</div>
						{#if resource.description}
							<p class="resource-description">{resource.description}</p>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p class="empty-message">No crisis resources configured.</p>
		{/if}

		<div class="emergency-reminder">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="reminder-icon"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
				/>
			</svg>
			<p>
				<strong
					>In a life-threatening emergency, always call 911 or go to your nearest emergency room.</strong
				>
			</p>
		</div>
	</div>
</section>

<style>
	.detail-section {
		background-color: var(--color-white);
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.red-header {
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.1) 100%);
		border-bottom: 2px solid rgba(239, 68, 68, 0.2);
	}

	.section-header h2 {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: #b91c1c;
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

	.zone-badge-red {
		background-color: rgba(239, 68, 68, 0.1);
		color: #b91c1c;
	}

	.zone-badge-red .zone-indicator {
		background-color: #ef4444;
	}

	.section-content {
		padding: var(--space-5);
	}

	.section-intro {
		margin: 0 0 var(--space-4);
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	.resources-grid {
		display: grid;
		gap: var(--space-4);
	}

	@media (min-width: 640px) {
		.resources-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.resource-card {
		padding: var(--space-4);
		background-color: rgba(239, 68, 68, 0.03);
		border-radius: var(--radius-lg);
		border: 1px solid rgba(239, 68, 68, 0.15);
	}

	.resource-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}

	.resource-type-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: #b91c1c;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.resource-title-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.resource-name {
		margin: 0;
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text);
	}

	.contact-type-badge {
		font-size: var(--font-size-xs);
		color: #b91c1c;
		background-color: rgba(239, 68, 68, 0.1);
		padding: 2px var(--space-2);
		border-radius: var(--radius-sm);
		width: fit-content;
	}

	.resource-contact {
		margin-left: calc(1.5rem + var(--space-3));
		margin-bottom: var(--space-2);
	}

	.contact-link {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: #b91c1c;
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.contact-link:hover {
		text-decoration: underline;
		color: #991b1b;
	}

	.contact-link:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.contact-value {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: #b91c1c;
	}

	.resource-description {
		margin: 0;
		margin-left: calc(1.5rem + var(--space-3));
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.emergency-reminder {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-top: var(--space-6);
		padding: var(--space-4);
		background-color: rgba(239, 68, 68, 0.08);
		border-radius: var(--radius-lg);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.reminder-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: #b91c1c;
		flex-shrink: 0;
	}

	.emergency-reminder p {
		margin: 0;
		font-size: var(--font-size-sm);
		color: #b91c1c;
		line-height: 1.5;
	}

	.empty-message {
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0;
		text-align: center;
		padding: var(--space-6);
	}

	@media print {
		.detail-section {
			box-shadow: none;
			border: 1px solid var(--color-gray-200);
			break-inside: avoid;
		}

		.red-header {
			background: rgba(239, 68, 68, 0.05);
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		.resource-card {
			background-color: rgba(239, 68, 68, 0.02);
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		.emergency-reminder {
			background-color: rgba(239, 68, 68, 0.05);
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		.contact-link {
			color: #b91c1c;
			text-decoration: none;
		}
	}
</style>
