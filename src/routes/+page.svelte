<svelte:head>
	<title>Well-Being Action Plan</title>
	<meta name="description" content="A shared protocol for patient well-being between providers and patients" />
</svelte:head>

<section class="hero">
	<div class="hero-content">
		<h1>Well-Being Action Plan</h1>
		<p class="tagline">
			A shared protocol supporting your well-being journey
		</p>
		<div class="cta-group">
			<a href="/restore" class="btn btn-primary">
				Restore Your Plan
			</a>
			<a href="/provider/login" class="btn btn-outline">
				Provider Access
			</a>
		</div>
	</div>
</section>

<section class="features">
	<div class="features-content">
		<div class="feature">
			<h3>Privacy First</h3>
			<p>Your data stays on your device. No accounts required for patients.</p>
		</div>
		<div class="feature">
			<h3>Shared Protocol</h3>
			<p>Work together with your provider using a common framework.</p>
		</div>
		<div class="feature">
			<h3>Your Control</h3>
			<p>Export, backup, and manage your well-being data on your terms.</p>
		</div>
	</div>
</section>

<style>
	.hero {
		background-color: var(--color-bg-subtle);
		padding: var(--space-16) var(--space-4);
		text-align: center;
	}

	.hero-content {
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.hero h1 {
		color: var(--color-primary);
		margin-bottom: var(--space-4);
	}

	.tagline {
		font-size: var(--font-size-xl);
		color: var(--color-text-muted);
		margin-bottom: var(--space-8);
	}

	.cta-group {
		display: flex;
		gap: var(--space-4);
		justify-content: center;
		flex-wrap: wrap;
	}

	.features {
		padding: var(--space-16) var(--space-4);
	}

	.features-content {
		max-width: var(--max-width);
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--space-8);
	}

	.feature {
		text-align: center;
		padding: var(--space-6);
	}

	.feature h3 {
		color: var(--color-primary);
		margin-bottom: var(--space-3);
	}

	.feature p {
		color: var(--color-text-muted);
	}
</style>
