<script lang="ts">
	interface Props {
		rows?: number;
	}

	let { rows = 3 }: Props = $props();
</script>

<div class="skeleton-container" role="status" aria-label="Loading content" aria-busy="true">
	<div class="skeleton-header">
		<div class="skeleton-line skeleton-title"></div>
		<div class="skeleton-button"></div>
	</div>

	<div class="skeleton-table">
		<div class="skeleton-table-header">
			<div class="skeleton-cell"></div>
			<div class="skeleton-cell"></div>
			<div class="skeleton-cell"></div>
			<div class="skeleton-cell"></div>
		</div>
		{#each Array.from({ length: rows }, (_, i) => i) as i (i)}
			<div class="skeleton-table-row">
				<div class="skeleton-cell"></div>
				<div class="skeleton-cell skeleton-badge"></div>
				<div class="skeleton-cell"></div>
				<div class="skeleton-cell"></div>
			</div>
		{/each}
	</div>

	<span class="visually-hidden">Loading action plans...</span>
</div>

<style>
	.skeleton-container {
		background-color: var(--color-white);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-md);
		overflow: hidden;
	}

	.skeleton-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.skeleton-title {
		width: 200px;
		height: 2.5rem;
	}

	.skeleton-button {
		width: 140px;
		height: 2.5rem;
		border-radius: var(--radius-md);
		background: linear-gradient(
			90deg,
			var(--color-gray-100) 25%,
			var(--color-gray-200) 50%,
			var(--color-gray-100) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-line {
		height: 1rem;
		background: linear-gradient(
			90deg,
			var(--color-gray-100) 25%,
			var(--color-gray-200) 50%,
			var(--color-gray-100) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.skeleton-table-header {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-gray-50);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.skeleton-table-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: var(--space-4);
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-gray-100);
	}

	.skeleton-cell {
		height: 1rem;
		background: linear-gradient(
			90deg,
			var(--color-gray-100) 25%,
			var(--color-gray-200) 50%,
			var(--color-gray-100) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: var(--radius-sm);
	}

	.skeleton-badge {
		width: 60px;
		height: 1.5rem;
		border-radius: var(--radius-sm);
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.visually-hidden {
		border: 0;
		clip: rect(0 0 0 0);
		height: 1px;
		margin: -1px;
		overflow: hidden;
		padding: 0;
		position: absolute;
		width: 1px;
		white-space: nowrap;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.skeleton-line,
		.skeleton-button,
		.skeleton-cell {
			animation: none;
			background: var(--color-gray-200);
		}
	}
</style>
