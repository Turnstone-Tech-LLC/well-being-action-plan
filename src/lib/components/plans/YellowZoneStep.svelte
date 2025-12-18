<script lang="ts">
	import type { HelpMethod, CrisisResource } from '$lib/types/database';
	import type { SelectedHelpMethod, CustomHelpMethod } from '$lib/stores/actionPlanDraft';
	import HelpMethodSelector from './HelpMethodSelector.svelte';
	import CustomHelpMethodAdd from './CustomHelpMethodAdd.svelte';
	import RedZonePreview from './RedZonePreview.svelte';

	interface Props {
		helpMethods: HelpMethod[];
		selectedHelpMethods: SelectedHelpMethod[];
		customHelpMethods: CustomHelpMethod[];
		crisisResources: CrisisResource[];
		onBack: () => void;
		onContinue: () => void;
		onToggleHelpMethod: (helpMethodId: string) => void;
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
		onToggleHelpMethod,
		onSetAdditionalInfo,
		onAddCustomHelpMethod,
		onUpdateCustomHelpMethod,
		onRemoveCustomHelpMethod
	}: Props = $props();

	// Check if a help method is selected
	function isSelected(helpMethodId: string): boolean {
		return selectedHelpMethods.some((h) => h.helpMethodId === helpMethodId);
	}

	// Get additional info for a help method
	function getAdditionalInfo(helpMethodId: string): string {
		return selectedHelpMethods.find((h) => h.helpMethodId === helpMethodId)?.additionalInfo || '';
	}

	// Handle custom method additional info change
	function handleCustomAdditionalInfoChange(customId: string, additionalInfo: string) {
		onUpdateCustomHelpMethod(customId, { additionalInfo });
	}

	// Check if no methods are selected
	const hasNoSelection = $derived(
		selectedHelpMethods.length === 0 && customHelpMethods.length === 0
	);

	// Count total selections
	const totalSelected = $derived(selectedHelpMethods.length + customHelpMethods.length);
</script>

<div class="yellow-zone-step">
	<div class="step-header">
		<div class="zone-badge">
			<span class="zone-indicator"></span>
			Yellow Zone: Check In
		</div>
		<h2>Help Methods</h2>
		<p class="step-description">
			My coping skills are not helping enough. When I feel this way, I will check in with my
			supportive adult and ask for...
		</p>
	</div>

	<div class="methods-content">
		<div class="methods-grid">
			{#each helpMethods as method (method.id)}
				<HelpMethodSelector
					helpMethod={method}
					isSelected={isSelected(method.id)}
					additionalInfo={getAdditionalInfo(method.id)}
					onToggle={() => onToggleHelpMethod(method.id)}
					onAdditionalInfoChange={(value) => onSetAdditionalInfo(method.id, value)}
				/>
			{/each}

			{#each customHelpMethods as customMethod (customMethod.id)}
				<HelpMethodSelector
					helpMethod={customMethod}
					isSelected={true}
					additionalInfo={customMethod.additionalInfo || ''}
					isCustom={true}
					onToggle={() => onRemoveCustomHelpMethod(customMethod.id)}
					onAdditionalInfoChange={(value) =>
						handleCustomAdditionalInfoChange(customMethod.id, value)}
					onRemoveCustom={() => onRemoveCustomHelpMethod(customMethod.id)}
				/>
			{/each}
		</div>

		<CustomHelpMethodAdd onAdd={onAddCustomHelpMethod} />
	</div>

	{#if hasNoSelection}
		<div class="warning-message" role="status">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="warning-icon"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
				/>
			</svg>
			<p>
				Consider selecting at least one type of help to ask for when coping skills aren't enough.
			</p>
		</div>
	{:else}
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
				{totalSelected} type{totalSelected === 1 ? '' : 's'} of help selected
			</p>
		</div>
	{/if}

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

	.methods-content {
		display: flex;
		flex-direction: column;
	}

	.methods-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: var(--space-3);
	}

	.warning-message,
	.selection-summary {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
	}

	.warning-message {
		background-color: rgba(251, 191, 36, 0.1);
		color: #92400e;
	}

	.warning-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		color: #f59e0b;
	}

	.selection-summary {
		background-color: rgba(253, 224, 71, 0.2);
		color: #92400e;
	}

	.check-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		color: #ca8a04;
	}

	.warning-message p,
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
