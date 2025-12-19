<script lang="ts">
	import { announce } from '$lib/a11y';
	import StrategySelector from './StrategySelector.svelte';

	interface Skill {
		id: string;
		title: string;
		description: string;
		category: string;
	}

	interface Props {
		skills: Skill[];
		onComplete: (selectedSkillIds: string[]) => void;
	}

	let { skills, onComplete }: Props = $props();

	let selectedSkillIds: string[] = $state([]);

	function handleToggle(id: string) {
		if (selectedSkillIds.includes(id)) {
			selectedSkillIds = selectedSkillIds.filter((s) => s !== id);
		} else {
			selectedSkillIds = [...selectedSkillIds, id];
		}
	}

	function handleDone() {
		const count = selectedSkillIds.length;
		if (count === 0) {
			announce('Saving check-in without any coping skills selected.');
		} else if (count === 1) {
			announce('Saving check-in with 1 coping skill selected.');
		} else {
			announce(`Saving check-in with ${count} coping skills selected.`);
		}
		onComplete(selectedSkillIds);
	}
</script>

<div class="green-zone-step">
	<header class="step-header">
		<h1 class="step-title">Great! What's helping you feel good?</h1>
		<p class="step-subtitle">Select the coping skills you've been using (optional)</p>
	</header>

	<div class="step-content">
		<StrategySelector {skills} selectedIds={selectedSkillIds} onToggle={handleToggle} />
	</div>

	<footer class="step-footer">
		<button type="button" class="done-button" onclick={handleDone}> Done </button>
	</footer>
</div>

<style>
	.green-zone-step {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--nav-height) - 120px);
		padding: var(--space-6) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.step-header {
		text-align: center;
		margin-bottom: var(--space-6);
		padding: var(--space-4);
		background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
		border-radius: var(--radius-xl);
		border: 2px solid #66bb6a;
	}

	.step-title {
		font-size: var(--font-size-2xl);
		color: #2e7d32;
		margin: 0 0 var(--space-2) 0;
	}

	.step-subtitle {
		font-size: var(--font-size-base);
		color: var(--color-text-muted);
		margin: 0;
	}

	.step-content {
		flex: 1;
		margin-bottom: var(--space-6);
	}

	.step-footer {
		display: flex;
		justify-content: center;
		padding: var(--space-4) 0;
		position: sticky;
		bottom: 0;
		background: linear-gradient(
			to top,
			var(--color-gray-50) 0%,
			var(--color-gray-50) 60%,
			transparent 100%
		);
	}

	.done-button {
		padding: var(--space-4) var(--space-8);
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-white);
		background-color: #43a047;
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
		min-width: 200px;
		transition:
			background-color 0.15s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.done-button:hover {
		background-color: #2e7d32;
		box-shadow: var(--shadow-md);
	}

	.done-button:focus-visible {
		outline: 3px solid #43a047;
		outline-offset: 2px;
	}

	.done-button:active {
		transform: scale(0.98);
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.green-zone-step {
			padding: var(--space-4) var(--space-3);
		}

		.step-title {
			font-size: var(--font-size-xl);
		}

		.done-button {
			width: 100%;
			max-width: 300px;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.done-button {
			transition: none;
		}
	}

	/* Touch device optimizations */
	@media (pointer: coarse) {
		.done-button {
			min-height: 56px;
		}
	}
</style>
