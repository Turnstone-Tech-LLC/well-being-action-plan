<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ValidatingState from '$lib/components/access/ValidatingState.svelte';
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
			// TODO: Redirect to actual app view when implemented
			await goto('/');
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

			// Step 5: Redirect to app
			flowState = 'redirecting';
			statusMessage = 'Success! Redirecting to your plan...';

			// TODO: Redirect to actual app view when implemented
			await goto('/');
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
			<div class="error-state">
				<h1>Unable to Access Plan</h1>
				{#if data.tokenStatus === 'not_found'}
					<p class="description">
						This access code was not found. Please check the link and try again.
					</p>
				{:else if data.tokenStatus === 'expired'}
					<p class="description">
						This access code has expired. Please contact your provider for a new link.
					</p>
				{:else if data.tokenStatus === 'used'}
					<p class="description">
						This access code has already been used. If you need to access your plan on a new device,
						please contact your provider.
					</p>
				{:else if data.tokenStatus === 'revoked'}
					<p class="description">
						This access code is no longer valid. Please contact your provider.
					</p>
				{:else}
					<p class="description">
						We encountered an error loading your plan. Please try again or contact your provider.
					</p>
				{/if}
				<a href="/" class="btn btn-primary">Return Home</a>
			</div>
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

	.error-state h1 {
		color: var(--color-primary);
		margin-bottom: var(--space-4);
	}

	.description {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
		margin-bottom: var(--space-6);
	}

	.note {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-top: var(--space-4);
	}
</style>
