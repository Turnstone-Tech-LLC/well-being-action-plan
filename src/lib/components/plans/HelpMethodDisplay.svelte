<script lang="ts">
	import { generateA11yId } from '$lib/a11y';
	import type { HelpMethod } from '$lib/types/database';
	import type { CustomHelpMethod } from '$lib/stores/actionPlanDraft';

	interface Props {
		helpMethod: HelpMethod | CustomHelpMethod;
		additionalInfo?: string;
		isCustom?: boolean;
		onAdditionalInfoChange?: (value: string) => void;
		onRemoveCustom?: () => void;
	}

	let {
		helpMethod,
		additionalInfo = '',
		isCustom = false,
		onAdditionalInfoChange,
		onRemoveCustom
	}: Props = $props();

	// IDs for accessibility
	const additionalInfoId = generateA11yId('help-additional');

	// Get the title for display
	const title = $derived(helpMethod.title);

	// Get description if available (only on HelpMethod type, not CustomHelpMethod)
	const description = $derived('description' in helpMethod ? helpMethod.description : null);

	// Track if additional info section is expanded
	let showAdditionalInfo = $state(!!additionalInfo);

	function handleAdditionalInfoInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onAdditionalInfoChange?.(target.value);
	}

	function toggleAdditionalInfo() {
		showAdditionalInfo = !showAdditionalInfo;
	}
</script>

<div class="help-method-display" class:custom={isCustom}>
	<div class="method-header">
		<div class="method-icon" aria-hidden="true">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
			</svg>
		</div>
		<div class="method-label-container">
			<span class="method-label">
				{title}
				{#if isCustom}
					<span class="custom-badge">Custom</span>
				{/if}
			</span>
			{#if description && !isCustom}
				<p class="method-description">{description}</p>
			{/if}
		</div>
		<div class="method-actions">
			{#if !isCustom}
				<button
					type="button"
					class="add-note-btn"
					class:active={showAdditionalInfo}
					onclick={toggleAdditionalInfo}
					aria-expanded={showAdditionalInfo}
					aria-label={showAdditionalInfo ? 'Hide notes' : 'Add notes'}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="note-icon"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
						/>
					</svg>
				</button>
			{/if}
			{#if isCustom && onRemoveCustom}
				<button
					type="button"
					class="remove-btn"
					onclick={onRemoveCustom}
					aria-label="Remove custom help method: {title}"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="remove-icon"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>
	</div>

	{#if showAdditionalInfo || isCustom}
		<div class="method-details">
			<div class="input-group">
				<label for={additionalInfoId} class="input-label">
					{isCustom ? 'Additional details (optional)' : 'Notes for this patient (optional)'}
				</label>
				<input
					type="text"
					id={additionalInfoId}
					value={additionalInfo}
					oninput={handleAdditionalInfoInput}
					class="method-input"
					placeholder="Add specific details..."
					maxlength="200"
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.help-method-display {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background-color: rgba(253, 224, 71, 0.08);
		border: 1px solid rgba(202, 138, 4, 0.2);
		border-radius: var(--radius-md);
	}

	.help-method-display.custom {
		border-style: dashed;
		background-color: rgba(253, 224, 71, 0.12);
	}

	.method-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.method-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		margin-top: 2px;
		color: #ca8a04;
	}

	.method-icon svg {
		width: 100%;
		height: 100%;
	}

	.method-label-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.method-label {
		font-weight: 500;
		color: var(--color-text);
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.method-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0;
	}

	.custom-badge {
		font-size: var(--font-size-xs);
		font-weight: 500;
		color: #92400e;
		background-color: rgba(253, 224, 71, 0.3);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
	}

	.method-actions {
		display: flex;
		gap: var(--space-2);
	}

	.add-note-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-sm);
		background-color: var(--color-white);
		color: var(--color-gray-500);
		cursor: pointer;
		transition:
			color 0.15s ease,
			background-color 0.15s ease,
			border-color 0.15s ease;
	}

	.add-note-btn:hover {
		color: #ca8a04;
		border-color: #ca8a04;
		background-color: rgba(253, 224, 71, 0.1);
	}

	.add-note-btn.active {
		color: #ca8a04;
		border-color: #ca8a04;
		background-color: rgba(253, 224, 71, 0.2);
	}

	.add-note-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.note-icon {
		width: 0.875rem;
		height: 0.875rem;
	}

	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		border: none;
		border-radius: var(--radius-sm);
		background-color: transparent;
		color: var(--color-gray-400);
		cursor: pointer;
		transition:
			color 0.15s ease,
			background-color 0.15s ease;
	}

	.remove-btn:hover {
		color: #dc2626;
		background-color: rgba(220, 38, 38, 0.1);
	}

	.remove-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.remove-icon {
		width: 1rem;
		height: 1rem;
	}

	.method-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding-left: calc(1.25rem + var(--space-3));
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.input-label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.method-input {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		color: var(--color-text);
		background-color: var(--color-white);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.method-input::placeholder {
		color: var(--color-gray-400);
	}

	.method-input:focus {
		outline: none;
		border-color: #ca8a04;
		box-shadow: 0 0 0 2px rgba(202, 138, 4, 0.1);
	}

	@media (pointer: coarse) {
		.help-method-display {
			padding: var(--space-4);
		}

		.add-note-btn,
		.remove-btn {
			width: 2.5rem;
			height: 2.5rem;
		}

		.method-input {
			min-height: 44px;
		}
	}
</style>
