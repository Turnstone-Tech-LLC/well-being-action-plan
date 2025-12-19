<script lang="ts">
	import type { CheckInZone } from '$lib/db';

	interface Props {
		zone: CheckInZone;
		title: string;
		subtitle: string;
		emoji: string;
		selected?: boolean;
		onSelect: (zone: CheckInZone) => void;
	}

	let { zone, title, subtitle, emoji, selected = false, onSelect }: Props = $props();

	function handleClick() {
		onSelect(zone);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onSelect(zone);
		}
	}
</script>

<button
	type="button"
	class="zone-card zone-{zone}"
	class:selected
	onclick={handleClick}
	onkeydown={handleKeyDown}
	aria-pressed={selected}
	aria-describedby="zone-{zone}-desc"
>
	<span class="zone-emoji" aria-hidden="true">{emoji}</span>
	<span class="zone-title">{title}</span>
	<span class="zone-subtitle" id="zone-{zone}-desc">{subtitle}</span>
</button>

<style>
	.zone-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-6) var(--space-4);
		border: 3px solid transparent;
		border-radius: var(--radius-xl);
		background-color: var(--color-white);
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;
		text-align: center;
		width: 100%;
		min-height: 180px;
	}

	.zone-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.zone-card:active {
		transform: translateY(-2px);
	}

	.zone-card:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	/* Green zone styles */
	.zone-green {
		background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
		border-color: #66bb6a;
	}

	.zone-green:hover {
		border-color: #43a047;
	}

	.zone-green.selected {
		border-color: #2e7d32;
		box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.3);
	}

	/* Yellow zone styles */
	.zone-yellow {
		background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
		border-color: #ffca28;
	}

	.zone-yellow:hover {
		border-color: #ffb300;
	}

	.zone-yellow.selected {
		border-color: #f9a825;
		box-shadow: 0 0 0 3px rgba(249, 168, 37, 0.3);
	}

	/* Red zone styles */
	.zone-red {
		background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
		border-color: #ef5350;
	}

	.zone-red:hover {
		border-color: #e53935;
	}

	.zone-red.selected {
		border-color: #c62828;
		box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.3);
	}

	.zone-emoji {
		font-size: 3rem;
		line-height: 1;
	}

	.zone-title {
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--color-gray-900);
	}

	.zone-subtitle {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		line-height: 1.4;
		max-width: 200px;
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.zone-card {
			transition: none;
		}

		.zone-card:hover {
			transform: none;
		}
	}

	/* Touch device optimizations */
	@media (pointer: coarse) {
		.zone-card {
			min-height: 200px;
			padding: var(--space-8) var(--space-6);
		}

		.zone-card:hover {
			transform: none;
		}

		.zone-card:active {
			transform: scale(0.98);
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.zone-card {
			border: 3px solid currentColor;
		}

		.zone-card.selected {
			outline: 3px solid highlight;
		}
	}
</style>
