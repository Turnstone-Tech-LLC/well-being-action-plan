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
	let name = $state(data.provider.name ?? '');
	let defaultView = $state((data.provider.settings?.defaultView as string) ?? 'action_plans');
	let emailNotifications = $state((data.provider.settings?.emailNotifications as boolean) ?? false);
	let loading = $state(false);

	// Track original values for dirty detection
	const originalName = data.provider.name ?? '';
	const originalDefaultView = (data.provider.settings?.defaultView as string) ?? 'action_plans';
	const originalEmailNotifications =
		(data.provider.settings?.emailNotifications as boolean) ?? false;

	// Dirty state detection
	const hasChanges = $derived(
		name !== originalName ||
			defaultView !== originalDefaultView ||
			emailNotifications !== originalEmailNotifications
	);

	// Client-side validation
	let clientErrors = $state<Record<string, string>>({});

	const nameError = $derived(form?.fieldErrors?.name ?? clientErrors.name ?? null);

	// Accessibility IDs
	const nameInputId = generateA11yId('name');
	const nameErrorId = generateA11yId('name-error');
	const defaultViewId = generateA11yId('default-view');
	const emailNotificationsId = generateA11yId('email-notifications');

	// Validation
	function validateName(value: string): string | null {
		if (!value.trim()) return 'Display name is required';
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
			toastStore.success('Settings saved successfully');
		}
	});
</script>

<svelte:head>
	<title>Settings | Well-Being Action Plan</title>
	<meta name="description" content="Manage your provider profile and preferences" />
</svelte:head>

<section class="settings-page">
	<header class="page-header">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<ol>
				<li><a href="/provider">Dashboard</a></li>
				<li aria-current="page">Settings</li>
			</ol>
		</nav>
		<h1>Settings</h1>
	</header>

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

		<!-- Profile Section -->
		<section class="settings-section" aria-labelledby="profile-heading">
			<h2 id="profile-heading">Profile</h2>

			<div class="settings-card">
				<!-- Display Name (editable) -->
				<div class="form-group">
					<label for={nameInputId} class="form-label">
						Display Name <span class="required">*</span>
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
					<p id="name-help" class="form-help">How your name appears when creating action plans</p>
					{#if nameError}
						<span class="field-error" id={nameErrorId} role="alert">{nameError}</span>
					{/if}
				</div>

				<!-- Email (read-only) -->
				<div class="form-group">
					<span class="form-label">Email</span>
					<span class="form-value">{data.provider.email}</span>
					<p class="form-help">Email is used for sign-in via magic link</p>
				</div>

				<!-- Organization (read-only) -->
				<div class="form-group">
					<span class="form-label">Organization</span>
					<span class="form-value">{data.organization.name}</span>
				</div>

				<!-- Role (read-only) -->
				<div class="form-group">
					<span class="form-label">Role</span>
					<div class="role-row">
						<span class="form-value role-badge">
							{data.provider.role === 'admin' ? 'Administrator' : 'Provider'}
						</span>
						{#if data.provider.role === 'admin'}
							<a href="/provider/organization" class="org-settings-link"> Organization Settings </a>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<!-- Preferences Section -->
		<section class="settings-section" aria-labelledby="preferences-heading">
			<h2 id="preferences-heading">Preferences</h2>

			<div class="settings-card">
				<!-- Default View -->
				<div class="form-group">
					<label for={defaultViewId} class="form-label">Default View</label>
					<select
						id={defaultViewId}
						name="defaultView"
						bind:value={defaultView}
						class="form-select"
						disabled={loading}
					>
						<option value="action_plans">Action Plans</option>
						<option value="resources">Resources</option>
					</select>
					<p class="form-help">Which page to show when you first log in</p>
				</div>

				<!-- Email Notifications (admins only) -->
				{#if data.provider.role === 'admin'}
					<div class="form-group toggle-group">
						<div class="toggle-row">
							<div class="toggle-info">
								<label for={emailNotificationsId} class="form-label"> Email Notifications </label>
								<p class="form-help">Receive email when a new provider joins your organization</p>
							</div>
							<button
								type="button"
								id={emailNotificationsId}
								role="switch"
								aria-checked={emailNotifications}
								class="toggle"
								class:active={emailNotifications}
								onclick={() => (emailNotifications = !emailNotifications)}
								disabled={loading}
							>
								<span class="toggle-thumb"></span>
								<span class="visually-hidden">
									{emailNotifications ? 'Disable' : 'Enable'} email notifications
								</span>
							</button>
							<!-- Hidden input for form submission -->
							{#if emailNotifications}
								<input type="hidden" name="emailNotifications" value="on" />
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</section>

		<!-- Form Actions -->
		<div class="form-actions">
			<a href="/provider" class="btn btn-outline" class:disabled={loading}> Cancel </a>
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
</section>

<style>
	/* Page layout */
	.settings-page {
		flex: 1;
		padding: var(--space-8) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
		width: 100%;
	}

	.page-header {
		margin-bottom: var(--space-8);
	}

	.page-header h1 {
		font-size: var(--font-size-3xl);
		color: var(--color-gray-900);
		margin: 0;
	}

	/* Breadcrumb */
	.breadcrumb ol {
		display: flex;
		gap: var(--space-2);
		list-style: none;
		padding: 0;
		margin: 0 0 var(--space-4) 0;
		font-size: var(--font-size-sm);
	}

	.breadcrumb li::after {
		content: '>';
		margin-left: var(--space-2);
		color: var(--color-gray-400);
	}

	.breadcrumb li:last-child::after {
		content: '';
	}

	.breadcrumb a {
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.breadcrumb a:hover {
		color: var(--color-primary);
		text-decoration: underline;
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
		margin-bottom: var(--space-6);
	}

	/* Section styles */
	.settings-section {
		margin-bottom: var(--space-8);
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

	.form-input,
	.form-select {
		padding: var(--space-3) var(--space-4);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		color: var(--color-text);
		background-color: var(--color-white);
		font-family: inherit;
	}

	.form-input:focus,
	.form-select:focus {
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

	.form-input:disabled,
	.form-select:disabled {
		background-color: var(--color-gray-50);
		cursor: not-allowed;
	}

	.form-value {
		font-size: var(--font-size-base);
		color: var(--color-gray-800);
		padding: var(--space-1) 0;
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

	/* Role display */
	.role-row {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.role-badge {
		display: inline-block;
		padding: var(--space-1) var(--space-3);
		background-color: var(--color-gray-100);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 500;
	}

	.org-settings-link {
		color: var(--color-primary);
		font-size: var(--font-size-sm);
		text-decoration: none;
	}

	.org-settings-link:hover {
		text-decoration: underline;
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
		.form-select,
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
		.settings-page {
			padding: var(--space-4);
		}

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
