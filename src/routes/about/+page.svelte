<svelte:head>
	<title>About | Well-Being Action Plan</title>
	<meta name="description" content="Learn about the Well-Being Action Plan" />
</svelte:head>

<section class="about-page">
	<div class="container">
		<h1>About the Well-Being Action Plan</h1>
		<p class="description">
			The Well-Being Action Plan is a collaborative tool designed to support youth well-being
			through a shared protocol between patients and their healthcare providers.
		</p>
		<div class="info-box">
			<p>
				Created in partnership with Golisano Children's Hospital at the University of Vermont
				Medical Center.
			</p>
		</div>
	</div>
</section>

<style>
	.about-page {
		flex: 1;
		padding: var(--space-12) var(--space-4);
	}

	.container {
		max-width: 40rem;
		margin: 0 auto;
	}

	h1 {
		color: var(--color-primary);
		margin-bottom: var(--space-6);
	}

	.description {
		font-size: var(--font-size-lg);
		color: var(--color-text-muted);
		line-height: 1.7;
		margin-bottom: var(--space-8);
	}

	.info-box {
		background-color: var(--color-bg-subtle);
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		border-left: 4px solid var(--color-primary);
	}

	.info-box p {
		margin: 0;
		color: var(--color-text);
	}
</style>
