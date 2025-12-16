<footer>
	<div class="footer-content">
		<img src="/logo-small.png" alt="Well-Being Action Plan" class="footer-logo" />
		<nav class="footer-nav">
			<a href="/about">About the Well-Being Action Plan</a>
		</nav>
		<p class="attribution">
			Created in partnership with Golisano Children's Hospital at the University of Vermont Medical
			Center
		</p>
		<a href="/provider/login" class="provider-link">Provider Access</a>
	</div>
</footer>

<style>
	footer {
		background-color: var(--color-primary);
		color: white;
		padding: var(--space-8) var(--space-4);
		margin-top: auto;
	}

	.footer-content {
		max-width: var(--max-width);
		margin: 0 auto;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.footer-logo {
		height: 3rem;
		width: auto;
	}

	.footer-nav a {
		color: white;
		text-decoration: none;
		font-weight: 500;
	}

	.footer-nav a:hover {
		color: var(--color-accent);
		text-decoration: underline;
	}

	.attribution {
		margin: 0;
		font-size: var(--font-size-sm);
		opacity: 0.9;
		line-height: 1.5;
	}

	.provider-link {
		font-size: var(--font-size-sm);
		color: white;
		opacity: 0.7;
		text-decoration: none;
	}

	.provider-link:hover {
		opacity: 1;
		text-decoration: underline;
	}
</style>
