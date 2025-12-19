<script lang="ts">
	import type { CheckInZone } from '$lib/db';
	import ZoneCard from './ZoneCard.svelte';

	interface ZoneContent {
		zone: CheckInZone;
		title: string;
		subtitle: string;
		emoji: string;
	}

	interface Props {
		selectedZone?: CheckInZone | null;
		onZoneSelect: (zone: CheckInZone) => void;
	}

	let { selectedZone = null, onZoneSelect }: Props = $props();

	const zones: ZoneContent[] = [
		{
			zone: 'green',
			title: "I'm feeling good",
			subtitle: "I'm happy most of the day",
			emoji: '😊'
		},
		{
			zone: 'yellow',
			title: "I'm struggling",
			subtitle: "My coping skills aren't helping enough",
			emoji: '😟'
		},
		{
			zone: 'red',
			title: 'I need help now',
			subtitle: 'I feel unsafe or am thinking about hurting myself',
			emoji: '😢'
		}
	];

	function handleSelect(zone: CheckInZone) {
		onZoneSelect(zone);
	}
</script>

<div class="zone-selector" role="group" aria-label="Select how you're feeling">
	<div class="zone-cards">
		{#each zones as zoneContent (zoneContent.zone)}
			<ZoneCard
				zone={zoneContent.zone}
				title={zoneContent.title}
				subtitle={zoneContent.subtitle}
				emoji={zoneContent.emoji}
				selected={selectedZone === zoneContent.zone}
				onSelect={handleSelect}
			/>
		{/each}
	</div>
</div>

<style>
	.zone-selector {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
	}

	.zone-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: var(--space-4);
		padding: var(--space-4);
	}

	/* Stack cards on small screens */
	@media (max-width: 600px) {
		.zone-cards {
			grid-template-columns: 1fr;
			gap: var(--space-3);
		}
	}

	/* On larger screens, show in a row */
	@media (min-width: 768px) {
		.zone-cards {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
