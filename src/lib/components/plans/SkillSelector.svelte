<script lang="ts">
	import { generateA11yId } from '$lib/a11y';
	import type { Skill } from '$lib/types/database';
	import type { CustomSkill } from '$lib/stores/actionPlanDraft';

	interface Props {
		skill: Skill | CustomSkill;
		isSelected: boolean;
		fillInValue?: string;
		isCustom?: boolean;
		onToggle: () => void;
		onFillInChange?: (value: string) => void;
		onRemoveCustom?: () => void;
	}

	let {
		skill,
		isSelected,
		fillInValue = '',
		isCustom = false,
		onToggle,
		onFillInChange,
		onRemoveCustom
	}: Props = $props();

	// IDs for accessibility
	const checkboxId = generateA11yId('skill');
	const fillInId = generateA11yId('fill-in');

	// Get the fill-in prompt if available (only for predefined skills)
	const fillInPrompt = $derived('fill_in_prompt' in skill ? skill.fill_in_prompt : null);
	const hasFillIn = $derived('has_fill_in' in skill ? skill.has_fill_in : false);

	function handleFillInInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onFillInChange?.(target.value);
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
	class="skill-selector"
	class:selected={isSelected}
	class:custom={isCustom}
	role="button"
	tabindex="0"
	onclick={onToggle}
	onkeydown={handleKeydown}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="skill-header" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
		<input
			type="checkbox"
			id={checkboxId}
			checked={isSelected}
			class="skill-checkbox"
			aria-label="Select {skill.title}"
			onchange={onToggle}
		/>
		<label for={checkboxId} class="skill-label">
			{skill.title}
			{#if isCustom}
				<span class="custom-badge">Custom</span>
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
				aria-label="Remove custom skill: {skill.title}"
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

	{#if isSelected && hasFillIn && fillInPrompt}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fill-in-field" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
			<label for={fillInId} class="fill-in-label">{fillInPrompt}</label>
			<input
				type="text"
				id={fillInId}
				value={fillInValue}
				oninput={handleFillInInput}
				class="fill-in-input"
				placeholder="Enter details..."
				maxlength="200"
			/>
		</div>
	{/if}
</div>

<style>
	.skill-selector {
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

	.skill-selector:hover {
		border-color: var(--color-gray-300);
		background-color: var(--color-gray-50);
	}

	.skill-selector:focus-visible {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.skill-selector.selected {
		border-color: var(--color-primary);
		background-color: rgba(0, 89, 76, 0.05);
	}

	.skill-selector.custom {
		border-style: dashed;
	}

	.skill-selector.custom.selected {
		border-style: solid;
	}

	.skill-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.skill-checkbox {
		width: 1.25rem;
		height: 1.25rem;
		accent-color: var(--color-primary);
		cursor: pointer;
		flex-shrink: 0;
	}

	.skill-checkbox:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.skill-label {
		flex: 1;
		font-weight: 500;
		color: var(--color-text);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.custom-badge {
		font-size: var(--font-size-xs);
		font-weight: 500;
		color: var(--color-primary);
		background-color: rgba(0, 89, 76, 0.1);
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

	.fill-in-field {
		padding-left: calc(1.25rem + var(--space-3));
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.fill-in-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.fill-in-input {
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

	.fill-in-input::placeholder {
		color: var(--color-gray-400);
	}

	.fill-in-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(0, 89, 76, 0.1);
	}

	@media (pointer: coarse) {
		.skill-selector {
			padding: var(--space-4);
		}

		.skill-checkbox {
			width: 1.5rem;
			height: 1.5rem;
		}

		.remove-btn {
			width: 2.5rem;
			height: 2.5rem;
		}

		.fill-in-input {
			min-height: 44px;
		}
	}
</style>
