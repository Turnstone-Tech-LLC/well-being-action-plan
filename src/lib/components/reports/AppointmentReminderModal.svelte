<script lang="ts">
	/**
	 * AppointmentReminderModal component for setting up appointment reminders.
	 * Allows users to set their next appointment date and receive notifications
	 * 1-2 days before to generate a provider report.
	 */
	import { onMount } from 'svelte';
	import { createFocusTrap, type FocusTrap } from '$lib/a11y';
	import { saveNextAppointmentDate, getNextAppointmentDate } from '$lib/db/profile';
	import {
		isNotificationSupported,
		requestPermission,
		getPermissionStatus
	} from '$lib/notifications';

	interface Props {
		open: boolean;
		actionPlanId: string;
		onClose: () => void;
	}

	let { open, actionPlanId, onClose }: Props = $props();

	let modalElement: HTMLElement | null = $state(null);
	let focusTrap: FocusTrap | null = null;

	// Form state
	let appointmentDate: string = $state('');
	let existingDate: Date | null = $state(null);

	// Notification state
	let notificationSupported: boolean = $state(false);
	let notificationPermission: NotificationPermission | 'unsupported' = $state('unsupported');
	let requestingPermission: boolean = $state(false);

	// Status
	let saving: boolean = $state(false);
	let error: string | null = $state(null);
	let success: boolean = $state(false);

	// Check notification support on mount
	onMount(() => {
		notificationSupported = isNotificationSupported();
		notificationPermission = getPermissionStatus();
	});

	// Load existing appointment date when modal opens
	async function loadExistingDate() {
		if (!actionPlanId) return;

		try {
			const date = await getNextAppointmentDate(actionPlanId);
			if (date) {
				existingDate = date;
				appointmentDate = formatDateForInput(date);
			} else {
				existingDate = null;
				appointmentDate = '';
			}
		} catch (err) {
			console.error('Failed to load appointment date:', err);
		}
	}

	function formatDateForInput(date: Date): string {
		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function formatDateForDisplay(date: Date): string {
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// Handle notification permission request
	async function handleRequestPermission() {
		requestingPermission = true;
		try {
			const granted = await requestPermission();
			notificationPermission = granted ? 'granted' : 'denied';
		} catch (err) {
			console.error('Failed to request permission:', err);
		} finally {
			requestingPermission = false;
		}
	}

	// Save appointment date
	async function handleSave() {
		if (!appointmentDate) {
			error = 'Please select an appointment date.';
			return;
		}

		saving = true;
		error = null;
		success = false;

		try {
			const date = new Date(appointmentDate + 'T00:00:00');
			await saveNextAppointmentDate(actionPlanId, date);
			existingDate = date;
			success = true;

			// Close modal after brief delay to show success message
			setTimeout(() => {
				onClose();
			}, 1500);
		} catch (err) {
			console.error('Failed to save appointment date:', err);
			error = 'Failed to save appointment date. Please try again.';
		} finally {
			saving = false;
		}
	}

	// Clear appointment date
	async function handleClear() {
		saving = true;
		error = null;

		try {
			await saveNextAppointmentDate(actionPlanId, null);
			appointmentDate = '';
			existingDate = null;
			success = true;

			setTimeout(() => {
				success = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to clear appointment date:', err);
			error = 'Failed to clear appointment date. Please try again.';
		} finally {
			saving = false;
		}
	}

	// Track modal open state
	let hasInitializedForSession = false;

	$effect(() => {
		if (open && !hasInitializedForSession) {
			hasInitializedForSession = true;
			loadExistingDate();
			error = null;
			success = false;
		} else if (!open && hasInitializedForSession) {
			hasInitializedForSession = false;
		}
	});

	// Focus trap management
	$effect(() => {
		if (open && modalElement) {
			focusTrap = createFocusTrap(modalElement, {
				onEscape: onClose
			});
			focusTrap.activate();
		}

		return () => {
			if (focusTrap) {
				focusTrap.deactivate();
				focusTrap = null;
			}
		};
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleBackdropKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	// Get minimum date (today)
	let todayFormatted = formatDateForInput(new Date());

	// Derived: Check if selected date is in the past
	let isDateInPast = $derived(() => {
		if (!appointmentDate) return false;
		const selected = new Date(appointmentDate + 'T00:00:00');
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- comparison only, not stored
		const todayDate = new Date();
		todayDate.setHours(0, 0, 0, 0);
		return selected < todayDate;
	});
</script>

{#if open}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeyDown}
		role="presentation"
	>
		<div
			bind:this={modalElement}
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			aria-describedby="modal-description"
		>
			<div class="modal-header">
				<svg
					class="bell-icon"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M13.73 21a2 2 0 0 1-3.46 0"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<h2 id="modal-title">Appointment Reminders</h2>
			</div>

			<div id="modal-description" class="modal-body">
				<p class="intro-text">
					Set your next appointment date to receive a reminder to generate your provider report
					before your visit.
				</p>

				<!-- Existing appointment info -->
				{#if existingDate && !success}
					<div class="existing-date-info">
						<p class="existing-label">Current appointment:</p>
						<p class="existing-date">{formatDateForDisplay(existingDate)}</p>
					</div>
				{/if}

				<!-- Date Input -->
				<div class="date-field">
					<label for="appointmentDate">Next appointment date</label>
					<input
						type="date"
						id="appointmentDate"
						bind:value={appointmentDate}
						min={todayFormatted}
						disabled={saving}
					/>
					{#if isDateInPast()}
						<p class="field-error">Please select a future date.</p>
					{/if}
				</div>

				<!-- Notification Permission -->
				{#if notificationSupported}
					<div class="notification-section">
						{#if notificationPermission === 'granted'}
							<div class="notification-status notification-enabled">
								<svg
									class="status-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									aria-hidden="true"
								>
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
									<polyline points="22 4 12 14.01 9 11.01" />
								</svg>
								<span
									>Notifications are enabled. You'll receive a reminder 1-2 days before your
									appointment.</span
								>
							</div>
						{:else if notificationPermission === 'denied'}
							<div class="notification-status notification-blocked">
								<svg
									class="status-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									aria-hidden="true"
								>
									<circle cx="12" cy="12" r="10" />
									<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
								</svg>
								<span>
									Notifications are blocked. Enable them in your browser settings to receive
									reminders.
								</span>
							</div>
						{:else}
							<div class="notification-prompt">
								<p>Enable notifications to receive a reminder before your appointment.</p>
								<button
									type="button"
									class="btn btn-outline btn-sm"
									onclick={handleRequestPermission}
									disabled={requestingPermission}
								>
									{#if requestingPermission}
										<span class="loading-spinner-sm" aria-hidden="true"></span>
										Requesting...
									{:else}
										Enable Notifications
									{/if}
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<div class="notification-status notification-unsupported">
						<svg
							class="status-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
						<span>
							Notifications are not supported in this browser. You can still set your appointment
							date for reference.
						</span>
					</div>
				{/if}

				<!-- Success Message -->
				{#if success}
					<div class="success-message" role="status" aria-live="polite">
						<svg
							class="success-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
							<polyline points="22 4 12 14.01 9 11.01" />
						</svg>
						{existingDate ? 'Appointment reminder saved!' : 'Appointment reminder cleared!'}
					</div>
				{/if}

				<!-- Error Message -->
				{#if error}
					<div class="error-message" role="alert">
						<svg
							class="error-icon"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
							<line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" />
							<line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" />
						</svg>
						{error}
					</div>
				{/if}
			</div>

			<div class="modal-actions">
				{#if existingDate}
					<button
						type="button"
						class="btn btn-danger-outline"
						onclick={handleClear}
						disabled={saving}
					>
						Clear Reminder
					</button>
				{/if}
				<div class="action-right">
					<button type="button" class="btn btn-outline" onclick={onClose} disabled={saving}>
						Cancel
					</button>
					<button
						type="button"
						class="btn btn-primary"
						onclick={handleSave}
						disabled={saving || !appointmentDate || isDateInPast()}
					>
						{#if saving}
							<span class="loading-spinner" aria-hidden="true"></span>
							Saving...
						{:else}
							Save Reminder
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		z-index: 100;
	}

	.modal {
		background-color: var(--color-white);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		max-width: 28rem;
		width: 100%;
		box-shadow: var(--shadow-lg);
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal:focus {
		outline: none;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.bell-icon {
		color: var(--color-primary);
		flex-shrink: 0;
		margin-top: 2px;
	}

	.modal h2 {
		font-size: var(--font-size-xl);
		margin: 0;
	}

	.modal-body {
		margin-bottom: var(--space-6);
	}

	.intro-text {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4);
		line-height: 1.5;
	}

	/* Existing date info */
	.existing-date-info {
		background-color: color-mix(in srgb, var(--color-primary) 8%, white);
		border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.existing-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-1);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.existing-date {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-primary);
		margin: 0;
	}

	/* Date field */
	.date-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.date-field label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text);
	}

	.date-field input[type='date'] {
		padding: var(--space-3);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		width: 100%;
	}

	.date-field input[type='date']:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.15);
	}

	.date-field input[type='date']:disabled {
		background-color: var(--color-gray-100);
		cursor: not-allowed;
	}

	.field-error {
		font-size: var(--font-size-sm);
		color: #dc2626;
		margin: 0;
	}

	/* Notification section */
	.notification-section {
		margin-bottom: var(--space-4);
	}

	.notification-status {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		padding: var(--space-3);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		line-height: 1.4;
	}

	.notification-enabled {
		background-color: #ecfdf5;
		border: 1px solid #a7f3d0;
		color: #047857;
	}

	.notification-blocked {
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
	}

	.notification-unsupported {
		background-color: var(--color-gray-100);
		border: 1px solid var(--color-gray-200);
		color: var(--color-text-muted);
	}

	.status-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		margin-top: 1px;
	}

	.notification-prompt {
		background-color: var(--color-gray-50);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		padding: var(--space-4);
	}

	.notification-prompt p {
		font-size: var(--font-size-sm);
		color: var(--color-text);
		margin: 0 0 var(--space-3);
	}

	/* Success message */
	.success-message {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		background-color: #ecfdf5;
		border: 1px solid #a7f3d0;
		border-radius: var(--radius-md);
		color: #047857;
		font-size: var(--font-size-sm);
		margin-top: var(--space-4);
	}

	.success-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	/* Error message */
	.error-message {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: var(--radius-md);
		color: #dc2626;
		font-size: var(--font-size-sm);
		margin-top: var(--space-4);
	}

	.error-icon {
		flex-shrink: 0;
	}

	/* Modal actions */
	.modal-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
	}

	.action-right {
		display: flex;
		gap: var(--space-3);
		margin-left: auto;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border-radius: var(--radius-md);
		cursor: pointer;
		min-height: 44px;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-sm {
		padding: var(--space-2) var(--space-3);
		min-height: 36px;
	}

	.btn-outline {
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-300);
		color: var(--color-text);
	}

	.btn-outline:hover:not(:disabled) {
		background-color: var(--color-gray-50);
	}

	.btn-outline:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-danger-outline {
		background-color: var(--color-white);
		border: 1px solid #fecaca;
		color: #dc2626;
	}

	.btn-danger-outline:hover:not(:disabled) {
		background-color: #fef2f2;
	}

	.btn-danger-outline:focus-visible {
		outline: 2px solid #dc2626;
		outline-offset: 2px;
	}

	.btn-primary {
		background-color: var(--color-primary);
		border: 1px solid var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #004a3f;
	}

	.btn-primary:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	/* Loading spinners */
	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: var(--color-white);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.loading-spinner-sm {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(0, 89, 76, 0.3);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner,
		.loading-spinner-sm {
			animation: none;
		}

		.btn {
			transition: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.modal {
			border: 2px solid currentColor;
		}

		.notification-status {
			border: 2px solid currentColor;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 400px) {
		.modal-actions {
			flex-direction: column-reverse;
			gap: var(--space-2);
		}

		.action-right {
			flex-direction: column-reverse;
			width: 100%;
			margin-left: 0;
		}

		.btn {
			width: 100%;
		}
	}
</style>
