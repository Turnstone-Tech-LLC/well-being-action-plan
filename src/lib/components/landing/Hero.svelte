<section class="hero">
	<div class="hero-content">
		<h1>My Well-Being Action Plan</h1>
		<p class="tagline">For feeling confident, resilient, and connected.</p>
		<p class="body">
			Your action plan is private and stays on your device. No account needed — just your access
			code to get started.
		</p>
		<div class="cta-wrapper">
			<a href="/scan" class="btn btn-primary btn-large">Load My Plan</a>
			<p class="supporting-text">Have a QR code? You can scan it with your camera.</p>
		</div>
		<div class="restore-wrapper">
			<p class="restore-text">
				Already have a backup? <a href="/restore" class="restore-link">Restore from file</a>
			</p>
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
		max-width: 40rem;
		margin: 0 auto;
	}

	.hero h1 {
		color: var(--color-primary);
		margin-bottom: var(--space-3);
	}

	.tagline {
		font-size: var(--font-size-xl);
		color: var(--color-primary);
		font-weight: 500;
		margin-bottom: var(--space-6);
	}

	.body {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
		margin-bottom: var(--space-8);
		line-height: 1.7;
	}

	.cta-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}

	.btn-large {
		padding: var(--space-4) var(--space-8);
		font-size: var(--font-size-lg);
	}

	.supporting-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.restore-wrapper {
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-gray-200);
	}

	.restore-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.restore-link {
		color: var(--color-primary);
		text-decoration: underline;
		font-weight: 500;
	}

	.restore-link:hover {
		color: var(--color-primary-dark, #004d42);
	}
</style>
