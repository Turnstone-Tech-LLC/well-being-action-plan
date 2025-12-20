<script lang="ts">
	import { enhance } from '$app/forms';
	import { generateA11yId } from '$lib/a11y';
	import { toastStore } from '$lib/stores/toast';
	import type { ActionData, PageData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// Form state - initialized from server data
	let name = $state(data.organization.name ?? '');
	let includeNationalCrisisLines = $state(
		data.organization.settings?.includeNationalCrisisLines ?? true
	);
	let allowCustomResources = $state(data.organization.settings?.allowCustomResources ?? true);
	let loading = $state(false);

	// Track original values for dirty detection
	const originalName = data.organization.name ?? '';
	const originalIncludeCrisisLines = data.organization.settings?.includeNationalCrisisLines ?? true;
	const originalAllowCustomResources = data.organization.settings?.allowCustomResources ?? true;

	// Dirty state detection
	const hasChanges = $derived(
		name !== originalName ||
			includeNationalCrisisLines !== originalIncludeCrisisLines ||
			allowCustomResources !== originalAllowCustomResources
	);

	// Client-side validation
	let clientErrors = $state<Record<string, string>>({});

	const nameError = $derived(form?.fieldErrors?.name ?? clientErrors.name ?? null);

	// Accessibility IDs
	const nameInputId = generateA11yId('org-name');
	const nameErrorId = generateA11yId('org-name-error');
	const slugId = generateA11yId('org-slug');
	const crisisLinesId = generateA11yId('crisis-lines');
	const customResourcesId = generateA11yId('custom-resources');

	// Validation
	function validateName(value: string): string | null {
		if (!value.trim()) return 'Organization name is required';
		if (value.trim().length < 2) return 'Name must be at least 2 characters';
		if (value.trim().length > 100) return 'Name must be 100 characters or less';
		return null;
	}

	function handleNameBlur() {
		const error = validateName(name);
		if (error) {
			clientErrors = { ...clientErrors, name: error };
		} else {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { name: _name, ...rest } = clientErrors;
			clientErrors = rest;
		}
	}

	// Show success toast when form succeeds
	$effect(() => {
		if (form?.success) {
			toastStore.success('Organization settings saved successfully');
		}
	});
</script>

<svelte:head>
	<title>Organization Settings | Well-Being Action Plan</title>
	<meta name="description" content="Manage your organization settings" />
</svelte:head>

<form
	method="POST"
	class="settings-form"
	use:enhance={() => {
		// Client-side validation before submit
		const error = validateName(name);
		if (error) {
			clientErrors = { name: error };
			return () => {};
		}

		loading = true;
		return async ({ update }) => {
			loading = false;
			await update();
		};
	}}
>
	{#if form?.error}
		<div class="form-error-banner" role="alert">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			{form.error}
		</div>
	{/if}

	<!-- Organization Details Section -->
	<section class="settings-section" aria-labelledby="details-heading">
		<h2 id="details-heading">Organization Details</h2>

		<div class="settings-card">
			<!-- Organization Name (editable) -->
			<div class="form-group">
				<label for={nameInputId} class="form-label">
					Organization Name <span class="required">*</span>
				</label>
				<input
					type="text"
					id={nameInputId}
					name="name"
					bind:value={name}
					onblur={handleNameBlur}
					class="form-input"
					class:error={nameError}
					aria-describedby={nameError ? nameErrorId : 'name-help'}
					aria-invalid={nameError ? 'true' : undefined}
					disabled={loading}
					maxlength={100}
				/>
				<p id="name-help" class="form-help">Displayed to providers and in action plans</p>
				{#if nameError}
					<span class="field-error" id={nameErrorId} role="alert">{nameError}</span>
				{/if}
			</div>

			<!-- Organization Slug (read-only) -->
			<div class="form-group">
				<span class="form-label" id={slugId}>Organization URL Slug</span>
				<span class="form-value slug-value">{data.organization.slug}</span>
				<p class="form-help">Used in URLs. Contact support to change.</p>
			</div>
		</div>
	</section>

	<!-- Organization Settings Section -->
	<section class="settings-section" aria-labelledby="settings-heading">
		<h2 id="settings-heading">Settings</h2>

		<div class="settings-card">
			<!-- Include National Crisis Lines -->
			<div class="form-group toggle-group">
				<div class="toggle-row">
					<div class="toggle-info">
						<label for={crisisLinesId} class="form-label">Include National Crisis Lines</label>
						<p class="form-help">
							Automatically include 988 Suicide & Crisis Lifeline and Crisis Text Line on all action
							plans
						</p>
					</div>
					<button
						type="button"
						id={crisisLinesId}
						role="switch"
						aria-checked={includeNationalCrisisLines}
						class="toggle"
						class:active={includeNationalCrisisLines}
						onclick={() => (includeNationalCrisisLines = !includeNationalCrisisLines)}
						disabled={loading}
					>
						<span class="toggle-thumb"></span>
						<span class="visually-hidden">
							{includeNationalCrisisLines ? 'Disable' : 'Enable'} national crisis lines
						</span>
					</button>
					{#if includeNationalCrisisLines}
						<input type="hidden" name="includeNationalCrisisLines" value="on" />
					{/if}
				</div>
			</div>

			<!-- Allow Custom Resources -->
			<div class="form-group toggle-group">
				<div class="toggle-row">
					<div class="toggle-info">
						<label for={customResourcesId} class="form-label">Allow Custom Resources</label>
						<p class="form-help">
							Providers can create custom skills, help methods, and supportive adult types
						</p>
					</div>
					<button
						type="button"
						id={customResourcesId}
						role="switch"
						aria-checked={allowCustomResources}
						class="toggle"
						class:active={allowCustomResources}
						onclick={() => (allowCustomResources = !allowCustomResources)}
						disabled={loading}
					>
						<span class="toggle-thumb"></span>
						<span class="visually-hidden">
							{allowCustomResources ? 'Disable' : 'Enable'} custom resources
						</span>
					</button>
					{#if allowCustomResources}
						<input type="hidden" name="allowCustomResources" value="on" />
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Coming Soon Section -->
	<section class="settings-section" aria-labelledby="coming-soon-heading">
		<h2 id="coming-soon-heading">Coming Soon</h2>

		<div class="settings-card coming-soon-card">
			<div class="coming-soon-item">
				<span class="coming-soon-badge">Coming Soon</span>
				<h3>Action Plan Expiry</h3>
				<p>Set how long action plan access tokens remain valid before requiring renewal.</p>
			</div>
		</div>
	</section>

	<!-- Form Actions -->
	<div class="form-actions">
		<a href="/provider" class="btn btn-outline" class:disabled={loading}>Cancel</a>
		<button type="submit" class="btn btn-primary" disabled={loading || !hasChanges}>
			{#if loading}
				<span class="spinner" aria-hidden="true"></span>
				Saving...
			{:else}
				Save Changes
			{/if}
		</button>
	</div>
</form>

<style>
	/* Form layout */
	.settings-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	/* Error banner */
	.form-error-banner {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: var(--radius-lg);
		color: #991b1b;
	}

	/* Section styles */
	.settings-section {
		margin-bottom: var(--space-2);
	}

	.settings-section h2 {
		font-size: var(--font-size-lg);
		color: var(--color-gray-700);
		margin: 0 0 var(--space-3) 0;
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.settings-card {
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	/* Form groups and inputs */
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

	.form-input {
		padding: var(--space-3) var(--space-4);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		color: var(--color-text);
		background-color: var(--color-white);
		font-family: inherit;
	}

	.form-input:focus {
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

	.form-input:disabled {
		background-color: var(--color-gray-50);
		cursor: not-allowed;
	}

	.form-value {
		font-size: var(--font-size-base);
		color: var(--color-gray-800);
		padding: var(--space-1) 0;
	}

	.slug-value {
		font-family: monospace;
		background-color: var(--color-gray-100);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		display: inline-block;
	}

	.form-help {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.field-error {
		color: #dc2626;
		font-size: var(--font-size-sm);
	}

	/* Toggle switch */
	.toggle-group {
		padding-top: var(--space-2);
	}

	.toggle-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-4);
	}

	.toggle-info {
		flex: 1;
	}

	.toggle-info .form-label {
		margin-bottom: var(--space-1);
	}

	.toggle {
		position: relative;
		width: 48px;
		height: 28px;
		background-color: var(--color-gray-300);
		border: none;
		border-radius: 14px;
		cursor: pointer;
		transition: background-color 0.2s ease;
		flex-shrink: 0;
		padding: 0;
	}

	.toggle:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.toggle.active {
		background-color: var(--color-primary);
	}

	.toggle:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 24px;
		height: 24px;
		background-color: var(--color-white);
		border-radius: 50%;
		transition: transform 0.2s ease;
		box-shadow: var(--shadow-sm);
	}

	.toggle.active .toggle-thumb {
		transform: translateX(20px);
	}

	/* Coming soon section */
	.coming-soon-card {
		background-color: var(--color-gray-50);
		border-style: dashed;
	}

	.coming-soon-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.coming-soon-badge {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		background-color: var(--color-accent);
		color: var(--color-primary);
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		width: fit-content;
	}

	.coming-soon-item h3 {
		margin: 0;
		font-size: var(--font-size-base);
		color: var(--color-gray-700);
	}

	.coming-soon-item p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	/* Form actions */
	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-gray-200);
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius-md);
		font-weight: 500;
		font-size: var(--font-size-base);
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
		border: 2px solid transparent;
	}

	.btn:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #004a3f;
		border-color: #004a3f;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-gray-700);
		border-color: var(--color-gray-300);
	}

	.btn-outline:hover:not(.disabled) {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.btn-outline.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	/* Spinner */
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Visually hidden */
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Touch targets */
	@media (pointer: coarse) {
		.btn,
		.form-input,
		.toggle {
			min-height: 44px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}

		.toggle-thumb {
			transition: none;
		}

		.toggle {
			transition: none;
		}
	}

	/* Responsive */
	@media (max-width: 640px) {
		.form-actions {
			flex-direction: column-reverse;
		}

		.btn {
			width: 100%;
		}

		.toggle-row {
			flex-wrap: wrap;
		}
	}
</style>
