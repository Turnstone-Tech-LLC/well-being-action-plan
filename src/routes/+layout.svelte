<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import TopNav from '$lib/components/layout/TopNav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ClearDataModal from '$lib/components/modals/ClearDataModal.svelte';
	import { registerServiceWorker } from '$lib/notifications';
	import { initAuthSync } from '$lib/auth';
	import './layout.css';

	let { children, data } = $props();

	// Stubbed user state - will be replaced with actual auth/IndexedDB check
	let userState: 'unauthenticated' | 'provider' | 'patient' = $state('unauthenticated');
	let showClearDataModal = $state(false);

	// Check if we're on a route that has its own layout (provider, app)
	// These routes handle their own nav/footer
	let hasOwnLayout = $derived(
		$page.url.pathname.startsWith('/provider') || $page.url.pathname.startsWith('/app')
	);

	// Register service worker on mount and initialize test helpers if in test mode
	onMount(() => {
		if (!browser) return;

		let authUnsubscribe: (() => void) | undefined;

		registerServiceWorker().catch((err) => {
			console.warn('Service worker registration failed:', err);
		});

		// Initialize auth state sync for multi-tab support
		if (data.supabase) {
			authUnsubscribe = initAuthSync(data.supabase);
		}

		// Initialize test helpers for E2E testing
		// Enabled in dev mode OR when URL contains ?__test_mode=true
		// This exposes __testDb, __testStores, and __testHelpers on the window object
		const urlParams = new URLSearchParams(window.location.search);
		const testModeFromUrl = urlParams.get('__test_mode') === 'true';
		const testModeFromStorage = sessionStorage.getItem('__test_mode') === 'true';

		if (import.meta.env.DEV || testModeFromUrl || testModeFromStorage) {
			// Persist test mode in session storage so it survives navigation
			if (testModeFromUrl) {
				sessionStorage.setItem('__test_mode', 'true');
			}

			import('$lib/test-helpers').then(({ initTestHelpers }) => {
				initTestHelpers();
			});
		}

		// Cleanup function
		return () => {
			authUnsubscribe?.();
		};
	});

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

{#if hasOwnLayout}
	<!-- Provider and App routes have their own layout with nav/footer -->
	{@render children()}
{:else}
	<a href="#main-content" class="skip-link">Skip to main content</a>

	<div class="app">
		<TopNav {userState} onClearData={handleClearData} />

		<main id="main-content" tabindex="-1">
			{@render children()}
		</main>

		<Footer />
	</div>

	<ClearDataModal
		open={showClearDataModal}
		onConfirm={confirmClearData}
		onCancel={cancelClearData}
	/>
{/if}

<style>
	.skip-link {
		position: absolute;
		top: -100%;
		left: 50%;
		transform: translateX(-50%);
		background-color: var(--color-primary);
		color: var(--color-white);
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 600;
		z-index: 1000;
		transition: top 0.2s ease;
	}

	.skip-link:focus {
		top: var(--space-4);
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

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

	main:focus {
		outline: none;
	}
</style>
