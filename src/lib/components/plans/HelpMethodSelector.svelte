<script lang="ts">
	import { generateA11yId } from '$lib/a11y';
	import type { HelpMethod } from '$lib/types/database';
	import type { CustomHelpMethod } from '$lib/stores/actionPlanDraft';

	interface Props {
		helpMethod: HelpMethod | CustomHelpMethod;
		isSelected: boolean;
		additionalInfo?: string;
		isCustom?: boolean;
		onToggle: () => void;
		onAdditionalInfoChange?: (value: string) => void;
		onRemoveCustom?: () => void;
	}

	let {
		helpMethod,
		isSelected,
		additionalInfo = '',
		isCustom = false,
		onToggle,
		onAdditionalInfoChange,
		onRemoveCustom
	}: Props = $props();

	// IDs for accessibility
	const checkboxId = generateA11yId('help-method');
	const additionalInfoId = generateA11yId('help-additional');

	// Get the title for display
	const title = $derived(helpMethod.title);

	// Get description if available (only on HelpMethod type, not CustomHelpMethod)
	const description = $derived('description' in helpMethod ? helpMethod.description : null);

	function handleAdditionalInfoInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onAdditionalInfoChange?.(target.value);
	}

	function handleKeydown(event: KeyboardEvent) {
		// Allow pressing Enter or Space to toggle when focused on the card
		if (event.key === 'Enter' || event.key === ' ') {
			if ((event.target as HTMLElement).tagName !== 'INPUT') {
				event.preventDefault();
				onToggle();
			}
		}
	}
</script>

<div
	class="help-method-selector"
	class:selected={isSelected}
	class:custom={isCustom}
	role="button"
	tabindex="0"
	onclick={onToggle}
	onkeydown={handleKeydown}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="method-header" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
		<input
			type="checkbox"
			id={checkboxId}
			checked={isSelected}
			class="method-checkbox"
			aria-label="Select {title}"
			onchange={onToggle}
		/>
		<div class="method-label-container">
			<label for={checkboxId} class="method-label">
				{title}
				{#if isCustom}
					<span class="custom-badge">Custom</span>
				{/if}
			</label>
			{#if description && !isCustom}
				<p class="method-description">{description}</p>
			{/if}
		</div>
		{#if isCustom && onRemoveCustom}
			<button
				type="button"
				class="remove-btn"
				onclick={(e) => {
					e.stopPropagation();
					onRemoveCustom();
				}}
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

	{#if isSelected}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="method-details" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
			<div class="input-group">
				<label for={additionalInfoId} class="input-label">Additional notes (optional)</label>
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
	.help-method-selector {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-white);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.help-method-selector:hover {
		border-color: var(--color-gray-300);
		background-color: var(--color-gray-50);
	}

	.help-method-selector:focus-visible {
		outline: none;
		border-color: #ca8a04;
		box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.1);
	}

	.help-method-selector.selected {
		border-color: #ca8a04;
		background-color: rgba(253, 224, 71, 0.1);
	}

	.help-method-selector.custom {
		border-style: dashed;
	}

	.help-method-selector.custom.selected {
		border-style: solid;
	}

	.method-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.method-checkbox {
		width: 1.25rem;
		height: 1.25rem;
		accent-color: #ca8a04;
		cursor: pointer;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.method-checkbox:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
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
		cursor: pointer;
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
		.help-method-selector {
			padding: var(--space-4);
		}

		.method-checkbox {
			width: 1.5rem;
			height: 1.5rem;
		}

		.remove-btn {
			width: 2.5rem;
			height: 2.5rem;
		}

		.method-input {
			min-height: 44px;
		}
	}
</style>
