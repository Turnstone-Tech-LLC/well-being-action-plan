<script lang="ts">
	import { generateA11yId } from '$lib/a11y';

	interface Props {
		displayName: string | null;
		isReturningUser?: boolean;
	}

	let { displayName, isReturningUser = false }: Props = $props();

	const headingId = generateA11yId('dashboard-heading');

	// Format today's date in a friendly way
	function formatDate(): string {
		const now = new Date();
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		};
		return now.toLocaleDateString('en-US', options);
	}

	// Generate greeting based on time of day and whether user is returning
	function getGreeting(): string {
		const hour = new Date().getHours();
		const name = displayName || 'there';

		if (isReturningUser) {
			return `Welcome back, ${name}!`;
		}

		if (hour < 12) {
			return `Good morning, ${name}!`;
		} else if (hour < 17) {
			return `Good afternoon, ${name}!`;
		} else {
			return `Good evening, ${name}!`;
		}
	}

	let greeting = $derived(getGreeting());
	let formattedDate = $derived(formatDate());
</script>

<header class="dashboard-header" aria-labelledby={headingId}>
	<div class="header-content">
		<h1 id={headingId}>{greeting}</h1>
		<p class="date" aria-label="Today's date">{formattedDate}</p>
	</div>
</header>

<style>
	.dashboard-header {
		text-align: center;
		padding: var(--space-6) var(--space-4) var(--space-4);
	}

	.header-content {
		max-width: var(--max-width);
		margin: 0 auto;
	}

	h1 {
		font-size: var(--font-size-2xl);
		color: var(--color-gray-900);
		margin-bottom: var(--space-2);
		font-weight: 600;
	}

	.date {
		font-size: var(--font-size-base);
		color: var(--color-text-muted);
	}

	@media (min-width: 480px) {
		h1 {
			font-size: var(--font-size-3xl);
		}

		.date {
			font-size: var(--font-size-lg);
		}
	}
</style>
