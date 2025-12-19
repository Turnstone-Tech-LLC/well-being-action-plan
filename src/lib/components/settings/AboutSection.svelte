<script lang="ts">
	const appVersion = '0.0.1';
</script>

<section class="settings-section" aria-labelledby="about-heading">
	<h2 id="about-heading">About</h2>

	<div class="setting-card">
		<a href="/about" class="about-link">
			<div class="link-content">
				<span class="link-label">About the Well-Being Action Plan</span>
				<span class="link-description">Learn more about this tool and how to use it</span>
			</div>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path
					d="M9 18l6-6-6-6"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</a>
	</div>

	<div class="setting-card info-card">
		<div class="info-row">
			<span class="info-label">App Version</span>
			<span class="info-value">{appVersion}</span>
		</div>
	</div>

	<div class="partnership-note">
		<p>Created in partnership with</p>
		<p class="partner-name">
			Golisano Children's Hospital at the University of Vermont Medical Center
		</p>
	</div>
</section>

<style>
	.settings-section {
		margin-bottom: var(--space-6);
	}

	.settings-section h2 {
		font-size: var(--font-size-lg);
		color: var(--color-gray-700);
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.setting-card {
		padding: var(--space-4);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-2);
	}

	.about-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		text-decoration: none;
		color: inherit;
		transition: background-color 0.15s ease;
		margin: calc(-1 * var(--space-4));
		padding: var(--space-4);
		border-radius: var(--radius-lg);
	}

	.about-link:hover {
		background-color: var(--color-bg-subtle);
	}

	.about-link:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: -3px;
	}

	.link-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.link-label {
		font-size: var(--font-size-base);
		color: var(--color-gray-800);
		font-weight: 500;
	}

	.link-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.about-link svg {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.info-card {
		background-color: var(--color-bg-subtle);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.info-value {
		font-size: var(--font-size-sm);
		color: var(--color-gray-700);
		font-family: var(--font-mono);
	}

	.partnership-note {
		text-align: center;
		padding: var(--space-6) var(--space-4);
		color: var(--color-text-muted);
	}

	.partnership-note p {
		margin: 0;
		font-size: var(--font-size-sm);
	}

	.partner-name {
		font-weight: 500;
		color: var(--color-primary);
		margin-top: var(--space-2);
	}
</style>
