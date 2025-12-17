<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
</script>

<svelte:head>
	<title>Provider Dashboard | Well-Being Action Plan</title>
	<meta name="description" content="Provider dashboard for managing Well-Being Action Plans" />
</svelte:head>

<section class="dashboard">
	<div class="dashboard-header">
		<div class="header-content">
			<h1>Provider Dashboard</h1>
			<p class="welcome">Welcome, {data.user.email}</p>
		</div>
		<form method="POST" action="/auth/logout" use:enhance>
			<button type="submit" class="btn btn-outline">Sign Out</button>
		</form>
	</div>

	<div class="dashboard-content">
		<div class="placeholder-card">
			<h2>Coming Soon</h2>
			<p>
				The provider dashboard is under development. You'll be able to create and manage Well-Being
				Action Plans for your patients here.
			</p>
		</div>
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
		margin-bottom: var(--space-8);
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

	.placeholder-card {
		background-color: var(--color-white);
		padding: var(--space-8);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-md);
		text-align: center;
	}

	.placeholder-card h2 {
		color: var(--color-primary);
		margin-bottom: var(--space-4);
	}

	.placeholder-card p {
		color: var(--color-text-muted);
		max-width: 36rem;
		margin: 0 auto;
	}
</style>
