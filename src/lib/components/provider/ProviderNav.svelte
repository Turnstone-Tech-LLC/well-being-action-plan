<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	interface Props {
		providerName: string | null;
		organizationName: string;
	}

	let { providerName, organizationName }: Props = $props();

	let isLoggingOut = $state(false);
</script>

<header>
	<nav aria-label="Provider navigation">
		<a href="/provider" class="logo" aria-label="Provider Dashboard Home">
			<img src="/logo-small.png" alt="" class="logo-img" />
			<span class="logo-text">Well-Being Action Plan</span>
		</a>

		<div class="nav-content">
			<ul class="nav-links" role="list">
				<li>
					<a
						href="/provider"
						class:active={$page.url.pathname === '/provider'}
						aria-current={$page.url.pathname === '/provider' ? 'page' : undefined}
					>
						Dashboard
					</a>
				</li>
				<li>
					<a
						href="/provider/resources"
						class:active={$page.url.pathname.startsWith('/provider/resources')}
						aria-current={$page.url.pathname.startsWith('/provider/resources') ? 'page' : undefined}
					>
						Resources
					</a>
				</li>
			</ul>

			<div class="user-menu">
				<div class="user-info">
					<span class="user-name">{providerName || 'Provider'}</span>
					<span class="org-name">{organizationName}</span>
				</div>
				<form
					method="POST"
					action="/auth/logout"
					use:enhance={() => {
						isLoggingOut = true;
						return async ({ update }) => {
							await update();
							isLoggingOut = false;
						};
					}}
				>
					<button type="submit" class="logout-btn" disabled={isLoggingOut}>
						{isLoggingOut ? 'Signing out...' : 'Sign Out'}
					</button>
				</form>
			</div>
		</div>
	</nav>
</header>

<style>
	header {
		background-color: var(--color-primary);
		color: white;
		padding: 0 var(--space-4);
	}

	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: var(--max-width);
		margin: 0 auto;
		min-height: var(--nav-height);
		gap: var(--space-4);
	}

	.logo {
		color: white;
		text-decoration: none;
		font-weight: 700;
		font-size: var(--font-size-lg);
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.logo:hover {
		text-decoration: none;
		color: var(--color-accent);
	}

	.logo-img {
		height: 2rem;
		width: auto;
	}

	.logo-text {
		letter-spacing: 0.05em;
	}

	.nav-content {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}

	.nav-links {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: var(--space-6);
		align-items: center;
	}

	.nav-links a {
		color: white;
		text-decoration: none;
		font-weight: 500;
		padding: var(--space-2) 0;
		position: relative;
	}

	.nav-links a:hover {
		color: var(--color-accent);
		text-decoration: none;
	}

	.nav-links a.active {
		color: var(--color-accent);
	}

	.nav-links a.active::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		right: 0;
		height: 2px;
		background-color: var(--color-accent);
	}

	.user-menu {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding-left: var(--space-4);
		border-left: 1px solid rgba(255, 255, 255, 0.2);
	}

	.user-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--space-1);
	}

	.user-name {
		font-weight: 500;
		font-size: var(--font-size-sm);
		color: white;
	}

	.org-name {
		font-size: var(--font-size-xs);
		color: rgba(255, 255, 255, 0.7);
	}

	.logout-btn {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		font-weight: 500;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		cursor: pointer;
		font-size: var(--font-size-sm);
		transition: all 0.15s ease;
	}

	.logout-btn:hover:not(:disabled) {
		background-color: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.logout-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		nav {
			flex-wrap: wrap;
			padding: var(--space-2) 0;
		}

		.nav-content {
			flex-wrap: wrap;
			justify-content: flex-end;
			gap: var(--space-3);
		}

		.user-menu {
			padding-left: 0;
			border-left: none;
		}

		.user-info {
			display: none;
		}

		.logo-text {
			display: none;
		}
	}
</style>
