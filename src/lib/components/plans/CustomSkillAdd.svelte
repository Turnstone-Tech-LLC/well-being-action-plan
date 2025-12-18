<script lang="ts">
	import { generateA11yId } from '$lib/a11y';
	import type { SkillCategory } from '$lib/types/database';

	interface Props {
		category: SkillCategory;
		onAdd: (title: string, category: SkillCategory) => void;
	}

	let { category, onAdd }: Props = $props();

	let isAdding = $state(false);
	let title = $state('');
	let error = $state('');

	const inputId = generateA11yId('custom-skill');
	const errorId = generateA11yId('custom-skill-error');

	function handleStartAdd() {
		isAdding = true;
		title = '';
		error = '';
	}

	function handleCancel() {
		isAdding = false;
		title = '';
		error = '';
	}

	function handleSubmit() {
		const trimmedTitle = title.trim();

		if (!trimmedTitle) {
			error = 'Please enter a skill name';
			return;
		}

		if (trimmedTitle.length > 100) {
			error = 'Skill name must be 100 characters or less';
			return;
		}

		onAdd(trimmedTitle, category);
		isAdding = false;
		title = '';
		error = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSubmit();
		} else if (event.key === 'Escape') {
			handleCancel();
		}
	}
</script>

<div class="custom-skill-add">
	{#if isAdding}
		<div class="add-form">
			<div class="form-group">
				<label for={inputId} class="visually-hidden">Custom skill name</label>
				<input
					type="text"
					id={inputId}
					bind:value={title}
					onkeydown={handleKeydown}
					class="add-input"
					class:error
					placeholder="Enter custom skill..."
					maxlength="100"
					aria-describedby={error ? errorId : undefined}
					aria-invalid={error ? 'true' : undefined}
				/>
				{#if error}
					<span id={errorId} class="error-message" role="alert">{error}</span>
				{/if}
			</div>
			<div class="form-actions">
				<button type="button" class="btn btn-sm btn-primary" onclick={handleSubmit}> Add </button>
				<button type="button" class="btn btn-sm btn-ghost" onclick={handleCancel}> Cancel </button>
			</div>
		</div>
	{:else}
		<button type="button" class="add-button" onclick={handleStartAdd}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="add-icon"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Add custom skill
		</button>
	{/if}
</div>

<style>
	.custom-skill-add {
		margin-top: var(--space-2);
	}

	.add-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: none;
		border: 2px dashed var(--color-gray-300);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			color 0.15s ease,
			background-color 0.15s ease;
	}

	.add-button:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
		background-color: rgba(0, 89, 76, 0.05);
	}

	.add-button:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.add-icon {
		width: 1rem;
		height: 1rem;
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		background-color: var(--color-gray-50);
		border: 2px dashed var(--color-gray-300);
		border-radius: var(--radius-md);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.add-input {
		padding: var(--space-2) var(--space-3);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		color: var(--color-text);
		background-color: var(--color-white);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.add-input::placeholder {
		color: var(--color-gray-400);
	}

	.add-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.add-input.error {
		border-color: #dc2626;
	}

	.error-message {
		color: #dc2626;
		font-size: var(--font-size-xs);
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: var(--radius-sm);
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	.btn-sm {
		padding: var(--space-1) var(--space-3);
		font-size: var(--font-size-sm);
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover {
		background-color: #004a3f;
	}

	.btn-primary:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-ghost {
		background-color: transparent;
		color: var(--color-text-muted);
	}

	.btn-ghost:hover {
		background-color: var(--color-gray-100);
		color: var(--color-text);
	}

	.btn-ghost:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
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

	@media (pointer: coarse) {
		.add-button {
			min-height: 44px;
		}

		.btn-sm {
			min-height: 36px;
		}

		.add-input {
			min-height: 44px;
		}
	}
</style>
