<script lang="ts">
	import type { HelpMethod } from '$lib/types/database';
	import { enhance } from '$app/forms';

	interface Props {
		method?: HelpMethod | null;
		action: string;
		error?: string | null;
	}

	let { method = null, action, error = null }: Props = $props();

	// Form state
	let title = $state(method?.title ?? '');
	let description = $state(method?.description ?? '');
	let isSubmitting = $state(false);
	let formError = $state(error);

	// Validation
	const isTitleValid = $derived(title.trim().length > 0);
	const canSubmit = $derived(isTitleValid && !isSubmitting);

	// Mode
	const isEditMode = $derived(method !== null);
</script>

<form
	method="POST"
	{action}
	class="method-form"
	use:enhance={() => {
		isSubmitting = true;
		formError = null;
		return async ({ result, update }) => {
			isSubmitting = false;
			if (result.type === 'failure' && result.data?.error) {
				formError = result.data.error as string;
			} else {
				await update();
			}
		};
	}}
>
	{#if formError}
		<div class="error-banner" role="alert">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="error-icon"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
				/>
			</svg>
			<span>{formError}</span>
		</div>
	{/if}

	<div class="form-group">
		<label for="title" class="form-label">
			Title
			<span class="required" aria-hidden="true">*</span>
		</label>
		<input
			type="text"
			id="title"
			name="title"
			bind:value={title}
			class="form-input"
			class:error={!isTitleValid && title !== ''}
			placeholder="e.g., Help identifying and managing my emotions"
			required
			aria-required="true"
			aria-invalid={!isTitleValid && title !== ''}
			aria-describedby="title-hint"
		/>
		<p id="title-hint" class="form-hint">
			A short description of the type of help the patient can request.
		</p>
	</div>

	<div class="form-group">
		<label for="description" class="form-label">
			Description
			<span class="optional">(optional)</span>
		</label>
		<textarea
			id="description"
			name="description"
			bind:value={description}
			class="form-textarea"
			placeholder="Additional context about this help method..."
			rows="3"
			aria-describedby="description-hint"
		></textarea>
		<p id="description-hint" class="form-hint">
			Provide additional details about when or how this help method should be used.
		</p>
	</div>

	<div class="form-actions">
		<a href="/provider/resources/help-methods" class="btn btn-outline">Cancel</a>
		<button type="submit" class="btn btn-primary" disabled={!canSubmit}>
			{#if isSubmitting}
				<span class="spinner" aria-hidden="true"></span>
				{isEditMode ? 'Saving...' : 'Creating...'}
			{:else}
				{isEditMode ? 'Save Changes' : 'Create Help Method'}
			{/if}
		</button>
	</div>
</form>

<style>
	.method-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 32rem;
	}

	.error-banner {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		padding: var(--space-3);
		background-color: rgba(220, 38, 38, 0.1);
		border-radius: var(--radius-md);
		border: 1px solid rgba(220, 38, 38, 0.2);
		color: #dc2626;
		font-size: var(--font-size-sm);
	}

	.error-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-label {
		font-weight: 500;
		font-size: var(--font-size-sm);
		color: var(--color-text);
	}

	.required {
		color: #dc2626;
		margin-left: var(--space-1);
	}

	.optional {
		font-weight: 400;
		color: var(--color-text-muted);
		font-size: var(--font-size-xs);
	}

	.form-input,
	.form-textarea {
		padding: var(--space-3);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		color: var(--color-text);
		background-color: var(--color-white);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.form-input::placeholder,
	.form-textarea::placeholder {
		color: var(--color-gray-400);
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.form-input.error {
		border-color: #dc2626;
	}

	.form-input.error:focus {
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}

	.form-textarea {
		resize: vertical;
		min-height: 5rem;
	}

	.form-hint {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin: 0;
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
		cursor: pointer;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
		border: none;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #004a3f;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-outline {
		background-color: transparent;
		border: 2px solid var(--color-gray-300);
		color: var(--color-text);
	}

	.btn-outline:hover {
		border-color: var(--color-gray-400);
		background-color: var(--color-gray-50);
	}

	.btn-outline:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}

		.form-input,
		.form-textarea {
			min-height: 44px;
		}
	}
</style>
