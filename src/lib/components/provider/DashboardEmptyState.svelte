<script lang="ts">
	// Dashboard empty state for when provider has no action plans
</script>

<div class="empty-state" role="status">
	<div class="illustration">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
			/>
		</svg>
	</div>

	<h2>Create your first Well-Being Action Plan</h2>

	<p class="description">
		Work with your patient to build a personalized plan they can take home. Each plan includes
		coping skills, supportive adults, and crisis resources tailored to their needs.
	</p>

	<a href="/provider/plans/new" class="btn btn-primary btn-large">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			class="btn-icon"
			aria-hidden="true"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
		</svg>
		Create Action Plan
	</a>
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--space-12) var(--space-4);
		max-width: 32rem;
		margin: 0 auto;
	}

	.illustration {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 6rem;
		height: 6rem;
		background-color: var(--color-gray-100);
		border-radius: 50%;
		margin-bottom: var(--space-6);
	}

	.illustration svg {
		width: 3rem;
		height: 3rem;
		color: var(--color-primary);
	}

	h2 {
		font-size: var(--font-size-2xl);
		color: var(--color-gray-900);
		margin-bottom: var(--space-4);
	}

	.description {
		color: var(--color-text-muted);
		line-height: 1.6;
		margin-bottom: var(--space-8);
	}

	.btn-large {
		padding: var(--space-4) var(--space-8);
		font-size: var(--font-size-lg);
	}

	.btn-icon {
		width: 1.5rem;
		height: 1.5rem;
		margin-right: var(--space-2);
	}
</style>
