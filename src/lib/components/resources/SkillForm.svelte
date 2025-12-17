<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Skill, SkillCategory } from '$lib/types/database';
	import { generateA11yId } from '$lib/a11y';

	interface Props {
		skill?: Skill | null;
		formError?: string | null;
		fieldErrors?: Record<string, string> | null;
	}

	let { skill = null, formError = null, fieldErrors = null }: Props = $props();

	// Form state
	let title = $state(skill?.title ?? '');
	let category = $state<SkillCategory | ''>(skill?.category ?? '');
	let hasFillIn = $state(skill?.has_fill_in ?? false);
	let fillInPrompt = $state(skill?.fill_in_prompt ?? '');
	let loading = $state(false);

	// IDs for accessibility
	const titleErrorId = generateA11yId('title-error');
	const categoryErrorId = generateA11yId('category-error');
	const fillInPromptErrorId = generateA11yId('fill-in-error');
	const formErrorId = generateA11yId('form-error');

	// Client-side validation state
	let clientErrors = $state<Record<string, string>>({});

	// Categories for the select dropdown
	const categories: { value: SkillCategory; label: string }[] = [
		{ value: 'physical', label: 'Physical' },
		{ value: 'creative', label: 'Creative' },
		{ value: 'social', label: 'Social' },
		{ value: 'mindfulness', label: 'Mindfulness' }
	];

	// Derived error states
	const titleError = $derived(fieldErrors?.title || clientErrors.title || null);
	const categoryError = $derived(fieldErrors?.category || clientErrors.category || null);
	const fillInPromptError = $derived(
		fieldErrors?.fillInPrompt || clientErrors.fillInPrompt || null
	);

	// Determine if we're in edit mode
	const isEditMode = $derived(skill !== null);

	// Client-side validation
	function validateForm(): boolean {
		const errors: Record<string, string> = {};

		// Title validation
		if (!title.trim()) {
			errors.title = 'Title is required';
		} else if (title.length > 100) {
			errors.title = 'Title must be 100 characters or less';
		}

		// Category validation
		if (!category) {
			errors.category = 'Category is required';
		}

		// Fill-in prompt validation (required if has_fill_in is checked)
		if (hasFillIn && !fillInPrompt.trim()) {
			errors.fillInPrompt = 'Fill-in prompt is required when "Has fill-in field" is checked';
		}

		clientErrors = errors;
		return Object.keys(errors).length === 0;
	}

	function handleTitleBlur() {
		if (title.trim() === '') {
			clientErrors = { ...clientErrors, title: 'Title is required' };
		} else if (title.length > 100) {
			clientErrors = { ...clientErrors, title: 'Title must be 100 characters or less' };
		} else {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { title: _title, ...rest } = clientErrors;
			clientErrors = rest;
		}
	}

	function handleCategoryBlur() {
		if (!category) {
			clientErrors = { ...clientErrors, category: 'Category is required' };
		} else {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { category: _category, ...rest } = clientErrors;
			clientErrors = rest;
		}
	}

	function handleFillInPromptBlur() {
		if (hasFillIn && !fillInPrompt.trim()) {
			clientErrors = {
				...clientErrors,
				fillInPrompt: 'Fill-in prompt is required when "Has fill-in field" is checked'
			};
		} else {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { fillInPrompt: _fillInPrompt, ...rest } = clientErrors;
			clientErrors = rest;
		}
	}

	// Clear fill-in prompt error when has_fill_in is unchecked
	$effect(() => {
		if (!hasFillIn && clientErrors.fillInPrompt) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { fillInPrompt: _fillInPrompt, ...rest } = clientErrors;
			clientErrors = rest;
		}
	});
</script>

<form
	method="POST"
	class="skill-form"
	onsubmit={(e) => {
		if (!validateForm()) {
			e.preventDefault();
		}
	}}
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			await update();
		};
	}}
