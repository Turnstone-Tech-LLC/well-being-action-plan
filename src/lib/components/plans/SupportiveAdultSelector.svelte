<script lang="ts">
	import { generateA11yId } from '$lib/a11y';
	import type { SupportiveAdultType } from '$lib/types/database';
	import type { CustomSupportiveAdult } from '$lib/stores/actionPlanDraft';

	interface Props {
		adultType: SupportiveAdultType | CustomSupportiveAdult;
		isSelected: boolean;
		name: string;
		contactInfo?: string;
		isPrimary: boolean;
		isCustom?: boolean;
		onToggle: () => void;
		onNameChange?: (value: string) => void;
		onContactInfoChange?: (value: string) => void;
		onPrimaryChange?: () => void;
		onRemoveCustom?: () => void;
	}

	let {
		adultType,
		isSelected,
		name = '',
		contactInfo = '',
		isPrimary = false,
		isCustom = false,
		onToggle,
		onNameChange,
		onContactInfoChange,
		onPrimaryChange,
		onRemoveCustom
	}: Props = $props();

	// IDs for accessibility
	const checkboxId = generateA11yId('adult-type');
	const nameInputId = generateA11yId('adult-name');
	const contactInputId = generateA11yId('adult-contact');
	const primaryId = generateA11yId('adult-primary');

	// Get the label for display
	const label = $derived('label' in adultType ? adultType.label : '');

	function handleNameInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onNameChange?.(target.value);
	}

	function handleContactInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onContactInfoChange?.(target.value);
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
	class="adult-selector"
	class:selected={isSelected}
	class:custom={isCustom}
	class:primary={isPrimary}
	role="button"
	tabindex="0"
	onclick={onToggle}
	onkeydown={handleKeydown}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="adult-header" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
		<input
			type="checkbox"
			id={checkboxId}
			checked={isSelected}
			class="adult-checkbox"
			aria-label="Select {label}"
			onchange={onToggle}
		/>
		<label for={checkboxId} class="adult-label">
			{label}
			{#if isCustom}
				<span class="custom-badge">Custom</span>
			{/if}
			{#if isPrimary}
				<span class="primary-badge">Primary</span>
			{/if}
		</label>
		{#if isCustom && onRemoveCustom}
			<button
				type="button"
				class="remove-btn"
				onclick={(e) => {
					e.stopPropagation();
					onRemoveCustom();
				}}
				aria-label="Remove custom adult: {label}"
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
		<div class="adult-details" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
			<div class="input-group">
				<label for={nameInputId} class="input-label">Name</label>
				<input
					type="text"
					id={nameInputId}
					value={name}
					oninput={handleNameInput}
					class="adult-input"
					placeholder="Enter name..."
					maxlength="100"
				/>
			</div>

			<div class="input-group">
				<label for={contactInputId} class="input-label">Contact Info (optional)</label>
				<input
					type="text"
					id={contactInputId}
					value={contactInfo}
					oninput={handleContactInput}
					class="adult-input"
					placeholder="Phone or email..."
					maxlength="200"
				/>
			</div>

			<div class="primary-toggle">
				<input
					type="checkbox"
					id={primaryId}
					checked={isPrimary}
					class="primary-checkbox"
					onchange={onPrimaryChange}
				/>
				<label for={primaryId} class="primary-label"> Mark as primary supportive adult </label>
			</div>
		</div>
	{/if}
</div>

<style>
	.adult-selector {
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

	.adult-selector:hover {
		border-color: var(--color-gray-300);
		background-color: var(--color-gray-50);
	}

	.adult-selector:focus-visible {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.adult-selector.selected {
		border-color: var(--color-primary);
		background-color: rgba(0, 89, 76, 0.05);
	}

	.adult-selector.custom {
		border-style: dashed;
	}

	.adult-selector.custom.selected {
		border-style: solid;
	}

	.adult-selector.primary.selected {
		border-color: #ffc72c;
		background-color: rgba(255, 199, 44, 0.1);
		box-shadow: 0 0 0 2px rgba(255, 199, 44, 0.3);
	}

	.adult-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.adult-checkbox {
		width: 1.25rem;
		height: 1.25rem;
		accent-color: var(--color-primary);
		cursor: pointer;
		flex-shrink: 0;
	}

	.adult-checkbox:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.adult-label {
		flex: 1;
		font-weight: 500;
		color: var(--color-text);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.custom-badge {
		font-size: var(--font-size-xs);
		font-weight: 500;
		color: var(--color-primary);
		background-color: rgba(0, 89, 76, 0.1);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
	}

	.primary-badge {
		font-size: var(--font-size-xs);
		font-weight: 500;
		color: #92400e;
		background-color: rgba(255, 199, 44, 0.3);
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

	.adult-details {
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

	.adult-input {
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

	.adult-input::placeholder {
		color: var(--color-gray-400);
	}

	.adult-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(0, 89, 76, 0.1);
	}

	.primary-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding-top: var(--space-2);
	}

	.primary-checkbox {
		width: 1rem;
		height: 1rem;
		accent-color: #ffc72c;
		cursor: pointer;
	}

	.primary-checkbox:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.primary-label {
		font-size: var(--font-size-sm);
		color: var(--color-text);
		cursor: pointer;
	}

	@media (pointer: coarse) {
		.adult-selector {
			padding: var(--space-4);
		}

		.adult-checkbox {
			width: 1.5rem;
			height: 1.5rem;
		}

		.remove-btn {
			width: 2.5rem;
			height: 2.5rem;
		}

		.adult-input {
			min-height: 44px;
		}

		.primary-checkbox {
			width: 1.25rem;
			height: 1.25rem;
		}
	}
</style>
