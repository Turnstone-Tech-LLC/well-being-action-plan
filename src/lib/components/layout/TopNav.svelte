<script lang="ts">
	import { page } from '$app/stores';
</script>

<header>
	<nav>
		<a href="/" class="logo" aria-label="Well-Being Action Plan Home">
			<span class="logo-text">WBAP</span>
		</a>

		<ul class="nav-links">
			<li>
				<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
			</li>
			<li>
				<a href="/provider/login" class:active={$page.url.pathname.startsWith('/provider')}>
					Provider
				</a>
			</li>
		</ul>
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
		height: var(--nav-height);
	}

	.logo {
		color: white;
		text-decoration: none;
		font-weight: 700;
		font-size: var(--font-size-lg);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.logo:hover {
		text-decoration: none;
		color: var(--color-accent);
	}

	.logo-text {
		letter-spacing: 0.05em;
	}

	.nav-links {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: var(--space-6);
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
</style>
