<script lang="ts">
	import EmptyState from './EmptyState.svelte';
</script>

<EmptyState
	title="Your plan update link has expired"
	body="Plan update links are time-limited to protect your privacy. Please ask your provider to resend the update link."
>
	{#snippet actions()}
		<a href="/" class="btn btn-primary">Return to home</a>
	{/snippet}
</EmptyState>
