<script lang="ts">
	// Reports page - will use patient data when check-in history is implemented
</script>

<svelte:head>
	<title>Reports | Well-Being Action Plan</title>
	<meta name="description" content="View your check-in history and well-being reports" />
</svelte:head>

<div class="reports-page">
	<header class="page-header">
		<h1>Reports</h1>
		<p class="subtitle">Track your well-being journey</p>
	</header>

	<section class="coming-soon" aria-label="Coming soon">
		<div class="empty-state">
			<span class="empty-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			</span>
			<h2>Reports coming soon</h2>
			<p>
				Once you start checking in, you'll be able to see your well-being trends and patterns here.
			</p>
		</div>
	</section>
</div>

<style>
	.reports-page {
		padding: var(--space-6) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.page-header {
		text-align: center;
		margin-bottom: var(--space-8);
	}

	.page-header h1 {
		font-size: var(--font-size-2xl);
		color: var(--color-gray-900);
		margin-bottom: var(--space-2);
	}

	.subtitle {
		font-size: var(--font-size-base);
		color: var(--color-text-muted);
	}

	.coming-soon {
		padding: var(--space-8);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		text-align: center;
		padding: var(--space-8) var(--space-4);
		background-color: var(--color-bg-subtle);
		border: 1px dashed var(--color-gray-300);
		border-radius: var(--radius-lg);
		max-width: 400px;
		margin: 0 auto;
	}

	.empty-icon {
		width: 48px;
		height: 48px;
		color: var(--color-gray-400);
	}

	.empty-icon svg {
		width: 100%;
		height: 100%;
	}

	.empty-state h2 {
		font-size: var(--font-size-lg);
		color: var(--color-gray-700);
	}

	.empty-state p {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		line-height: 1.6;
	}
</style>
