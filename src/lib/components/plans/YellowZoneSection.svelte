<script lang="ts">
	interface HelpMethod {
		id: string;
		title: string;
		description: string;
		additionalInfo?: string;
		displayOrder: number;
	}

	interface Props {
		helpMethods: HelpMethod[];
	}

	let { helpMethods }: Props = $props();

	const sortedMethods = $derived([...helpMethods].sort((a, b) => a.displayOrder - b.displayOrder));
</script>

<section class="yellow-zone-section detail-section" aria-labelledby="yellow-zone-heading">
	<header class="section-header yellow-header">
		<h2 id="yellow-zone-heading">Yellow Zone - Getting Help</h2>
		<span class="zone-badge zone-badge-yellow">
			<span class="zone-indicator"></span>
			{helpMethods.length} method{helpMethods.length === 1 ? '' : 's'}
		</span>
	</header>

	<div class="section-content">
		<p class="section-intro">When I'm in the yellow zone and need help, I can try these things:</p>

		{#if helpMethods.length > 0}
			<ul class="methods-list" role="list">
				{#each sortedMethods as method (method.id)}
					<li class="method-item">
						<div class="method-header">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="method-icon"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
								/>
							</svg>
							<span class="method-title">{method.title}</span>
						</div>
						{#if method.description}
							<p class="method-description">{method.description}</p>
						{/if}
						{#if method.additionalInfo}
							<p class="method-additional">"{method.additionalInfo}"</p>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty-message">No help methods selected.</p>
		{/if}
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

	.yellow-header {
		background: linear-gradient(135deg, rgba(253, 224, 71, 0.1) 0%, rgba(253, 224, 71, 0.2) 100%);
		border-bottom: 2px solid rgba(251, 191, 36, 0.3);
	}

	.section-header h2 {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: #92400e;
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

	.zone-badge-yellow {
		background-color: rgba(253, 224, 71, 0.2);
		color: #92400e;
	}

	.zone-badge-yellow .zone-indicator {
		background-color: #fbbf24;
	}

	.section-content {
		padding: var(--space-5);
	}

	.section-intro {
		margin: 0 0 var(--space-4);
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	.methods-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.method-item {
		padding: var(--space-3) var(--space-4);
		background-color: rgba(253, 224, 71, 0.05);
		border-radius: var(--radius-md);
		border-left: 3px solid #fbbf24;
	}

	.method-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.method-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: #92400e;
		flex-shrink: 0;
	}

	.method-title {
		font-weight: 500;
		color: var(--color-text);
	}

	.method-description {
		margin: var(--space-2) 0 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		line-height: 1.5;
		padding-left: calc(1.25rem + var(--space-2));
	}

	.method-additional {
		margin: var(--space-2) 0 0;
		font-size: var(--font-size-sm);
		color: #92400e;
		font-style: italic;
		padding-left: calc(1.25rem + var(--space-2));
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

		.yellow-header {
			background: rgba(253, 224, 71, 0.1);
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		.method-item {
			background-color: rgba(253, 224, 71, 0.05);
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
	}
</style>
