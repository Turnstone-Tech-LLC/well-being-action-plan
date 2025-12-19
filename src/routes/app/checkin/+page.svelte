<script lang="ts">
	import { goto } from '$app/navigation';
	import type { CheckInZone } from '$lib/db';
	import { ZoneSelector } from '$lib/components/checkin';
	import { announce } from '$lib/a11y';

	let selectedZone: CheckInZone | null = $state(null);

	function handleZoneSelect(zone: CheckInZone) {
		selectedZone = zone;

		// Announce selection for screen readers
		const zoneLabels: Record<CheckInZone, string> = {
			green: "I'm feeling good",
			yellow: "I'm struggling",
			red: 'I need help now'
		};
		announce(`Selected: ${zoneLabels[zone]}. Proceeding to next step.`);

		// Navigate to appropriate next step based on zone
		// For now, use URL params to pass zone to next step
		if (zone === 'red') {
			// Red zone goes to crisis response
			goto(`/app/checkin/crisis?zone=${zone}`);
		} else {
			// Green and Yellow zones go to strategy selection
			goto(`/app/checkin/strategies?zone=${zone}`);
		}
	}
</script>

<svelte:head>
	<title>Check In | Well-Being Action Plan</title>
	<meta name="description" content="Check in on how you're feeling today" />
</svelte:head>

<section class="checkin-page" aria-labelledby="checkin-heading">
	<header class="page-header">
		<h1 id="checkin-heading">How are you feeling?</h1>
		<p class="subheader">It's okay to have different feelings. Let's check in.</p>
	</header>

	<ZoneSelector {selectedZone} onZoneSelect={handleZoneSelect} />

	<footer class="page-footer">
		<p class="reassurance">Your feelings are valid. We're here to help.</p>
	</footer>
</section>

<style>
	.checkin-page {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--nav-height) - 120px);
		padding: var(--space-6) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.page-header {
		text-align: center;
		margin-bottom: var(--space-6);
	}

	.page-header h1 {
		font-size: var(--font-size-3xl);
		color: var(--color-gray-900);
		margin-bottom: var(--space-2);
	}

	.subheader {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
		margin: 0;
	}

	.page-footer {
		margin-top: auto;
		padding-top: var(--space-8);
		text-align: center;
	}

	.reassurance {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.checkin-page {
			padding: var(--space-4) var(--space-3);
		}

		.page-header h1 {
			font-size: var(--font-size-2xl);
		}

		.subheader {
			font-size: var(--font-size-base);
		}
	}

	@media (min-width: 768px) {
		.checkin-page {
			padding: var(--space-10) var(--space-6);
		}

		.page-header {
			margin-bottom: var(--space-10);
		}
	}
</style>
