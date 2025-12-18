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

	interface Props {
		onContinue: (settings: {
			notificationsEnabled: boolean;
			notificationFrequency: NotificationFrequency;
			notificationTime: NotificationTime;
		}) => void;
		onBack?: () => void;
	}

	let { onContinue, onBack }: Props = $props();

	let frequency = $state<NotificationFrequency>('daily');
	let timePreference = $state<NotificationTime>('morning');
	let permissionStatus = $state(getPermissionStatus());
	let isRequesting = $state(false);
	let permissionDeniedMessage = $state('');

	const frequencyId = generateA11yId('frequency');
	const timeId = generateA11yId('time');
	const frequencyDescId = generateA11yId('frequency-desc');

	// Check if browser supports notifications
	const notificationsSupported = isNotificationSupported();

	// Track if user wants no reminders
	let wantsNoReminders = $derived(frequency === 'none');

	// Already has permission granted
	let hasPermission = $derived(permissionStatus === 'granted');

	// Permission was denied
	let permissionDenied = $derived(permissionStatus === 'denied');

	async function handleEnableNotifications() {
		if (!notificationsSupported) {
			return;
		}

		isRequesting = true;
		permissionDeniedMessage = '';

		try {
			const granted = await requestPermission();
			permissionStatus = getPermissionStatus();

			if (granted) {
				// Permission granted, proceed to finish
				onContinue({
					notificationsEnabled: true,
					notificationFrequency: frequency,
					notificationTime: timePreference
				});
			} else {
				// Permission denied
				permissionDeniedMessage =
					'Notifications were not enabled. You can change this later in your browser settings.';
			}
		} catch {
			permissionDeniedMessage = 'Something went wrong. Please try again.';
		} finally {
			isRequesting = false;
		}
	}

	function handleSkip() {
		onContinue({
			notificationsEnabled: false,
			notificationFrequency: 'none',
			notificationTime: 'morning'
		});
	}

	function handleFinishSetup() {
		// If permission already granted, enable notifications
		// Otherwise, just save preferences without enabling
		onContinue({
			notificationsEnabled: hasPermission && !wantsNoReminders,
			notificationFrequency: frequency,
			notificationTime: timePreference
		});
	}
</script>

