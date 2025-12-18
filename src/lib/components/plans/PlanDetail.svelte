<script lang="ts">
	import type { PlanPayload } from '$lib/db';
	import type { InstallToken } from '$lib/server/types';
	import GreenZoneSection from './GreenZoneSection.svelte';
	import YellowZoneSection from './YellowZoneSection.svelte';
	import RedZoneSection from './RedZoneSection.svelte';
	import TokenInfo from './TokenInfo.svelte';

	interface Props {
		planPayload: PlanPayload;
		activeToken: InstallToken | null;
	}

	let { planPayload, activeToken }: Props = $props();
</script>

<div class="plan-detail">
	<!-- Token/Link Info Section -->
	{#if activeToken}
		<TokenInfo token={activeToken} />
	{/if}

	<!-- About Me Section -->
	{#if planPayload.happyWhen || planPayload.happyBecause}
		<section class="detail-section about-section" aria-labelledby="about-heading">
			<header class="section-header">
				<h2 id="about-heading">About Me</h2>
				<span class="zone-badge zone-badge-blue">
					<span class="zone-indicator"></span>
					Personal
				</span>
			</header>
			<div class="section-content">
				<div class="reflective-questions">
					{#if planPayload.happyWhen}
						<div class="reflective-item">
							<span class="reflective-label">I feel happy when...</span>
							<p class="reflective-value">{planPayload.happyWhen}</p>
						</div>
					{/if}
					{#if planPayload.happyBecause}
						<div class="reflective-item">
							<span class="reflective-label">I can tell I'm happy because...</span>
							<p class="reflective-value">{planPayload.happyBecause}</p>
						</div>
					{/if}
				</div>
			</div>
		</section>
	{/if}

	<!-- Green Zone Section -->
	<GreenZoneSection skills={planPayload.skills} supportiveAdults={planPayload.supportiveAdults} />

	<!-- Yellow Zone Section -->
	<YellowZoneSection helpMethods={planPayload.helpMethods} />

	<!-- Red Zone Section -->
	<RedZoneSection crisisResources={planPayload.crisisResources} />
</div>

<style>
	.plan-detail {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

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
		background-color: var(--color-gray-50);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.section-header h2 {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
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

	.zone-badge-blue {
		background-color: rgba(59, 130, 246, 0.1);
		color: #1d4ed8;
	}

	.zone-badge-blue .zone-indicator {
		background-color: #3b82f6;
	}

	.section-content {
		padding: var(--space-5);
	}

	.reflective-questions {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.reflective-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.reflective-label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.reflective-value {
		font-size: var(--font-size-base);
		color: var(--color-text);
		margin: 0;
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
		font-style: italic;
		line-height: 1.5;
	}

	@media print {
		.plan-detail {
			gap: var(--space-4);
		}

		.detail-section {
			box-shadow: none;
			border: 1px solid var(--color-gray-200);
			break-inside: avoid;
		}
	}
</style>
