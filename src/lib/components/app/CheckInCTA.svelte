<script lang="ts">
	interface Props {
		href?: string;
	}

	let { href = '/app/checkin' }: Props = $props();
</script>

<section class="checkin-cta" aria-label="Daily check-in">
	<div class="cta-container">
		<p class="prompt">How are you feeling today?</p>
		<a {href} class="checkin-button">
			<span class="button-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10" />
					<path d="M8 14s1.5 2 4 2 4-2 4-2" />
					<line x1="9" y1="9" x2="9.01" y2="9" />
					<line x1="15" y1="9" x2="15.01" y2="9" />
				</svg>
			</span>
			<span class="button-text">Check In</span>
		</a>
		<p class="subtext">Take a moment to reflect on how you're doing</p>
	</div>
</section>

<style>
	.checkin-cta {
		padding: var(--space-4);
	}

	.cta-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		max-width: 400px;
		margin: 0 auto;
		padding: var(--space-8) var(--space-4);
		background: linear-gradient(135deg, var(--color-gray-50) 0%, var(--color-white) 100%);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-xl);
	}

	.prompt {
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--color-gray-800);
		text-align: center;
		margin: 0;
	}

	.checkin-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-5) var(--space-10);
		background-color: var(--color-primary);
		color: var(--color-white);
		font-size: var(--font-size-xl);
		font-weight: 600;
		border: none;
		border-radius: var(--radius-lg);
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease,
			box-shadow 0.15s ease;
		box-shadow: var(--shadow-md);
		min-height: 56px;
	}

	.checkin-button:hover {
		background-color: #004a3f;
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		text-decoration: none;
	}

	.checkin-button:active {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.button-icon {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.button-icon svg {
		width: 100%;
		height: 100%;
	}

	.button-text {
		letter-spacing: 0.02em;
	}

	.subtext {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		text-align: center;
		margin: 0;
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.checkin-button {
			transition: none;
		}

		.checkin-button:hover {
			transform: none;
		}
	}

	/* Touch device optimizations */
	@media (pointer: coarse) {
		.checkin-button {
			min-height: 60px;
			padding: var(--space-5) var(--space-12);
		}
	}

	/* Desktop adjustments */
	@media (min-width: 480px) {
		.cta-container {
			padding: var(--space-10) var(--space-8);
		}

		.prompt {
			font-size: var(--font-size-2xl);
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.checkin-button {
			border: 2px solid currentColor;
		}
	}
</style>