<div class="notification-step">
	<div class="header">
		<div class="icon" aria-hidden="true">
			<svg
				width="64"
				height="64"
				viewBox="0 0 64 64"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M32 8c-8.8 0-16 7.2-16 16v12l-4 4v4h40v-4l-4-4V24c0-8.8-7.2-16-16-16z"
					stroke="currentColor"
					stroke-width="2"
					fill="none"
				/>
				<path
					d="M28 48c0 2.2 1.8 4 4 4s4-1.8 4-4"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
				<circle cx="32" cy="16" r="2" fill="currentColor" />
			</svg>
		</div>
		<h1>Stay on track with reminders</h1>
		<p class="description">We can send you gentle reminders to check in with yourself.</p>
	</div>

	{#if !notificationsSupported}
		<div class="unsupported-notice" role="alert">
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
			<span>
				Notifications are not supported in this browser. You can still use the app, but reminders
				won't be available.
			</span>
		</div>
	{:else}
		<div class="preferences-form">
			<div class="form-group">
				<label for={frequencyId} class="form-label">How often would you like reminders?</label>
				<select
					id={frequencyId}
					class="form-select"
					bind:value={frequency}
					aria-describedby={frequencyDescId}
				>
					<option value="daily">{getFrequencyDescription('daily')}</option>
					<option value="every_few_days">{getFrequencyDescription('every_few_days')}</option>
					<option value="weekly">{getFrequencyDescription('weekly')}</option>
					<option value="none">{getFrequencyDescription('none')}</option>
				</select>
				<p id={frequencyDescId} class="form-help">
					{#if frequency === 'none'}
						You won't receive any reminders.
					{:else}
						You'll get a gentle reminder to check in with yourself.
					{/if}
				</p>
			</div>

			{#if !wantsNoReminders}
				<div class="form-group">
					<label for={timeId} class="form-label">What time works best for you?</label>
					<select id={timeId} class="form-select" bind:value={timePreference}>
						<option value="morning">{getTimePreferenceDescription('morning')}</option>
						<option value="afternoon">{getTimePreferenceDescription('afternoon')}</option>
						<option value="evening">{getTimePreferenceDescription('evening')}</option>
					</select>
				</div>
			{/if}

			{#if permissionDeniedMessage}
				<div class="permission-denied" role="alert">
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
					<span>{permissionDeniedMessage}</span>
				</div>
			{/if}

			{#if permissionDenied && !wantsNoReminders}
				<div class="permission-info" role="note">
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
					<span>
						Notifications are currently blocked. To enable them, update your browser settings and
						refresh the page.
					</span>
				</div>
			{/if}
		</div>
	{/if}

	<div class="privacy-note" role="note">
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2" />
			<path
				d="M7 11V7a5 5 0 0 1 10 0v4"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>
		<span>Your notification preferences stay on your device.</span>
	</div>

	<div class="button-group">
		{#if onBack}
			<button type="button" class="btn btn-outline back-btn" onclick={onBack}>Back</button>
		{/if}

		{#if wantsNoReminders || !notificationsSupported || permissionDenied || hasPermission}
			<button type="button" class="btn btn-primary finish-btn" onclick={handleFinishSetup}>
				Finish Setup
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
						d="M5 12h14M12 5l7 7-7 7"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		{:else}
			<button
				type="button"
				class="btn btn-primary enable-btn"
				onclick={handleEnableNotifications}
				disabled={isRequesting}
			>
				{#if isRequesting}
					<span class="spinner" aria-hidden="true"></span>
					Enabling...
				{:else}
					Enable Notifications
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
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
				{/if}
			</button>
		{/if}
	</div>

	{#if !wantsNoReminders && notificationsSupported && !permissionDenied && !hasPermission}
		<button type="button" class="skip-link" onclick={handleSkip}>Skip for now</button>
	{/if}
</div>

<style>
	.notification-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-8) var(--space-4);
		max-width: 32rem;
		margin: 0 auto;
		text-align: center;
	}

	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.icon {
		color: var(--color-primary);
	}

	h1 {
		font-size: var(--font-size-2xl);
		color: var(--color-gray-900);
		line-height: 1.3;
		margin: 0;
	}

	.description {
		color: var(--color-text-muted);
		font-size: var(--font-size-md);
		margin: 0;
	}

	.preferences-form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		text-align: left;
	}

	.form-label {
		font-size: var(--font-size-md);
		font-weight: 500;
		color: var(--color-gray-800);
	}

	.form-select {
		padding: var(--space-3) var(--space-4);
		font-size: var(--font-size-md);
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

	.form-help {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.unsupported-notice,
	.permission-denied,
	.permission-info {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		text-align: left;
	}

	.unsupported-notice,
	.permission-info {
		background-color: var(--color-bg-subtle);
		color: var(--color-text-muted);
	}

	.permission-denied {
		background-color: #fef2f2;
		color: #b91c1c;
	}

	.unsupported-notice svg,
	.permission-denied svg,
	.permission-info svg {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.privacy-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-bg-subtle);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	.privacy-note svg {
		flex-shrink: 0;
	}

	.button-group {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
		width: 100%;
	}

	.back-btn {
		min-width: 100px;
		padding: var(--space-4) var(--space-6);
	}

	.enable-btn,
	.finish-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 200px;
		justify-content: center;
		padding: var(--space-4) var(--space-6);
		font-size: var(--font-size-md);
	}

	.enable-btn:disabled,
	.finish-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
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

	.skip-link {
		background: none;
		border: none;
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		text-decoration: underline;
		cursor: pointer;
		padding: var(--space-2);
		transition: color 0.15s ease;
	}

	.skip-link:hover,
	.skip-link:focus {
		color: var(--color-primary);
	}

	.skip-link:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	@media (max-width: 480px) {
		.notification-step {
			padding: var(--space-6) var(--space-3);
		}

		h1 {
			font-size: var(--font-size-xl);
		}

		.button-group {
			flex-direction: column-reverse;
		}

		.back-btn,
		.enable-btn,
		.finish-btn {
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
			border-top-color: white;
			border-left-color: white;
		}
	}
</style>
