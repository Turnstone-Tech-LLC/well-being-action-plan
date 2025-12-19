<script lang="ts">
	import { generateA11yId } from '$lib/a11y';
	import type { NotificationFrequency, NotificationTime } from '$lib/db';
	import {
		isNotificationSupported,
		getPermissionStatus,
		requestPermission,
		getFrequencyDescription,
		getTimePreferenceDescription
	} from '$lib/notifications';
	import { patientProfileStore } from '$lib/stores/patientProfile';
	import { toastStore } from '$lib/stores/toast';

	interface Props {
		actionPlanId: string;
		notificationsEnabled: boolean;
		notificationFrequency: NotificationFrequency;
		notificationTime: NotificationTime;
	}

	let { actionPlanId, notificationsEnabled, notificationFrequency, notificationTime }: Props =
		$props();

	let permissionStatus = $state(getPermissionStatus());
	let isRequesting = $state(false);
	let isSaving = $state(false);

	// Local state for edits
	let localEnabled = $state(notificationsEnabled);
	let localFrequency = $state<NotificationFrequency>(notificationFrequency);
	let localTime = $state<NotificationTime>(notificationTime);

	const toggleId = generateA11yId('notifications-toggle');
	const frequencyId = generateA11yId('notification-frequency');
	const timeId = generateA11yId('notification-time');
	const frequencyDescId = generateA11yId('frequency-desc');

	// Check if browser supports notifications
	const notificationsSupported = isNotificationSupported();

	// Permission states
	let hasPermission = $derived(permissionStatus === 'granted');
	let permissionDenied = $derived(permissionStatus === 'denied');

	// Sync local state when props change
	$effect(() => {
		localEnabled = notificationsEnabled;
		localFrequency = notificationFrequency;
		localTime = notificationTime;
	});

	async function handleToggleChange() {
		const newValue = !localEnabled;

		// If trying to enable and permission not granted, request it first
		if (newValue && !hasPermission && !permissionDenied) {
			isRequesting = true;
			try {
				const granted = await requestPermission();
				permissionStatus = getPermissionStatus();

				if (!granted) {
					toastStore.warning(
						'Notifications were not enabled. You can change this in your browser settings.'
					);
					return;
				}
			} catch {
				toastStore.error('Failed to request notification permission');
				return;
			} finally {
				isRequesting = false;
			}
		}

		// If permission denied, can't enable
		if (newValue && permissionDenied) {
			toastStore.warning('Notifications are blocked. Please enable them in your browser settings.');
			return;
		}

		localEnabled = newValue;

		// If disabling, set frequency to none
		if (!newValue) {
			localFrequency = 'none';
		} else if (localFrequency === 'none') {
			// If enabling, set a default frequency
			localFrequency = 'daily';
		}

		await saveChanges();
	}

	async function handleFrequencyChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		localFrequency = select.value as NotificationFrequency;

		// If frequency is none, disable notifications
		if (localFrequency === 'none') {
			localEnabled = false;
		}

		await saveChanges();
	}

	async function handleTimeChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		localTime = select.value as NotificationTime;
		await saveChanges();
	}

	async function saveChanges() {
		isSaving = true;
		try {
			await patientProfileStore.updateNotificationPreferences({
				actionPlanId,
				notificationsEnabled: localEnabled,
				notificationFrequency: localFrequency,
				notificationTime: localTime
			});
			toastStore.success('Notification settings updated');
		} catch {
			// Revert local state on error
			localEnabled = notificationsEnabled;
			localFrequency = notificationFrequency;
			localTime = notificationTime;
			toastStore.error('Failed to update notification settings');
		} finally {
			isSaving = false;
		}
	}
</script>

