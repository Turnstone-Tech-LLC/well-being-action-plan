<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { localPlanStore, hasPlan } from '$lib/stores/localPlan';
	import { patientProfileStore, onboardingComplete } from '$lib/stores/patientProfile';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let initialized = $state(false);
	let checking = $state(true);

	// Check if we're on the onboarding page
	let isOnboardingRoute = $derived($page.url.pathname === '/app/onboarding');

	onMount(async () => {
		if (!browser) return;

		// Initialize both stores
		await localPlanStore.init();
		await patientProfileStore.init();

		initialized = true;

		// After initialization, check routing
		await checkRouting();
	});

	// Re-check routing when stores change
	$effect(() => {
		if (initialized && browser) {
			checkRouting();
		}
	});

	async function checkRouting() {
		checking = true;

		// Check if user has a plan
		if (!$hasPlan) {
			// No plan installed - redirect to home
			await goto('/');
			checking = false;
			return;
		}

		// If not on onboarding route, check if onboarding is complete
		if (!isOnboardingRoute && !$onboardingComplete) {
			// Onboarding not complete - redirect to onboarding
			await goto('/app/onboarding');
			checking = false;
			return;
		}

		// If on onboarding route but already completed, redirect to dashboard
		if (isOnboardingRoute && $onboardingComplete) {
			await goto('/app');
			checking = false;
			return;
		}

		checking = false;
	}
</script>

{#if checking && !isOnboardingRoute}
	<div class="loading-state" role="status" aria-live="polite">
		<div class="spinner" aria-hidden="true"></div>
		<p>Loading...</p>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - var(--nav-height) - 4rem);
		gap: var(--space-4);
	}

	.spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 3px solid var(--color-gray-200);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-state p {
		color: var(--color-text-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
			border-top-color: var(--color-primary);
			border-left-color: var(--color-primary);
		}
	}
</style>
