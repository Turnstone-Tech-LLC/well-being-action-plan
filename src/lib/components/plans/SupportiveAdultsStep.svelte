<script lang="ts">
	import type { SupportiveAdultType } from '$lib/types/database';
	import type { SelectedSupportiveAdult, CustomSupportiveAdult } from '$lib/stores/actionPlanDraft';
	import SupportiveAdultSelector from './SupportiveAdultSelector.svelte';
	import CustomSupportiveAdultAdd from './CustomSupportiveAdultAdd.svelte';

	interface Props {
		supportiveAdultTypes: SupportiveAdultType[];
		selectedSupportiveAdults: SelectedSupportiveAdult[];
		customSupportiveAdults: CustomSupportiveAdult[];
		onBack: () => void;
		onContinue: () => void;
		onToggleSupportiveAdult: (typeId: string) => void;
		onSetName: (typeId: string, name: string) => void;
		onSetContactInfo: (typeId: string, contactInfo: string) => void;
		onSetPrimary: (typeId: string | null, customId: string | null) => void;
		onAddCustomSupportiveAdult: (label: string, name: string) => void;
		onUpdateCustomSupportiveAdult: (
			customId: string,
			updates: { label?: string; name?: string; contactInfo?: string }
		) => void;
		onRemoveCustomSupportiveAdult: (customId: string) => void;
	}

	let {
		supportiveAdultTypes,
		selectedSupportiveAdults,
		customSupportiveAdults,
		onBack,
		onContinue,
		onToggleSupportiveAdult,
		onSetName,
		onSetContactInfo,
		onSetPrimary,
		onAddCustomSupportiveAdult,
		onUpdateCustomSupportiveAdult,
		onRemoveCustomSupportiveAdult
	}: Props = $props();

	// Check if a supportive adult type is selected
	function isSelected(typeId: string): boolean {
		return selectedSupportiveAdults.some((a) => a.typeId === typeId);
	}

	// Get name for a supportive adult type
	function getName(typeId: string): string {
		return selectedSupportiveAdults.find((a) => a.typeId === typeId)?.name || '';
	}

	// Get contact info for a supportive adult type
	function getContactInfo(typeId: string): string {
		return selectedSupportiveAdults.find((a) => a.typeId === typeId)?.contactInfo || '';
	}

	// Check if a supportive adult is primary
	function isPrimary(typeId: string | null, customId: string | null): boolean {
		if (typeId) {
			return selectedSupportiveAdults.find((a) => a.typeId === typeId)?.isPrimary || false;
		}
		if (customId) {
			return customSupportiveAdults.find((a) => a.id === customId)?.isPrimary || false;
		}
		return false;
	}

	// Handle setting a supportive adult as primary
	function handleSetPrimary(typeId: string | null, customId: string | null) {
		// If this adult is already primary, unset it
		const currentlyPrimary = isPrimary(typeId, customId);
		if (currentlyPrimary) {
			onSetPrimary(null, null);
		} else {
			onSetPrimary(typeId, customId);
		}
	}

	// Handle custom adult name change
	function handleCustomNameChange(customId: string, name: string) {
		onUpdateCustomSupportiveAdult(customId, { name });
	}

	// Handle custom adult contact info change
	function handleCustomContactInfoChange(customId: string, contactInfo: string) {
		onUpdateCustomSupportiveAdult(customId, { contactInfo });
	}

	// Check if no adults are selected
	const hasNoSelection = $derived(
		selectedSupportiveAdults.length === 0 && customSupportiveAdults.length === 0
	);

	// Count total selections
	const totalSelected = $derived(selectedSupportiveAdults.length + customSupportiveAdults.length);

	// Check if any names are missing
	const hasEmptyNames = $derived(
		selectedSupportiveAdults.some((a) => !a.name.trim()) ||
			customSupportiveAdults.some((a) => !a.name.trim())
	);
</script>

<div class="supportive-adults-step">
	<div class="step-header">
		<div class="zone-badge">
			<span class="zone-indicator green"></span>
			Green Zone
		</div>
		<h2>Supportive Adults</h2>
		<p class="step-description">
			Everyone needs to have a supportive adult. Who can you talk to when you need support?
		</p>
	</div>

	<div class="adults-content">
		<div class="adults-grid">
			{#each supportiveAdultTypes as adultType (adultType.id)}
				<SupportiveAdultSelector
					{adultType}
					isSelected={isSelected(adultType.id)}
					name={getName(adultType.id)}
					contactInfo={getContactInfo(adultType.id)}
					isPrimary={isPrimary(adultType.id, null)}
					onToggle={() => onToggleSupportiveAdult(adultType.id)}
					onNameChange={(value) => onSetName(adultType.id, value)}
					onContactInfoChange={(value) => onSetContactInfo(adultType.id, value)}
					onPrimaryChange={() => handleSetPrimary(adultType.id, null)}
				/>
			{/each}

			{#each customSupportiveAdults as customAdult (customAdult.id)}
				<SupportiveAdultSelector
					adultType={customAdult}
					isSelected={true}
					name={customAdult.name}
					contactInfo={customAdult.contactInfo || ''}
					isPrimary={isPrimary(null, customAdult.id)}
					isCustom={true}
					onToggle={() => onRemoveCustomSupportiveAdult(customAdult.id)}
					onNameChange={(value) => handleCustomNameChange(customAdult.id, value)}
					onContactInfoChange={(value) => handleCustomContactInfoChange(customAdult.id, value)}
					onPrimaryChange={() => handleSetPrimary(null, customAdult.id)}
					onRemoveCustom={() => onRemoveCustomSupportiveAdult(customAdult.id)}
				/>
			{/each}
		</div>

		<CustomSupportiveAdultAdd onAdd={onAddCustomSupportiveAdult} />
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
			<p>Consider selecting at least one supportive adult to help when needed.</p>
		</div>
	{:else if hasEmptyNames}
		<div class="info-message" role="status">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="info-icon"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
				/>
			</svg>
			<p>Please enter a name for each selected supportive adult.</p>
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
				{totalSelected} supportive adult{totalSelected === 1 ? '' : 's'} selected
			</p>
		</div>
	{/if}

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
	.supportive-adults-step {
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
		background-color: rgba(34, 197, 94, 0.1);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: #166534;
		margin-bottom: var(--space-3);
	}

	.zone-indicator {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
	}

	.zone-indicator.green {
		background-color: #22c55e;
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

	.adults-content {
		display: flex;
		flex-direction: column;
	}

	.adults-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: var(--space-3);
	}

	.warning-message,
	.info-message,
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

	.info-message {
		background-color: rgba(59, 130, 246, 0.1);
		color: #1d4ed8;
	}

	.info-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		color: #3b82f6;
	}

	.selection-summary {
		background-color: rgba(34, 197, 94, 0.1);
		color: #166534;
	}

	.check-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		color: #22c55e;
	}

	.warning-message p,
	.info-message p,
	.selection-summary p {
		margin: 0;
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
		.adults-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}
	}
</style>
