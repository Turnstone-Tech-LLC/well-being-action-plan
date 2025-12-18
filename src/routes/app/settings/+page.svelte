<script lang="ts">
	import { displayName, patientProfile } from '$lib/stores/patientProfile';

	let name = $derived($displayName);
	let profile = $derived($patientProfile);
</script>

<svelte:head>
	<title>Settings | Well-Being Action Plan</title>
	<meta name="description" content="Manage your Well-Being Action Plan settings" />
</svelte:head>

<div class="settings-page">
	<header class="page-header">
		<h1>Settings</h1>
		<p class="subtitle">Manage your preferences</p>
	</header>

	<section class="settings-section" aria-labelledby="profile-heading">
		<h2 id="profile-heading">Profile</h2>
		<div class="setting-card">
			<div class="setting-info">
				<span class="setting-label">Display Name</span>
				<span class="setting-value">{name || 'Not set'}</span>
			</div>
		</div>
	</section>

	<section class="settings-section" aria-labelledby="notifications-heading">
		<h2 id="notifications-heading">Notifications</h2>
		<div class="setting-card">
			<div class="setting-info">
				<span class="setting-label">Reminders</span>
				<span class="setting-value">
					{#if profile?.notificationsEnabled}
						{profile.notificationFrequency === 'daily'
							? 'Daily'
							: profile.notificationFrequency === 'every_few_days'
								? 'Every few days'
								: profile.notificationFrequency === 'weekly'
									? 'Weekly'
									: 'Off'}
					{:else}
						Off
					{/if}
				</span>
			</div>
		</div>
		{#if profile?.notificationsEnabled && profile.notificationFrequency !== 'none'}
			<div class="setting-card">
				<div class="setting-info">
					<span class="setting-label">Preferred Time</span>
					<span class="setting-value">
						{profile.notificationTime === 'morning'
							? 'Morning'
							: profile.notificationTime === 'afternoon'
								? 'Afternoon'
								: 'Evening'}
					</span>
				</div>
			</div>
		{/if}
	</section>

	<section class="coming-soon" aria-label="More options coming soon">
		<p class="muted">More settings options coming soon</p>
	</section>
</div>

<style>
	.settings-page {
		padding: var(--space-6) var(--space-4);
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.page-header {
		text-align: center;
		margin-bottom: var(--space-8);
	}

	.page-header h1 {
		font-size: var(--font-size-2xl);
		color: var(--color-gray-900);
		margin-bottom: var(--space-2);
	}

	.subtitle {
		font-size: var(--font-size-base);
		color: var(--color-text-muted);
	}

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
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-4);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-2);
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.setting-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.setting-value {
		font-size: var(--font-size-base);
		color: var(--color-gray-800);
		font-weight: 500;
	}

	.coming-soon {
		text-align: center;
		padding: var(--space-6);
	}

	.muted {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}
</style>
