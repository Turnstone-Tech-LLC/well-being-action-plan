<script lang="ts">
	import { patientProfile } from '$lib/stores/patientProfile';
	import {
		ProfileSection,
		NotificationSettings,
		DataManagement,
		AboutSection
	} from '$lib/components/settings';

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

	{#if profile}
		<ProfileSection displayName={profile.displayName} actionPlanId={profile.actionPlanId} />

		<NotificationSettings
			actionPlanId={profile.actionPlanId}
			notificationsEnabled={profile.notificationsEnabled}
			notificationFrequency={profile.notificationFrequency}
			notificationTime={profile.notificationTime}
		/>

		<DataManagement />

		<AboutSection />
	{:else}
		<div class="loading-state" role="status" aria-live="polite">
			<p>Loading settings...</p>
		</div>
	{/if}
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

	.loading-state {
		text-align: center;
		padding: var(--space-12);
		color: var(--color-text-muted);
	}
</style>
