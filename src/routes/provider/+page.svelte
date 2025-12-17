<script lang="ts">
	import ActionPlansList from '$lib/components/provider/ActionPlansList.svelte';
	import DashboardEmptyState from '$lib/components/provider/DashboardEmptyState.svelte';

	let { data } = $props();

	const hasPlans = $derived(data.actionPlans && data.actionPlans.length > 0);
</script>

<svelte:head>
	<title>Provider Dashboard | Well-Being Action Plan</title>
	<meta name="description" content="Provider dashboard for managing Well-Being Action Plans" />
</svelte:head>

<section class="dashboard">
	<div class="dashboard-header">
		<div class="header-content">
			<h1>Action Plans</h1>
			<p class="welcome">
				Welcome back, {data.provider.name || data.provider.email}
			</p>
		</div>
	</div>

	<div class="dashboard-content">
		{#if hasPlans}
			<ActionPlansList plans={data.actionPlans} />
		{:else}
			<div class="empty-state-container">
				<DashboardEmptyState />
			</div>
		{/if}
	</div>
</section>

<style>
	.dashboard {
		flex: 1;
		padding: var(--space-8) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-6);
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	h1 {
		color: var(--color-primary);
	}

	.welcome {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	.dashboard-content {
		display: grid;
		gap: var(--space-6);
	}

	.empty-state-container {
		background-color: var(--color-white);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-md);
		padding: var(--space-8);
	}
</style>
