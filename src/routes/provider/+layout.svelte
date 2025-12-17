<script lang="ts">
	import { navigating } from '$app/stores';
	import ProviderNav from '$lib/components/provider/ProviderNav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Toast from '$lib/components/layout/Toast.svelte';

	let { data, children } = $props();

	// Show loading bar during navigation
	let showLoadingBar = $state(false);
	let loadingTimeout: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if ($navigating) {
			// Only show loading after 100ms to avoid flash for quick navigations
			loadingTimeout = setTimeout(() => {
				showLoadingBar = true;
			}, 100);
		} else {
			if (loadingTimeout) {
				clearTimeout(loadingTimeout);
				loadingTimeout = null;
			}
			showLoadingBar = false;
		}

		return () => {
			if (loadingTimeout) {
				clearTimeout(loadingTimeout);
			}
		};
	});
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>

{#if showLoadingBar}
	<div class="loading-bar" role="progressbar" aria-label="Loading page" aria-busy="true"></div>
{/if}

<div class="provider-app">
	<ProviderNav providerName={data.provider.name} organizationName={data.organization.name} />

	<main id="main-content" tabindex="-1">
		{@render children()}
	</main>

	<Footer />
</div>

<Toast />

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

	.provider-app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		background-color: var(--color-bg-subtle);
	}

	main:focus {
		outline: none;
	}

	/* Loading bar */
	.loading-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(
			90deg,
			var(--color-primary) 0%,
			var(--color-accent) 50%,
			var(--color-primary) 100%
		);
		background-size: 200% 100%;
		animation: loading-shimmer 1.5s infinite linear;
		z-index: 9999;
	}

	@keyframes loading-shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loading-bar {
			animation: none;
			background: var(--color-primary);
		}
	}
</style>
