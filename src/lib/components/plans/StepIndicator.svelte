<script lang="ts">
	interface Step {
		number: number;
		label: string;
	}

	interface Props {
		currentStep: number;
		steps: Step[];
		onStepClick?: (stepNumber: number) => void;
	}

	let { currentStep, steps, onStepClick }: Props = $props();

	function handleStepClick(stepNumber: number) {
		// Only allow clicking on completed steps
		if (stepNumber < currentStep && onStepClick) {
			onStepClick(stepNumber);
		}
	}

	function handleKeyDown(event: KeyboardEvent, stepNumber: number) {
		if ((event.key === 'Enter' || event.key === ' ') && stepNumber < currentStep && onStepClick) {
			event.preventDefault();
			onStepClick(stepNumber);
		}
	}
</script>

<nav class="step-indicator" aria-label="Form progress">
	<ol class="steps-list">
		{#each steps as step (step.number)}
			{@const isCompleted = step.number < currentStep}
			{@const isCurrent = step.number === currentStep}
			{@const isUpcoming = step.number > currentStep}
			{@const isClickable = isCompleted && onStepClick}
			<li
				class="step"
				class:completed={isCompleted}
				class:current={isCurrent}
				class:upcoming={isUpcoming}
				class:clickable={isClickable}
				aria-current={isCurrent ? 'step' : undefined}
				role={isClickable ? 'button' : undefined}
				tabindex={isClickable ? 0 : undefined}
				onclick={() => handleStepClick(step.number)}
				onkeydown={(e) => handleKeyDown(e, step.number)}
			>
				<span class="step-number">
					{#if isCompleted}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2.5"
							stroke="currentColor"
							class="check-icon"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
						</svg>
						<span class="visually-hidden">Completed:</span>
					{:else}
						{step.number}
					{/if}
				</span>
				<span class="step-label">{step.label}</span>
				{#if isClickable}
					<span class="visually-hidden">(click to return to this step)</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.step-indicator {
		padding: var(--space-4) 0;
	}

	.steps-list {
		display: flex;
		justify-content: center;
		gap: var(--space-2);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		flex: 1;
		max-width: 8rem;
		position: relative;
	}

	/* Connector line between steps */
	.step:not(:last-child)::after {
		content: '';
		position: absolute;
		top: 1rem;
		left: calc(50% + 1.5rem);
		right: calc(-50% + 1.5rem);
		height: 2px;
		background-color: var(--color-gray-200);
	}

	.step.completed:not(:last-child)::after {
		background-color: var(--color-primary);
	}

	.step-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		font-weight: 600;
		font-size: var(--font-size-sm);
		background-color: var(--color-gray-200);
		color: var(--color-gray-600);
		position: relative;
		z-index: 1;
		transition:
			background-color 0.2s ease,
			color 0.2s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.step.completed .step-number {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.step.current .step-number {
		background-color: var(--color-primary);
		color: var(--color-white);
		box-shadow: 0 0 0 4px rgba(0, 89, 76, 0.2);
	}

	.check-icon {
		width: 1rem;
		height: 1rem;
	}

	.step-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-align: center;
		line-height: 1.3;
	}

	.step.current .step-label {
		color: var(--color-primary);
		font-weight: 600;
	}

	.step.completed .step-label {
		color: var(--color-text);
	}

	/* Clickable steps (completed steps when onStepClick is provided) */
	.step.clickable {
		cursor: pointer;
	}

	.step.clickable:hover .step-number {
		transform: scale(1.1);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.2);
	}

	.step.clickable:hover .step-label {
		color: var(--color-primary);
		text-decoration: underline;
	}

	.step.clickable:focus-visible {
		outline: none;
	}

	.step.clickable:focus-visible .step-number {
		box-shadow: 0 0 0 3px var(--color-accent);
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

	/* Responsive: hide labels on very small screens */
	@media (max-width: 480px) {
		.step-label {
			font-size: 0.625rem;
		}

		.step {
			max-width: 5rem;
		}
	}
</style>
