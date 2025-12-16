<script lang="ts">
	import TopNav from '$lib/components/layout/TopNav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import './layout.css';

	let { children } = $props();
</script>

<div class="app">
	<TopNav />

	<main>
		{@render children()}
	</main>

	<Footer />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
</style>