>
	{#if formError}
		<div class="form-error" id={formErrorId} role="alert">
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
			{formError}
		</div>
	{/if}

	<div class="form-group">
		<label for="title" class="form-label">
			Title <span class="required">*</span>
		</label>
		<input
			type="text"
			id="title"
			name="title"
			bind:value={title}
			onblur={handleTitleBlur}
			class="form-input"
			class:error={titleError}
			aria-describedby={titleError ? titleErrorId : undefined}
			aria-invalid={titleError ? 'true' : undefined}
			disabled={loading}
			maxlength="100"
			placeholder="e.g., Listen to podcasts"
		/>
		<div class="input-footer">
			{#if titleError}
				<span class="field-error" id={titleErrorId} role="alert">{titleError}</span>
			{/if}
			<span class="char-count" class:warning={title.length > 80}>{title.length}/100</span>
		</div>
	</div>

	<div class="form-group">
		<label for="category" class="form-label">
			Category <span class="required">*</span>
		</label>
		<select
			id="category"
			name="category"
			bind:value={category}
			onblur={handleCategoryBlur}
			class="form-select"
			class:error={categoryError}
			aria-describedby={categoryError ? categoryErrorId : undefined}
			aria-invalid={categoryError ? 'true' : undefined}
			disabled={loading}
		>
			<option value="">Select a category</option>
			{#each categories as cat (cat.value)}
				<option value={cat.value}>{cat.label}</option>
			{/each}
		</select>
		{#if categoryError}
			<span class="field-error" id={categoryErrorId} role="alert">{categoryError}</span>
		{/if}
	</div>

	<div class="form-group">
		<div class="checkbox-group">
			<input
				type="checkbox"
				id="has_fill_in"
				name="has_fill_in"
				bind:checked={hasFillIn}
				class="form-checkbox"
				disabled={loading}
			/>
			<label for="has_fill_in" class="checkbox-label">
				Has fill-in field
				<span class="checkbox-description">
					Enable this if the skill has a customizable field for users to fill in
				</span>
			</label>
		</div>
	</div>

	{#if hasFillIn}
		<div class="form-group fill-in-group">
			<label for="fill_in_prompt" class="form-label">
				Fill-in prompt <span class="required">*</span>
			</label>
			<input
				type="text"
				id="fill_in_prompt"
				name="fill_in_prompt"
				bind:value={fillInPrompt}
				onblur={handleFillInPromptBlur}
				class="form-input"
				class:error={fillInPromptError}
				aria-describedby={fillInPromptError ? fillInPromptErrorId : undefined}
				aria-invalid={fillInPromptError ? 'true' : undefined}
				disabled={loading}
				placeholder="e.g., 'which ones?'"
			/>
			{#if fillInPromptError}
				<span class="field-error" id={fillInPromptErrorId} role="alert">{fillInPromptError}</span>
			{/if}
			<p class="help-text">This prompt will be shown to users when they select this skill</p>
		</div>
	{/if}

	<div class="form-actions">
		<a href="/provider/resources/skills" class="btn btn-outline" class:disabled={loading}>
			Cancel
		</a>
		<button type="submit" class="btn btn-primary" disabled={loading}>
			{#if loading}
				<span class="spinner" aria-hidden="true"></span>
				{isEditMode ? 'Saving...' : 'Creating...'}
			{:else}
				{isEditMode ? 'Save Changes' : 'Create Skill'}
			{/if}
		</button>
	</div>
</form>

<style>
	.skill-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 32rem;
	}

	.form-error {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4);
		background-color: rgba(220, 38, 38, 0.1);
		border: 1px solid rgba(220, 38, 38, 0.3);
		border-radius: var(--radius-md);
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
		color: var(--color-text);
		font-size: var(--font-size-sm);
	}

	.required {
		color: #dc2626;
	}

	.form-input,
	.form-select {
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

	.form-input:focus,
	.form-select:focus {
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

	.form-input:disabled,
	.form-select:disabled {
		background-color: var(--color-gray-50);
		cursor: not-allowed;
	}

	.input-footer {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-2);
	}

	.field-error {
		color: #dc2626;
		font-size: var(--font-size-sm);
		flex: 1;
	}

	.char-count {
		color: var(--color-text-muted);
		font-size: var(--font-size-xs);
		flex-shrink: 0;
	}

	.char-count.warning {
		color: #d97706;
	}

	.checkbox-group {
		display: flex;
		gap: var(--space-3);
		align-items: flex-start;
	}

	.form-checkbox {
		width: 1.25rem;
		height: 1.25rem;
		margin-top: 0.125rem;
		accent-color: var(--color-primary);
		cursor: pointer;
	}

	.form-checkbox:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.checkbox-label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-weight: 500;
		cursor: pointer;
	}

	.checkbox-description {
		font-size: var(--font-size-sm);
		font-weight: 400;
		color: var(--color-text-muted);
	}

	.fill-in-group {
		margin-left: calc(1.25rem + var(--space-3));
		padding-left: var(--space-4);
		border-left: 2px solid var(--color-gray-200);
	}

	.help-text {
		font-size: var(--font-size-sm);
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

	.btn-primary:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-text);
		border: 2px solid var(--color-gray-300);
	}

	.btn-outline:hover:not(.disabled) {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.btn-outline:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-outline.disabled {
		opacity: 0.7;
		cursor: not-allowed;
		pointer-events: none;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.75s linear infinite;
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
		.form-select {
			min-height: 44px;
		}

		.form-checkbox {
			width: 1.5rem;
			height: 1.5rem;
		}
	}
</style>
