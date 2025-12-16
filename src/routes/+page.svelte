<script lang="ts">
	import Hero from '$lib/components/landing/Hero.svelte';

	// TODO: Add routing logic once IndexedDB/auth services exist
	// - Patient with local data → redirect to patient dashboard
	// - Authenticated provider → redirect to provider dashboard
	// - Otherwise → show hero (current behavior)
</script>

<svelte:head>
	<title>Well-Being Action Plan</title>
	<meta
		name="description"
		content="Your private well-being action plan - stays on your device, no account needed"
	/>
</svelte:head>

<Hero />
