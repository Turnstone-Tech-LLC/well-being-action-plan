<script lang="ts">
	import { generateA11yId } from '$lib/a11y';

	interface Props {
		onAdd: (label: string, name: string) => void;
	}

	let { onAdd }: Props = $props();

	let isAdding = $state(false);
	let label = $state('');
	let name = $state('');
	let error = $state('');

	const labelInputId = generateA11yId('custom-adult-label');
	const nameInputId = generateA11yId('custom-adult-name');
	const errorId = generateA11yId('custom-adult-error');

	function handleStartAdd() {
		isAdding = true;
		label = '';
		name = '';
		error = '';
	}

	function handleCancel() {
		isAdding = false;
		label = '';
		name = '';
		error = '';
	}

	function handleSubmit() {
		const trimmedLabel = label.trim();
		const trimmedName = name.trim();

		if (!trimmedLabel) {
			error = 'Please enter a type (e.g., Aunt, Family friend)';
			return;
		}

		if (trimmedLabel.length > 50) {
			error = 'Type must be 50 characters or less';
			return;
		}

		if (!trimmedName) {
			error = "Please enter the person's name";
			return;
		}

		if (trimmedName.length > 100) {
			error = 'Name must be 100 characters or less';
			return;
		}

		onAdd(trimmedLabel, trimmedName);
		isAdding = false;
		label = '';
		name = '';
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

<div class="custom-adult-add">
	{#if isAdding}
		<div class="add-form">
			<div class="form-row">
				<div class="form-group">
					<label for={labelInputId} class="form-label">Type of Adult</label>
					<input
						type="text"
						id={labelInputId}
						bind:value={label}
						onkeydown={handleKeydown}
						class="add-input"
						class:error
						placeholder="e.g., Aunt, Family friend"
						maxlength="50"
						aria-describedby={error ? errorId : undefined}
						aria-invalid={error ? 'true' : undefined}
					/>
				</div>
				<div class="form-group">
					<label for={nameInputId} class="form-label">Name</label>
					<input
						type="text"
						id={nameInputId}
						bind:value={name}
						onkeydown={handleKeydown}
						class="add-input"
						class:error
						placeholder="Enter name..."
						maxlength="100"
						aria-describedby={error ? errorId : undefined}
						aria-invalid={error ? 'true' : undefined}
					/>
				</div>
			</div>
			{#if error}
				<span id={errorId} class="error-message" role="alert">{error}</span>
			{/if}
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
			Add another type of adult
		</button>
	{/if}
</div>

<style>
	.custom-adult-add {
		margin-top: var(--space-4);
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
		gap: var(--space-3);
		padding: var(--space-4);
		background-color: var(--color-gray-50);
		border: 2px dashed var(--color-gray-300);
		border-radius: var(--radius-md);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.form-label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text);
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

	@media (max-width: 480px) {
		.form-row {
			grid-template-columns: 1fr;
		}
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
