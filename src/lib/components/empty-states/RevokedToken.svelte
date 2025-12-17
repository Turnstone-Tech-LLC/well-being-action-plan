<script lang="ts">
	import EmptyState from './EmptyState.svelte';
</script>

<EmptyState
	title="This link was replaced"
	body="Your provider has generated a newer link for your plan. This usually happens if the original link was lost, or changes were made to your plan."
	guidance="Please use the most recent link provided to you."
>
	{#snippet actions()}
		<a href="/" class="btn btn-primary">Return to home</a>
	{/snippet}
</EmptyState>
