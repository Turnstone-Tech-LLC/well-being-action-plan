<script lang="ts">
	import type { PlanPayload } from '$lib/db';

	interface Props {
		planPayload: PlanPayload;
		onContinue: () => void;
	}

	let { planPayload, onContinue }: Props = $props();

	// Calculate plan summary stats
	const skillsCount = planPayload.skills.length;
	const adultsCount = planPayload.supportiveAdults.length;
	const helpMethodsCount = planPayload.helpMethods.length;
</script>

<div class="welcome-step">
	<div class="header">
		<div class="icon" aria-hidden="true">
			<svg
				width="64"
				height="64"
				viewBox="0 0 64 64"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2" fill="none" />
				<path
					d="M32 18c-7.7 0-14 6.3-14 14s6.3 14 14 14 14-6.3 14-14-6.3-14-14-14zm0 25c-6.1 0-11-4.9-11-11s4.9-11 11-11 11 4.9 11 11-4.9 11-11 11z"
					fill="currentColor"
				/>
				<path d="M32 24v8l6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
		</div>
		<h1>Welcome to Your Well-Being Action Plan</h1>
	</div>

	{#if planPayload.patientNickname}
		<p class="greeting">
			Hi <strong>{planPayload.patientNickname}</strong>, your plan is ready!
		</p>
	{/if}

	<div class="plan-summary" role="region" aria-label="Your plan summary">
		<h2 class="visually-hidden">Plan Summary</h2>

		<div class="summary-cards">
			<div class="summary-card green">
				<div class="card-icon" aria-hidden="true">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
				<div class="card-content">
					<span class="count">{skillsCount}</span>
					<span class="label">Coping {skillsCount === 1 ? 'Skill' : 'Skills'}</span>
				</div>
			</div>

			<div class="summary-card blue">
				<div class="card-icon" aria-hidden="true">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" />
						<path
							d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
				<div class="card-content">
					<span class="count">{adultsCount}</span>
					<span class="label">Supportive {adultsCount === 1 ? 'Adult' : 'Adults'}</span>
				</div>
			</div>

			{#if helpMethodsCount > 0}
				<div class="summary-card yellow">
					<div class="card-icon" aria-hidden="true">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<div class="card-content">
						<span class="count">{helpMethodsCount}</span>
						<span class="label">Help {helpMethodsCount === 1 ? 'Method' : 'Methods'}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<p class="reassurance">
		This plan was created with your provider to help you feel confident, resilient, and connected.
	</p>

	<button type="button" class="btn btn-primary continue-btn" onclick={onContinue}>
		Continue
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				d="M5 12h14M12 5l7 7-7 7"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>
</div>

<style>
	.welcome-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-8) var(--space-4);
		max-width: 32rem;
		margin: 0 auto;
		text-align: center;
	}

	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.icon {
		color: var(--color-primary);
	}

	h1 {
		font-size: var(--font-size-2xl);
		color: var(--color-gray-900);
		line-height: 1.3;
	}

	.greeting {
		font-size: var(--font-size-lg);
		color: var(--color-text);
	}

	.greeting strong {
		color: var(--color-primary);
	}

	.plan-summary {
		width: 100%;
	}

	.summary-cards {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		justify-content: center;
	}

	.summary-card {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		background-color: var(--color-bg-subtle);
		border: 1px solid var(--color-gray-200);
		min-width: 140px;
	}

	.summary-card.green {
		background-color: #e8f5f3;
		border-color: #a8d8d0;
	}

	.summary-card.green .card-icon {
		color: var(--color-primary);
	}

	.summary-card.blue {
		background-color: #e8f4fd;
		border-color: #a8d4f5;
	}

	.summary-card.blue .card-icon {
		color: #1a73e8;
	}

	.summary-card.yellow {
		background-color: #fff8e6;
		border-color: #ffd966;
	}

	.summary-card.yellow .card-icon {
		color: #b38600;
	}

	.card-icon {
		flex-shrink: 0;
	}

	.card-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
	}

	.count {
		font-size: var(--font-size-2xl);
		font-weight: 600;
		color: var(--color-gray-900);
		line-height: 1;
	}

	.label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.reassurance {
		color: var(--color-text-muted);
		font-size: var(--font-size-base);
		line-height: 1.6;
		max-width: 28rem;
	}

	.continue-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 180px;
		justify-content: center;
		padding: var(--space-4) var(--space-8);
		font-size: var(--font-size-lg);
	}

	@media (max-width: 480px) {
		.welcome-step {
			padding: var(--space-6) var(--space-3);
		}

		h1 {
			font-size: var(--font-size-xl);
		}

		.summary-cards {
			flex-direction: column;
		}

		.summary-card {
			width: 100%;
		}
	}
</style>
