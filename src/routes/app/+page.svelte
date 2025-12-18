<script lang="ts">
	import { planPayload } from '$lib/stores/localPlan';
	import { displayName } from '$lib/stores/patientProfile';

	// Reactive values from stores
	let payload = $derived($planPayload);
	let name = $derived($displayName);
</script>

<svelte:head>
	<title>Dashboard | Well-Being Action Plan</title>
	<meta name="description" content="Your Well-Being Action Plan dashboard" />
</svelte:head>

<section class="dashboard-page">
	<div class="dashboard-header">
		{#if name}
			<h1>Welcome back, {name}!</h1>
		{:else}
			<h1>Welcome to Your Dashboard</h1>
		{/if}
		<p class="subtitle">Your Well-Being Action Plan is ready to help you.</p>
	</div>

	{#if payload}
		<div class="quick-stats">
			<div class="stat-card">
				<span class="stat-value">{payload.skills.length}</span>
				<span class="stat-label">Coping Skills</span>
			</div>
			<div class="stat-card">
				<span class="stat-value">{payload.supportiveAdults.length}</span>
				<span class="stat-label">Supportive Adults</span>
			</div>
			<div class="stat-card">
				<span class="stat-value">{payload.helpMethods.length}</span>
				<span class="stat-label">Help Methods</span>
			</div>
		</div>

		<div class="coming-soon">
			<p>Full dashboard features coming soon...</p>
			<p class="muted">Your plan data is safely stored on this device.</p>
		</div>
	{/if}
</section>

<style>
	.dashboard-page {
		padding: var(--space-8) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.dashboard-header {
		text-align: center;
		margin-bottom: var(--space-8);
	}

	.dashboard-header h1 {
		font-size: var(--font-size-3xl);
		color: var(--color-gray-900);
		margin-bottom: var(--space-2);
	}

	.subtitle {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
	}

	.quick-stats {
		display: flex;
		gap: var(--space-4);
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: var(--space-8);
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-6);
		background-color: var(--color-bg-subtle);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		min-width: 140px;
	}

	.stat-value {
		font-size: var(--font-size-4xl);
		font-weight: 600;
		color: var(--color-primary);
		line-height: 1;
	}

	.stat-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-top: var(--space-2);
	}

	.coming-soon {
		text-align: center;
		padding: var(--space-8);
		background-color: var(--color-bg-subtle);
		border-radius: var(--radius-lg);
	}

	.coming-soon p {
		color: var(--color-text);
		font-size: var(--font-size-lg);
	}

	.coming-soon .muted {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin-top: var(--space-2);
	}

	@media (max-width: 480px) {
		.dashboard-header h1 {
			font-size: var(--font-size-2xl);
		}

		.quick-stats {
			flex-direction: column;
		}

		.stat-card {
			width: 100%;
		}
	}
</style>
