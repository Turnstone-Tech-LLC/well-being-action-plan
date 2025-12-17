<script lang="ts">
	import type { CrisisResource, CrisisContactType } from '$lib/types/database';
	import { enhance } from '$app/forms';

	interface Props {
		resource: CrisisResource;
		action: string;
		error?: string | null;
	}

	let { resource, action, error = null }: Props = $props();

	// Form state - edit mode only
	let name = $state(resource.name);
	let contact = $state(resource.contact);
	let contactType = $state<CrisisContactType | ''>(resource.contact_type ?? '');
	let description = $state(resource.description ?? '');
	let isSubmitting = $state(false);
	let formError = $state(error);

	// Validation
	const isNameValid = $derived(name.trim().length > 0);
	const isContactValid = $derived(contact.trim().length > 0);
	const isContactTypeValid = $derived(contactType !== '');
	const canSubmit = $derived(isNameValid && isContactValid && isContactTypeValid && !isSubmitting);

	// Contact type options
	const contactTypeOptions: { value: CrisisContactType; label: string }[] = [
		{ value: 'phone', label: 'Phone' },
		{ value: 'text', label: 'Text' },
		{ value: 'website', label: 'Website' }
	];
</script>

<form
	method="POST"
	{action}
	class="resource-form"
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
	<!-- Warning Banner -->
	<div class="warning-banner" role="alert">
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
		<div class="warning-content">
			<strong>Important:</strong> Changes to crisis resources affect all action plans across your organization.
		</div>
	</div>

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
		<label for="name" class="form-label">
			Name
			<span class="required" aria-hidden="true">*</span>
		</label>
		<input
			type="text"
			id="name"
			name="name"
			bind:value={name}
			class="form-input"
			class:error={!isNameValid && name !== resource.name}
			placeholder="e.g., National Suicide Prevention Line"
			required
			aria-required="true"
			aria-invalid={!isNameValid && name !== resource.name}
			aria-describedby="name-hint"
		/>
		<p id="name-hint" class="form-hint">The name of the crisis resource or organization.</p>
	</div>

	<div class="form-group">
		<label for="contact" class="form-label">
			Contact
			<span class="required" aria-hidden="true">*</span>
		</label>
		<input
			type="text"
			id="contact"
			name="contact"
			bind:value={contact}
			class="form-input"
			class:error={!isContactValid && contact !== resource.contact}
			placeholder="e.g., 988 or 741741"
			required
			aria-required="true"
			aria-invalid={!isContactValid && contact !== resource.contact}
			aria-describedby="contact-hint"
		/>
		<p id="contact-hint" class="form-hint">Phone number, text code, or website URL.</p>
	</div>

	<div class="form-group">
		<label for="contact-type" class="form-label">
			Contact Type
			<span class="required" aria-hidden="true">*</span>
		</label>
		<select
			id="contact-type"
			name="contact_type"
			bind:value={contactType}
			class="form-select"
			class:error={!isContactTypeValid && contactType !== (resource.contact_type ?? '')}
			required
			aria-required="true"
			aria-invalid={!isContactTypeValid}
			aria-describedby="contact-type-hint"
		>
			<option value="" disabled>Select contact type...</option>
			{#each contactTypeOptions as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<p id="contact-type-hint" class="form-hint">How patients should contact this resource.</p>
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
			placeholder="Additional context about this crisis resource..."
			rows="3"
			aria-describedby="description-hint"
		></textarea>
		<p id="description-hint" class="form-hint">
			Provide additional details about when or how to use this resource.
		</p>
	</div>

	<div class="form-actions">
		<a href="/provider/resources/crisis" class="btn btn-outline">Cancel</a>
		<button type="submit" class="btn btn-primary" disabled={!canSubmit}>
			{#if isSubmitting}
				<span class="spinner" aria-hidden="true"></span>
				Saving...
			{:else}
				Save Changes
			{/if}
		</button>
	</div>
</form>

<style>
	.resource-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 32rem;
	}

	.warning-banner {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		background-color: rgba(245, 158, 11, 0.1);
		border-radius: var(--radius-md);
		border: 1px solid rgba(245, 158, 11, 0.3);
		color: #92400e;
		font-size: var(--font-size-sm);
	}

	.warning-icon {
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		color: #f59e0b;
	}

	.warning-content {
		line-height: 1.5;
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
	.form-select,
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
	.form-select:focus,
	.form-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.form-input.error,
	.form-select.error {
		border-color: #dc2626;
	}

	.form-input.error:focus,
	.form-select.error:focus {
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}

	.form-select {
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 0.75rem center;
		background-repeat: no-repeat;
		background-size: 1.25rem;
		padding-right: 2.5rem;
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
		.form-select,
		.form-textarea {
			min-height: 44px;
		}
	}
</style>
