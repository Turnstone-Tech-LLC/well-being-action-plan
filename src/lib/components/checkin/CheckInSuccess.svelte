<script lang="ts">
	import { goto } from '$app/navigation';
	import { announce } from '$lib/a11y';
	import { onMount } from 'svelte';
	import type { CheckInZone } from '$lib/db';

	interface Props {
		zone: CheckInZone;
		autoRedirectDelay?: number;
	}

	let { zone, autoRedirectDelay = 2500 }: Props = $props();

	const messages: Record<CheckInZone, { title: string; subtitle: string; emoji: string }> = {
		green: {
			title: 'Check-in saved!',
			subtitle: 'Keep it up!',
			emoji: '💚'
		},
		yellow: {
			title: "You're taking a good step",
			subtitle: 'Reach out to your supportive adult.',
			emoji: '💛'
		},
		red: {
			title: 'Help is on the way',
			subtitle: 'You did the right thing by reaching out.',
			emoji: '❤️'
		}
	};

	const currentMessage = $derived(messages[zone]);

	onMount(() => {
		// Announce for screen readers
		announce(`${currentMessage.title} ${currentMessage.subtitle}`);

		// Auto-redirect after delay
		const timer = setTimeout(() => {
			goto('/app');
		}, autoRedirectDelay);

		return () => clearTimeout(timer);
	});

	function handleContinue() {
		goto('/app');
	}
</script>

<div class="success-container zone-{zone}" role="status" aria-live="polite">
	<div class="success-content">
		<span class="success-emoji" aria-hidden="true">{currentMessage.emoji}</span>
		<h2 class="success-title">{currentMessage.title}</h2>
		<p class="success-subtitle">{currentMessage.subtitle}</p>
	</div>

	<button type="button" class="continue-button" onclick={handleContinue}>
		Back to Dashboard
	</button>
</div>

<style>
	.success-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: var(--space-6);
		text-align: center;
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.success-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-8);
	}

	.success-emoji {
		font-size: 4rem;
		line-height: 1;
		animation: pulse 0.5s ease-in-out;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	.success-title {
		font-size: var(--font-size-2xl);
		font-weight: 600;
		color: var(--color-gray-900);
		margin: 0;
	}

	.success-subtitle {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
		margin: 0;
		max-width: 300px;
	}

	/* Zone-specific styling */
	.zone-green .success-title {
		color: #2e7d32;
	}

	.zone-yellow .success-title {
		color: #f57f17;
	}

	.zone-red .success-title {
		color: #c62828;
	}

	.continue-button {
		padding: var(--space-3) var(--space-6);
		font-size: var(--font-size-base);
		font-weight: 500;
		color: var(--color-white);
		background-color: var(--color-accent);
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			transform 0.15s ease;
	}

	.continue-button:hover {
		background-color: var(--color-accent-dark, #004d41);
	}

	.continue-button:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.continue-button:active {
		transform: scale(0.98);
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.success-container,
		.success-emoji,
		.continue-button {
			animation: none;
			transition: none;
		}
	}

	/* Touch device optimizations */
	@media (pointer: coarse) {
		.continue-button {
			padding: var(--space-4) var(--space-8);
			min-height: 48px;
		}
	}
</style>
