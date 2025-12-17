<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		body: string;
		guidance?: string;
		actions?: Snippet;
	}

	let { title, body, guidance, actions }: Props = $props();
</script>

<div class="empty-state">
	<div class="icon-container">
		<svg
			class="icon"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
			/>
		</svg>
	</div>

	<h1 class="title">{title}</h1>

	<p class="body">{body}</p>

	{#if guidance}
		<p class="guidance">{guidance}</p>
	{/if}

	{#if actions}
		<div class="actions">
			{@render actions()}
		</div>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--space-8);
		max-width: 32rem;
		margin: 0 auto;
	}

	.icon-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		background-color: var(--color-gray-100);
		border-radius: 50%;
		margin-bottom: var(--space-6);
	}

	.icon {
		width: 2rem;
		height: 2rem;
		color: var(--color-gray-500);
	}

	.title {
		font-size: var(--font-size-2xl);
		color: var(--color-gray-900);
		margin-bottom: var(--space-4);
	}

	.body {
		font-size: var(--font-size-base);
		color: var(--color-text-muted);
		line-height: 1.6;
		margin-bottom: var(--space-4);
	}

	.guidance {
		font-size: var(--font-size-base);
		color: var(--color-text);
		font-weight: 500;
		margin-bottom: var(--space-6);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: center;
	}
</style>
