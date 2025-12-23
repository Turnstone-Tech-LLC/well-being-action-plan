<script lang="ts">
	import type { HelpMethod, CrisisResource } from '$lib/types/database';
	import type { SelectedHelpMethod, CustomHelpMethod } from '$lib/stores/actionPlanDraft';
	import HelpMethodDisplay from './HelpMethodDisplay.svelte';
	import CustomHelpMethodAdd from './CustomHelpMethodAdd.svelte';
	import RedZonePreview from './RedZonePreview.svelte';

	interface Props {
		helpMethods: HelpMethod[];
		selectedHelpMethods: SelectedHelpMethod[];
		customHelpMethods: CustomHelpMethod[];
		crisisResources: CrisisResource[];
		onBack: () => void;
		onContinue: () => void;
		onSetAdditionalInfo: (helpMethodId: string, additionalInfo: string) => void;
		onAddCustomHelpMethod: (title: string) => void;
		onUpdateCustomHelpMethod: (
			customId: string,
			updates: { title?: string; additionalInfo?: string }
		) => void;
		onRemoveCustomHelpMethod: (customId: string) => void;
	}

	let {
		helpMethods,
		selectedHelpMethods,
		customHelpMethods,
		crisisResources,
		onBack,
		onContinue,
		onSetAdditionalInfo,
		onAddCustomHelpMethod,
		onUpdateCustomHelpMethod,
		onRemoveCustomHelpMethod
	}: Props = $props();

	// Get additional info for a help method (from selected methods or empty)
	function getAdditionalInfo(helpMethodId: string): string {
		return selectedHelpMethods.find((h) => h.helpMethodId === helpMethodId)?.additionalInfo || '';
	}

	// Handle custom method additional info change
	function handleCustomAdditionalInfoChange(customId: string, additionalInfo: string) {
		onUpdateCustomHelpMethod(customId, { additionalInfo });
	}

	// Count of help methods (all standard + custom)
	const totalMethods = $derived(helpMethods.length + customHelpMethods.length);
</script>

<div class="yellow-zone-step">
	<div class="step-header">
		<div class="zone-badge">
			<span class="zone-indicator"></span>
			Yellow Zone: Check In
		</div>
		<h2>Help Methods</h2>
		<p class="step-description">
			When in the Yellow Zone, these are the types of help available. All items are included by
			default.
		</p>
	</div>

	<!-- Educational Framing Section -->
	<div class="educational-framing" role="region" aria-labelledby="yellow-zone-framing">
		<h3 id="yellow-zone-framing" class="framing-title">
			"You are saying you feel sad, upset, stressed, or worried most of the day, most days of the
			week."
		</h3>
		<p class="framing-intro">When you're in the Yellow Zone, you:</p>
		<ol class="framing-steps">
			<li>
				<span class="step-number" aria-hidden="true">1</span>
				<span class="step-content">
					<strong>Continue</strong> using your Green Zone coping skills
				</span>
			</li>
			<li>
				<span class="step-number" aria-hidden="true">2</span>
				<span class="step-content">
					<strong>Check in</strong> with your supportive adult
				</span>
			</li>
			<li>
				<span class="step-number" aria-hidden="true">3</span>
				<span class="step-content">
					<strong>Ask for</strong> the help you need (select below)
				</span>
			</li>
		</ol>
	</div>

	<div class="methods-content">
		<div class="methods-grid">
			{#each helpMethods as method (method.id)}
				<HelpMethodDisplay
					helpMethod={method}
					additionalInfo={getAdditionalInfo(method.id)}
					onAdditionalInfoChange={(value) => onSetAdditionalInfo(method.id, value)}
				/>
			{/each}

			{#each customHelpMethods as customMethod (customMethod.id)}
				<HelpMethodDisplay
					helpMethod={customMethod}
					additionalInfo={customMethod.additionalInfo || ''}
					isCustom={true}
					onAdditionalInfoChange={(value) =>
						handleCustomAdditionalInfoChange(customMethod.id, value)}
					onRemoveCustom={() => onRemoveCustomHelpMethod(customMethod.id)}
				/>
			{/each}
		</div>

		<CustomHelpMethodAdd onAdd={onAddCustomHelpMethod} />
	</div>

	<div class="selection-summary" role="status">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="check-icon"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
			/>
		</svg>
		<p>
			{totalMethods} type{totalMethods === 1 ? '' : 's'} of help included
		</p>
	</div>

	<div class="red-zone-section">
		<RedZonePreview {crisisResources} />
	</div>

	<div class="step-actions">
		<button type="button" class="btn btn-outline" onclick={onBack}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="btn-icon"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
				/>
			</svg>
			Back
		</button>
		<button type="button" class="btn btn-primary" onclick={onContinue}>
			Continue
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="btn-icon"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
				/>
			</svg>
		</button>
	</div>
</div>

<style>
	.yellow-zone-step {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.step-header {
		text-align: center;
	}

	.zone-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background-color: rgba(253, 224, 71, 0.2);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: #92400e;
		margin-bottom: var(--space-3);
	}

	.zone-indicator {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		background-color: #fbbf24;
	}

	.step-header h2 {
		margin-bottom: var(--space-2);
	}

	.step-description {
		color: var(--color-text-muted);
		font-size: var(--font-size-base);
		max-width: 36rem;
		margin: 0 auto;
	}

	/* Educational Framing Section */
	.educational-framing {
		padding: var(--space-5);
		background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
		border: 2px solid #fbbf24;
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-6);
	}

	.framing-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: #92400e;
		margin: 0 0 var(--space-4) 0;
		line-height: 1.4;
		font-style: italic;
	}

	.framing-intro {
		font-size: var(--font-size-base);
		color: #78350f;
		margin: 0 0 var(--space-3) 0;
		font-weight: 500;
	}

	.framing-steps {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.framing-steps li {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.step-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		min-width: 28px;
		background-color: #fbbf24;
		color: #78350f;
		font-weight: 700;
		font-size: var(--font-size-sm);
		border-radius: 50%;
	}

	.step-content {
		font-size: var(--font-size-base);
		color: #78350f;
		padding-top: 2px;
	}

	.step-content strong {
		font-weight: 600;
	}

	.methods-content {
		display: flex;
		flex-direction: column;
	}

	.methods-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: var(--space-3);
	}

	.selection-summary {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		background-color: rgba(253, 224, 71, 0.2);
		color: #92400e;
	}

	.check-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		color: #ca8a04;
	}

	.selection-summary p {
		margin: 0;
	}

	.red-zone-section {
		margin-top: var(--space-4);
	}

	.step-actions {
		display: flex;
		justify-content: center;
		gap: var(--space-4);
		padding-top: var(--space-4);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-6);
		font-weight: 500;
		font-size: var(--font-size-base);
		border-radius: var(--radius-md);
		border: none;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease;
		cursor: pointer;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover {
		background-color: #004a3f;
	}

	.btn-primary:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-text);
		border: 2px solid var(--color-gray-300);
	}

	.btn-outline:hover {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.btn-outline:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-icon {
		width: 1rem;
		height: 1rem;
	}

	@media (max-width: 640px) {
		.methods-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}
	}
</style>
