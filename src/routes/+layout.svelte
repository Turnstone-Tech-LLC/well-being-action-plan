<script lang="ts">
	import TopNav from '$lib/components/layout/TopNav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ClearDataModal from '$lib/components/modals/ClearDataModal.svelte';
	import './layout.css';

	let { children } = $props();

	// Stubbed user state - will be replaced with actual auth/IndexedDB check
	let userState: 'unauthenticated' | 'provider' | 'patient' = $state('unauthenticated');
	let showClearDataModal = $state(false);

	function handleClearData() {
		showClearDataModal = true;
	}

	function confirmClearData() {
		// TODO: Clear IndexedDB data
		console.log('Clearing local data...');
		showClearDataModal = false;
		userState = 'unauthenticated';
	}

	function cancelClearData() {
		showClearDataModal = false;
	}
</script>

<div class="app">
	<TopNav {userState} onClearData={handleClearData} />

	<main>
		{@render children()}
	</main>

	<Footer />
</div>

<ClearDataModal open={showClearDataModal} onConfirm={confirmClearData} onCancel={cancelClearData} />

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
