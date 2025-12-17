<script lang="ts">
	import EmptyState from './EmptyState.svelte';
</script>

<EmptyState
	title="This link is no longer active"
	body="This link has expired or has already been used. That can happen if the link was opened on another device, or your provider generated a new link for you."
	guidance="Please ask your provider for a new link to continue."
>
	{#snippet actions()}
		<a href="/restore" class="btn btn-primary">Restore from backup</a>
		<a href="/" class="btn btn-outline">Return to home</a>
	{/snippet}
</EmptyState>
