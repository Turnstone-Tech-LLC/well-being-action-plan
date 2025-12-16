<script lang="ts">
	import { page } from '$app/stores';

	type UserState = 'unauthenticated' | 'provider' | 'patient';

	interface Props {
		userState?: UserState;
		onClearData?: () => void;
	}

	let { userState = 'unauthenticated', onClearData }: Props = $props();
</script>

<header>
	<nav>
		<a href="/" class="logo" aria-label="Well-Being Action Plan Home">
			<img src="/logo-small.png" alt="" class="logo-img" />
			<span class="logo-text">Well-Being Action Plan</span>
		</a>

		<ul class="nav-links">
			<li>
				<a href="/about" class:active={$page.url.pathname === '/about'}>About</a>
			</li>
			{#if userState === 'provider'}
				<li>
					<button type="button" class="nav-button" onclick={() => console.log('Log out')}>
						Log Out
					</button>
				</li>
			{:else if userState === 'patient'}
				<li>
					<button type="button" class="nav-button" onclick={onClearData}>Clear Data</button>
				</li>
			{/if}
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

	.logo-img {
		height: 2rem;
		width: auto;
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

	.nav-button {
		background: transparent;
		border: none;
		color: white;
		font-weight: 500;
		padding: var(--space-2) 0;
		cursor: pointer;
	}

	.nav-button:hover {
		color: var(--color-accent);
	}
</style>
