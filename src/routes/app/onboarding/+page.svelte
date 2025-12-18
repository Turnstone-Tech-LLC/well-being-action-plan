<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import WelcomeStep from '$lib/components/onboarding/WelcomeStep.svelte';
	import ProfileSetupStep from '$lib/components/onboarding/ProfileSetupStep.svelte';
	import NotificationStep from '$lib/components/onboarding/NotificationStep.svelte';
	import ValidatingState from '$lib/components/access/ValidatingState.svelte';
	import { localPlanStore, localPlan, planPayload, hasPlan } from '$lib/stores/localPlan';
	import { patientProfileStore, patientProfile } from '$lib/stores/patientProfile';
	import {
		createPatientProfile,
		completeOnboarding,
		updateNotificationPreferences
	} from '$lib/db/profile';
	import type { NotificationFrequency, NotificationTime } from '$lib/db';
	import { announce } from '$lib/a11y';

	type OnboardingStep = 'loading' | 'welcome' | 'profile' | 'notifications' | 'complete';

	let currentStep: OnboardingStep = $state('loading');
	let statusMessage = $state('Loading your plan...');

	// Get reactive values from stores
	let plan = $derived($localPlan);
	let payload = $derived($planPayload);

	onMount(async () => {
		if (!browser) return;

		// Initialize stores
		await localPlanStore.init();
		await patientProfileStore.init();

		// Check if user has a plan installed
		if (!$hasPlan) {
			// No plan - redirect to home
			await goto('/');
			return;
		}

		// Check if onboarding is already complete
		const currentProfile = $patientProfile;
		if (currentProfile?.onboardingComplete) {
			// Already onboarded - redirect to app dashboard
			await goto('/app');
			return;
		}

		// Show welcome step
		currentStep = 'welcome';
		announce('Welcome to your Well-Being Action Plan');
	});

	function handleWelcomeContinue() {
		currentStep = 'profile';
		announce('Step 2: Profile setup');
	}

	function handleProfileBack() {
		currentStep = 'welcome';
		announce('Step 1: Welcome');
	}

	async function handleProfileContinue(displayName: string) {
		if (!plan) return;

		currentStep = 'loading';
		statusMessage = 'Saving your profile...';

		try {
			// Create/update patient profile
			await createPatientProfile({
				actionPlanId: plan.actionPlanId,
				displayName
			});

			// Move to notifications step
			currentStep = 'notifications';
			announce('Step 3: Notification settings');
		} catch (error) {
			console.error('Failed to save profile:', error);
			currentStep = 'profile';
			announce('Failed to save profile. Please try again.');
		}
	}

	function handleNotificationsBack() {
		currentStep = 'profile';
		announce('Step 2: Profile setup');
	}

	async function handleNotificationsContinue(settings: {
		notificationsEnabled: boolean;
		notificationFrequency: NotificationFrequency;
		notificationTime: NotificationTime;
	}) {
		if (!plan) return;

		currentStep = 'loading';
		statusMessage = 'Finishing setup...';

		try {
			// Save notification preferences
			await updateNotificationPreferences({
				actionPlanId: plan.actionPlanId,
				notificationsEnabled: settings.notificationsEnabled,
				notificationFrequency: settings.notificationFrequency,
				notificationTime: settings.notificationTime
			});

			// Mark onboarding as complete
			await completeOnboarding(plan.actionPlanId);

			// Refresh the store
			await patientProfileStore.refresh();

			statusMessage = 'All set! Redirecting...';
			announce('Setup complete. Redirecting to your dashboard.');

			// Redirect to app dashboard
			await goto('/app');
		} catch (error) {
			console.error('Failed to complete setup:', error);
			currentStep = 'notifications';
			announce('Failed to complete setup. Please try again.');
		}
	}

	// Calculate step indicator
	function getStepNumber(step: OnboardingStep): number {
		switch (step) {
			case 'welcome':
				return 1;
			case 'profile':
				return 2;
			case 'notifications':
				return 3;
			case 'complete':
				return 4;
			default:
				return 0;
		}
	}

	let stepNumber = $derived(getStepNumber(currentStep));
	let totalSteps = 3;
</script>

<svelte:head>
	<title>Welcome | Well-Being Action Plan</title>
	<meta name="description" content="Set up your Well-Being Action Plan" />
</svelte:head>

<section class="onboarding-page" aria-labelledby="onboarding-heading">
	<h1 id="onboarding-heading" class="visually-hidden">Onboarding</h1>

	{#if currentStep !== 'loading' && stepNumber > 0}
		<div class="step-indicator" role="navigation" aria-label="Onboarding progress">
			<span class="step-text">Step {stepNumber} of {totalSteps}</span>
			<div class="step-dots" aria-hidden="true">
				{#each Array.from({ length: totalSteps }, (_, idx) => idx) as i (i)}
					<span class="step-dot" class:active={i < stepNumber} class:current={i === stepNumber - 1}
					></span>
				{/each}
			</div>
		</div>
	{/if}

	<div class="onboarding-content">
		{#if currentStep === 'loading'}
			<ValidatingState message={statusMessage} />
		{:else if currentStep === 'welcome' && payload}
			<WelcomeStep planPayload={payload} onContinue={handleWelcomeContinue} />
		{:else if currentStep === 'profile' && payload}
			<ProfileSetupStep
				initialName={payload.patientNickname || ''}
				onContinue={handleProfileContinue}
				onBack={handleProfileBack}
			/>
		{:else if currentStep === 'notifications'}
			<NotificationStep onContinue={handleNotificationsContinue} onBack={handleNotificationsBack} />
		{/if}
	</div>
</section>

<style>
	.onboarding-page {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--nav-height) - 4rem);
	}

	.step-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4);
	}

	.step-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.step-dots {
		display: flex;
		gap: var(--space-2);
	}

	.step-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--color-gray-300);
		transition: all 0.2s ease;
	}

	.step-dot.active {
		background-color: var(--color-primary);
	}

	.step-dot.current {
		width: 24px;
		border-radius: 4px;
	}

	.onboarding-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	@media (prefers-reduced-motion: reduce) {
		.step-dot {
			transition: none;
		}
	}
</style>
