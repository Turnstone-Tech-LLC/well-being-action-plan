<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { planPayload, localPlan, localPlanLoading } from '$lib/stores/localPlan';
	import { saveCheckIn } from '$lib/db/checkIns';
	import { GreenZoneStep, CheckInSuccess } from '$lib/components/checkin';
	import { announce } from '$lib/a11y';
	import { get } from 'svelte/store';

	let showSuccess = $state(false);
	let saving = $state(false);
	let error = $state<string | null>(null);

	onMount(() => {
		// Check if we have a plan loaded
		if (!get(localPlanLoading) && !get(planPayload)) {
			announce('No action plan found. Redirecting to home.');
			goto('/app');
		}
	});

	async function handleComplete(selectedSkillIds: string[]) {
		if (saving) return;

		saving = true;
		error = null;

		try {
			const planData = get(localPlan);
			if (!planData) {
				throw new Error('No action plan found');
			}

			await saveCheckIn({
				actionPlanId: planData.actionPlanId,
				zone: 'green',
				strategiesUsed: selectedSkillIds,
				supportiveAdultsContacted: [],
				helpMethodsSelected: []
			});

			showSuccess = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save check-in';
			announce(`Error: ${error}`);
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Green Zone Check-In | Well-Being Action Plan</title>
	<meta name="description" content="Check in when you're feeling good" />
</svelte:head>

{#if $localPlanLoading}
	<div class="loading-state" role="status" aria-live="polite">
		<p>Loading your action plan...</p>
	</div>
{:else if showSuccess}
	<CheckInSuccess zone="green" />
{:else if error}
	<div class="error-state" role="alert">
		<p>{error}</p>
		<button type="button" onclick={() => goto('/app')}>Back to Dashboard</button>
	</div>
{:else}
	<GreenZoneStep skills={$planPayload?.skills ?? []} onComplete={handleComplete} />
{/if}

<style>
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		padding: var(--space-6);
		text-align: center;
	}

	.loading-state p {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
	}

	.error-state {
		gap: var(--space-4);
	}

	.error-state p {
		font-size: var(--font-size-lg);
		color: var(--color-error, #dc2626);
	}

	.error-state button {
		padding: var(--space-3) var(--space-6);
		font-size: var(--font-size-base);
		font-weight: 500;
		color: var(--color-white);
		background-color: var(--color-accent);
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
	}

	.error-state button:hover {
		background-color: var(--color-accent-dark, #004d41);
	}
</style>
