<script lang="ts">
	import { page } from '$app/stores';

	// Navigation items for the patient app
	const navItems = [
		{ href: '/app', label: 'Home', icon: 'home' },
		{ href: '/app/reports', label: 'Reports', icon: 'reports' },
		{ href: '/app/settings', label: 'Settings', icon: 'settings' }
	];

	// Check if a nav item is active
	function isActive(href: string): boolean {
		if (href === '/app') {
			return $page.url.pathname === '/app';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<nav class="patient-nav" aria-label="Main navigation">
	<ul role="list">
		{#each navItems as item (item.href)}
			<li>
				<a
					href={item.href}
					class:active={isActive(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
				>
					<span class="nav-icon" aria-hidden="true">
						{#if item.icon === 'home'}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
								<polyline points="9 22 9 12 15 12 15 22" />
							</svg>
						{:else if item.icon === 'reports'}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						{:else if item.icon === 'settings'}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="3" />
								<path
									d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
								/>
							</svg>
						{/if}
					</span>
					<span class="nav-label">{item.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.patient-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: var(--color-white);
		border-top: 1px solid var(--color-gray-200);
		padding: var(--space-2) var(--space-4);
		padding-bottom: max(var(--space-2), env(safe-area-inset-bottom));
		z-index: 100;
	}

	ul {
		display: flex;
		justify-content: space-around;
		align-items: center;
		list-style: none;
		margin: 0;
		padding: 0;
		max-width: 400px;
		margin: 0 auto;
	}

	li {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2);
		text-decoration: none;
		color: var(--color-gray-500);
		transition: color 0.15s ease;
		min-width: 64px;
		min-height: 44px;
		border-radius: var(--radius-md);
	}

	a:hover {
		color: var(--color-primary);
		text-decoration: none;
	}

	a.active {
		color: var(--color-primary);
	}

	.nav-icon {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-icon svg {
		width: 100%;
		height: 100%;
	}

	.nav-label {
		font-size: var(--font-size-xs);
		font-weight: 500;
	}

	/* Hide on larger screens where we might use a different nav */
	@media (min-width: 768px) {
		.patient-nav {
			position: static;
			border-top: none;
			border-bottom: 1px solid var(--color-gray-200);
			padding: var(--space-3) var(--space-4);
		}

		ul {
			max-width: var(--max-width);
			justify-content: flex-start;
			gap: var(--space-6);
		}

		a {
			flex-direction: row;
			gap: var(--space-2);
			padding: var(--space-2) var(--space-3);
		}

		.nav-label {
			font-size: var(--font-size-sm);
		}

		li {
			flex: none;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		a.active {
			border: 2px solid currentColor;
		}
	}
</style>
