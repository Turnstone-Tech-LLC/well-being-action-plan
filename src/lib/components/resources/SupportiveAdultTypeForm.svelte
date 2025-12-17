<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SupportiveAdultType } from '$lib/types/database';

	interface Props {
		type?: SupportiveAdultType | null;
		error?: string | null;
		loading?: boolean;
	}

	let { type = null, error = null, loading = $bindable(false) }: Props = $props();

	// Form state
	let label = $state(type?.label ?? '');
	let hasFillIn = $state(type?.has_fill_in ?? true);

	// Validation
	const isValid = $derived(label.trim().length > 0);

	// Whether this is edit mode
	const isEditMode = $derived(type !== null);
</script>

<form
	method="POST"
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			await update();
		};
	}}
>
	<div class="form-group">
		<label for="label" class="form-label">
			Label <span class="required">*</span>
		</label>
		<input
			type="text"
			id="label"
			name="label"
			bind:value={label}
			required
			disabled={loading}
			class="form-input"
			placeholder="e.g., School counselor"
			aria-required="true"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? 'form-error' : 'label-help'}
		/>
		<p id="label-help" class="form-help">
			The type name that will appear in action plans (e.g., "Grandparent", "Coach")
		</p>
	</div>

	<div class="form-group">
		<label class="checkbox-label">
			<input
				type="checkbox"
				name="has_fill_in"
				bind:checked={hasFillIn}
				disabled={loading}
				class="checkbox-input"
			/>
			<span class="checkbox-text">Has name field</span>
		</label>
		<p class="form-help checkbox-help">
			When enabled, patients can write in the specific person's name for this type of supportive
			adult
		</p>
	</div>

	{#if error}
		<div id="form-error" role="alert" class="error-message">
			{error}
		</div>
	{/if}

	<div class="form-actions">
		<a href="/provider/resources/supportive-adults" class="btn btn-outline">Cancel</a>
		<button type="submit" class="btn btn-primary" disabled={loading || !isValid}>
			{#if loading}
				{isEditMode ? 'Saving...' : 'Creating...'}
			{:else}
				{isEditMode ? 'Save Changes' : 'Create Type'}
			{/if}
		</button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-label {
		font-weight: 600;
		font-size: var(--font-size-sm);
		color: var(--color-text);
	}

	.required {
		color: #dc2626;
	}

	.form-input {
		padding: var(--space-3) var(--space-4);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		color: var(--color-text);
		background-color: var(--color-white);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.form-input::placeholder {
		color: var(--color-gray-400);
	}

	.form-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.form-input:disabled {
		background-color: var(--color-gray-50);
		cursor: not-allowed;
	}

	.form-input[aria-invalid='true'] {
		border-color: #dc2626;
	}

	.form-help {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		cursor: pointer;
	}

	.checkbox-input {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid var(--color-gray-300);
		border-radius: var(--radius-sm);
		cursor: pointer;
		accent-color: var(--color-primary);
	}

	.checkbox-input:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.checkbox-text {
		font-weight: 500;
		color: var(--color-text);
	}

	.checkbox-help {
		margin-left: calc(1.25rem + var(--space-3));
	}

	.error-message {
		padding: var(--space-3) var(--space-4);
		background-color: rgba(220, 38, 38, 0.1);
		border: 1px solid rgba(220, 38, 38, 0.2);
		border-radius: var(--radius-md);
		color: #dc2626;
		font-size: var(--font-size-sm);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-gray-200);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-5);
		font-weight: 500;
		font-size: var(--font-size-sm);
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

	.btn-primary:hover:not(:disabled) {
		background-color: #004a3f;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}

		.form-input {
			min-height: 44px;
		}

		.checkbox-input {
			min-width: 44px;
			min-height: 44px;
		}
	}
</style>