<section class="settings-section" aria-labelledby="notifications-heading">
	<h2 id="notifications-heading">Notifications</h2>

	{#if !notificationsSupported}
		<div class="notice" role="alert">
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
				<path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			<span>Notifications are not supported in this browser.</span>
		</div>
	{:else}
		<!-- Toggle -->
		<div class="setting-card">
			<div class="toggle-row">
				<div class="setting-info">
					<label for={toggleId} class="setting-label-main">Reminders</label>
					<span class="setting-description">
						{#if localEnabled}
							Get reminded to check in with yourself
						{:else}
							Reminders are currently off
						{/if}
					</span>
				</div>
				<button
					id={toggleId}
					type="button"
					role="switch"
					aria-checked={localEnabled}
					class="toggle"
					class:active={localEnabled}
					onclick={handleToggleChange}
					disabled={isRequesting || isSaving}
				>
					<span class="toggle-thumb"></span>
					<span class="visually-hidden">
						{localEnabled ? 'Disable notifications' : 'Enable notifications'}
					</span>
				</button>
			</div>
		</div>

		<!-- Permission denied notice -->
		{#if permissionDenied}
			<div class="notice notice-warning" role="note">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
					<path
						d="M12 8v4M12 16h.01"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
				<span
					>Notifications are blocked. Enable them in your browser settings to receive reminders.</span
				>
			</div>
		{/if}

		<!-- Frequency and Time selectors (shown when enabled) -->
		{#if localEnabled && !permissionDenied}
			<div class="setting-card">
				<div class="form-group">
					<label for={frequencyId} class="form-label">How often?</label>
					<select
						id={frequencyId}
						class="form-select"
						value={localFrequency}
						onchange={handleFrequencyChange}
						disabled={isSaving}
						aria-describedby={frequencyDescId}
					>
						<option value="daily">{getFrequencyDescription('daily')}</option>
						<option value="every_few_days">{getFrequencyDescription('every_few_days')}</option>
						<option value="weekly">{getFrequencyDescription('weekly')}</option>
						<option value="none">{getFrequencyDescription('none')}</option>
					</select>
					<p id={frequencyDescId} class="form-help">
						Choose how frequently you'd like to be reminded to check in.
					</p>
				</div>
			</div>

			{#if localFrequency !== 'none'}
				<div class="setting-card">
					<div class="form-group">
						<label for={timeId} class="form-label">Preferred time</label>
						<select
							id={timeId}
							class="form-select"
							value={localTime}
							onchange={handleTimeChange}
							disabled={isSaving}
						>
							<option value="morning">{getTimePreferenceDescription('morning')}</option>
							<option value="afternoon">{getTimePreferenceDescription('afternoon')}</option>
							<option value="evening">{getTimePreferenceDescription('evening')}</option>
						</select>
					</div>
				</div>
			{/if}
		{/if}
	{/if}
</section>

<style>
	.settings-section {
		margin-bottom: var(--space-6);
	}

	.settings-section h2 {
		font-size: var(--font-size-lg);
		color: var(--color-gray-700);
		margin-bottom: var(--space-3);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.setting-card {
		padding: var(--space-4);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-2);
	}

	.toggle-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.setting-label-main {
		font-size: var(--font-size-base);
		color: var(--color-gray-800);
		font-weight: 500;
	}

	.setting-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	/* Toggle switch */
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
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.toggle.active .toggle-thumb {
		transform: translateX(20px);
	}

	/* Form elements */
	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.form-select {
		padding: var(--space-3) var(--space-4);
		font-size: var(--font-size-base);
		border: 2px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		background-color: var(--color-white);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right var(--space-3) center;
		padding-right: var(--space-10);
	}

	.form-select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.form-select:disabled {
		background-color: var(--color-gray-100);
		cursor: not-allowed;
	}

	.form-help {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	/* Notice boxes */
	.notice {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		background-color: var(--color-bg-subtle);
		color: var(--color-text-muted);
		margin-bottom: var(--space-3);
	}

	.notice-warning {
		background-color: #fef3c7;
		color: #92400e;
	}

	.notice svg {
		flex-shrink: 0;
		margin-top: 2px;
	}

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

	@media (prefers-reduced-motion: reduce) {
		.toggle,
		.toggle-thumb {
			transition: none;
		}
	}
</style>
