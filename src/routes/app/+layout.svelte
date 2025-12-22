<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { localPlanStore, hasPlan, localPlan } from '$lib/stores/localPlan';
	import { patientProfileStore, onboardingComplete } from '$lib/stores/patientProfile';
	import { PatientNav } from '$lib/components/app';
	import { getNextAppointmentDate } from '$lib/db/profile';
	import { checkAndShowAppointmentReminder } from '$lib/notifications';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let initialized = $state(false);
	let checking = $state(true);

	// Non-reactive guard to prevent multiple navigations
	// Using a plain variable instead of $state to avoid triggering effects
	let hasNavigated = false;

	// Check if we're on the onboarding page
	let isOnboardingRoute = $derived($page.url.pathname === '/app/onboarding');

	// Show navigation only when not on onboarding and when onboarding is complete
	let showNav = $derived(!isOnboardingRoute && $onboardingComplete);

	onMount(async () => {
		if (!browser) return;

		// Initialize both stores
		await localPlanStore.init();
		await patientProfileStore.init();

		initialized = true;

		// After initialization, check routing
		await checkRouting();

		// Check for appointment reminders after routing is done
		await checkAppointmentReminder();
	});

	/**
	 * Check if an appointment reminder should be shown.
	 * This is done once when the app loads if the user has completed onboarding.
	 */
	async function checkAppointmentReminder() {
		const plan = $localPlan;
		if (!plan?.actionPlanId || !$onboardingComplete) return;

		try {
			const appointmentDate = await getNextAppointmentDate(plan.actionPlanId);
			if (appointmentDate) {
				await checkAndShowAppointmentReminder(appointmentDate);
			}
		} catch (err) {
			console.warn('Failed to check appointment reminder:', err);
		}
	}

	// Re-check routing when plan is cleared
	$effect(() => {
		// Read the reactive value to track it
		const hasLocalPlan = $hasPlan;

		if (initialized && browser && !hasLocalPlan && !hasNavigated) {
			hasNavigated = true;
			goto('/');
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
	<div class="app-layout" class:has-nav={showNav}>
		{#if showNav}
			<PatientNav />
		{/if}
		<main class="app-content">
			{@render children()}
		</main>
	</div>
{/if}

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* Mobile: nav is fixed at bottom, so add padding */
	.app-layout.has-nav {
		padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
	}

	.app-content {
		flex: 1;
	}

	/* Desktop: nav is at top */
	@media (min-width: 768px) {
		.app-layout.has-nav {
			padding-bottom: 0;
		}
	}

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
