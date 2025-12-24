<script lang="ts">
	import Hero from '$lib/components/landing/Hero.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { hasLocalPlan } from '$lib/db';
	import { setPlanCookie } from '$lib/guards/cookies';

	// Client-side fallback for edge cases where:
	// - Cookie expired but IndexedDB still has data
	// - Cookie was cleared but IndexedDB wasn't
	onMount(async () => {
		if (!browser) return;

		// If cookie exists, server should have redirected
		// But check IndexedDB for self-healing if cookie was missing
		const hasData = await hasLocalPlan();
		if (hasData) {
			// Self-heal: set cookie and redirect
			setPlanCookie();
			await goto('/app');
		}
	});
</script>

<svelte:head>
	<title>Well-Being Action Plan</title>
	<meta
		name="description"
		content="Your private well-being action plan - stays on your device, no account needed"
	/>
</svelte:head>

<Hero />
