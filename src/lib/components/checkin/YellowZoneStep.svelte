<script lang="ts">
	import { announce } from '$lib/a11y';
	import SupportiveAdultsList from './SupportiveAdultsList.svelte';

	interface SupportiveAdult {
		id: string;
		name: string;
		type: string;
		typeDescription?: string;
		contactInfo: string;
		isPrimary: boolean;
	}

	interface HelpMethod {
		id: string;
		title: string;
		description: string;
	}

	interface Props {
		adults: SupportiveAdult[];
		helpMethods: HelpMethod[];
		onComplete: (selectedAdultIds: string[], selectedMethodIds: string[]) => void;
	}

	let { adults, helpMethods, onComplete }: Props = $props();

	let selectedAdultIds: string[] = $state([]);
	let selectedMethodIds: string[] = $state([]);

	function handleAdultToggle(id: string) {
		if (selectedAdultIds.includes(id)) {
			selectedAdultIds = selectedAdultIds.filter((a) => a !== id);
		} else {
			selectedAdultIds = [...selectedAdultIds, id];
		}
	}

	function handleMethodToggle(id: string) {
		if (selectedMethodIds.includes(id)) {
			selectedMethodIds = selectedMethodIds.filter((m) => m !== id);
		} else {
			selectedMethodIds = [...selectedMethodIds, id];
		}
	}

	function isMethodSelected(id: string): boolean {
		return selectedMethodIds.includes(id);
	}

	function handleKeyDown(event: KeyboardEvent, id: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleMethodToggle(id);
		}
	}

	function handleDone() {
		const adultsCount = selectedAdultIds.length;
		const methodsCount = selectedMethodIds.length;

		let message = 'Saving check-in';
		if (adultsCount > 0) {
			message += ` with ${adultsCount} supportive adult${adultsCount > 1 ? 's' : ''} to contact`;
		}
		if (methodsCount > 0) {
			message += ` and ${methodsCount} help method${methodsCount > 1 ? 's' : ''}`;
		}
		announce(message);

		onComplete(selectedAdultIds, selectedMethodIds);
	}
</script>

<div class="yellow-zone-step">
	<header class="step-header">
		<h1 class="step-title">It's okay to need support</h1>
		<p class="step-subtitle">What would help you right now?</p>
	</header>

	<div class="step-content">
		<section class="section" aria-labelledby="adults-heading">
			<h2 id="adults-heading" class="section-title">Supportive Adults</h2>
			<p class="section-description">Who would you like to reach out to?</p>
			<SupportiveAdultsList {adults} selectedIds={selectedAdultIds} onToggle={handleAdultToggle} />
		</section>

		<section class="section" aria-labelledby="methods-heading">
			<h2 id="methods-heading" class="section-title">Help Methods</h2>
			<p class="section-description">What would you like to ask for?</p>

			{#if helpMethods.length === 0}
				<p class="empty-state">No help methods found in your plan.</p>
			{:else}
				<div class="methods-list" role="group" aria-label="Select help methods">
					{#each helpMethods as method (method.id)}
						<button
							type="button"
							class="method-item"
							class:selected={isMethodSelected(method.id)}
							onclick={() => handleMethodToggle(method.id)}
							onkeydown={(e) => handleKeyDown(e, method.id)}
							aria-pressed={isMethodSelected(method.id)}
						>
							<span class="checkbox" aria-hidden="true">
								{#if isMethodSelected(method.id)}
									<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
									</svg>
								{/if}
							</span>
							<span class="method-content">
								<span class="method-title">{method.title}</span>
								{#if method.description}
									<span class="method-description">{method.description}</span>
								{/if}
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<p class="encouragement">Remember, your supportive adult wants to help.</p>
	</div>

	<footer class="step-footer">
		<button type="button" class="done-button" onclick={handleDone}> Done </button>
	</footer>
</div>

<style>
	.yellow-zone-step {
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
		background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
		border-radius: var(--radius-xl);
		border: 2px solid #ffca28;
	}

	.step-title {
		font-size: var(--font-size-2xl);
		color: #f57f17;
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

	.section {
		margin-bottom: var(--space-6);
	}

	.section-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-gray-900);
		margin: 0 0 var(--space-1) 0;
	}

	.section-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3) 0;
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--space-6);
		font-style: italic;
	}

	.methods-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.method-item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--color-white);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.method-item:hover {
		border-color: var(--color-gray-300);
		background-color: var(--color-gray-50);
	}

	.method-item:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.method-item.selected {
		border-color: #ffca28;
		background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
	}

	.checkbox {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		min-width: 24px;
		border: 2px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		background: var(--color-white);
		color: var(--color-white);
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	.method-item.selected .checkbox {
		border-color: #f9a825;
		background-color: #f9a825;
	}

	.checkbox svg {
		width: 16px;
		height: 16px;
	}

	.method-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
	}

	.method-title {
		font-weight: 500;
		color: var(--color-gray-900);
		font-size: var(--font-size-base);
	}

	.method-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.encouragement {
		text-align: center;
		font-size: var(--font-size-base);
		color: #f57f17;
		font-style: italic;
		padding: var(--space-4);
		background: #fffde7;
		border-radius: var(--radius-lg);
		margin-top: var(--space-4);
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
		background-color: #f9a825;
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
		background-color: #f57f17;
		box-shadow: var(--shadow-md);
	}

	.done-button:focus-visible {
		outline: 3px solid #f9a825;
		outline-offset: 2px;
	}

	.done-button:active {
		transform: scale(0.98);
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.yellow-zone-step {
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
		.method-item,
		.checkbox,
		.done-button {
			transition: none;
		}
	}

	/* Touch device optimizations */
	@media (pointer: coarse) {
		.method-item {
			padding: var(--space-4);
			min-height: 56px;
		}

		.checkbox {
			width: 28px;
			height: 28px;
			min-width: 28px;
		}

		.checkbox svg {
			width: 18px;
			height: 18px;
		}

		.done-button {
			min-height: 56px;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.method-item {
			border: 2px solid currentColor;
		}

		.method-item.selected {
			outline: 3px solid highlight;
		}

		.checkbox {
			border: 2px solid currentColor;
		}
	}
</style>
