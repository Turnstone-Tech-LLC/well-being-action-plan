<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ValidatingState from '$lib/components/access/ValidatingState.svelte';
	import InvalidExpiredToken from '$lib/components/empty-states/InvalidExpiredToken.svelte';
	import AlreadyUsedToken from '$lib/components/empty-states/AlreadyUsedToken.svelte';
	import RevokedToken from '$lib/components/empty-states/RevokedToken.svelte';
	import UpdateExpiredToken from '$lib/components/empty-states/UpdateExpiredToken.svelte';
	import { hasLocalPlan, saveLocalPlan, generateDeviceInstallId } from '$lib/db';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type FlowState = 'checking_local' | 'validating' | 'installing' | 'redirecting' | 'error';

	let flowState: FlowState = $state('checking_local');
	let statusMessage = $state('Checking for existing plan...');

	onMount(async () => {
		// Step 1: Check for existing local plan
		const hasLocal = await hasLocalPlan();

		if (hasLocal) {
			// Bypass token validation - redirect to app
			statusMessage = 'Plan found! Redirecting...';
			flowState = 'redirecting';
			await goto('/app');
			return;
		}

		// Step 2: No local plan - process server-side validation result
		flowState = 'validating';
		statusMessage = 'Validating your access code...';

		// Server already validated the token in +page.server.ts
		if (data.tokenStatus !== 'valid') {
			// Invalid token - redirect to error handling (TUR-11)
			// For now, just show error state
			flowState = 'error';
			return;
		}

		// Step 3: Valid token - save plan locally
		flowState = 'installing';
		statusMessage = 'Installing your plan...';

		const deviceInstallId = generateDeviceInstallId();

		try {
			// Save to IndexedDB
			await saveLocalPlan({
				actionPlanId: data.actionPlanId!,
				revisionId: data.revisionId!,
				revisionVersion: data.revisionVersion!,
				accessCode: data.accessCode!,
				planPayload: data.planPayload!,
				deviceInstallId,
				installedAt: new Date(),
				lastAccessedAt: new Date()
			});

			// Step 4: Track install on server (marks token as used)
			const response = await fetch('/api/install', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					token: data.accessCode,
					deviceInstallId
				})
			});

			if (!response.ok) {
				console.warn('Failed to track install on server:', await response.text());
				// Continue anyway - local install succeeded
			}

			// Step 5: Redirect to onboarding
			flowState = 'redirecting';
			statusMessage = 'Success! Redirecting to setup...';

			await goto('/app/onboarding');
		} catch (err) {
			console.error('Failed to install plan:', err);
			flowState = 'error';
		}
	});
</script>

<svelte:head>
	<title>Access Your Plan | Well-Being Action Plan</title>
	<meta name="description" content="Access your Well-Being Action Plan" />
</svelte:head>

<section class="access-page">
	<div class="container">
		{#if flowState === 'error'}
			{#if data.tokenStatus === 'not_found' || data.tokenStatus === 'expired'}
				<InvalidExpiredToken />
			{:else if data.tokenStatus === 'used'}
				<AlreadyUsedToken />
			{:else if data.tokenStatus === 'revoked'}
				<RevokedToken />
			{:else if data.tokenStatus === 'update_expired'}
				<UpdateExpiredToken />
			{:else}
				<InvalidExpiredToken />
			{/if}
		{:else}
			<ValidatingState message={statusMessage} />
			<p class="note">Your plan data will be stored locally on this device for privacy.</p>
		{/if}
	</div>
</section>

<style>
	.access-page {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8) var(--space-4);
	}

	.container {
		max-width: 32rem;
		text-align: center;
	}

	.note {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-top: var(--space-4);
	}
</style>
