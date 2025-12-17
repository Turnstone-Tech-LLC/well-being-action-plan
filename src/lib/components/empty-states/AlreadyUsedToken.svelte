<script lang="ts">
	import EmptyState from './EmptyState.svelte';
</script>

<EmptyState
	title="This setup link has already been used"
	body="Your Well-Being Action Plan has already been set up on another device. For privacy and safety, setup links can only be used once."
	guidance="If you're switching devices, restore from your encrypted backup. If you need a fresh setup, ask your provider to generate a new link."
>
	{#snippet actions()}
		<a href="/restore" class="btn btn-primary">Restore from backup</a>
		<a href="/" class="btn btn-outline">Return to home</a>
	{/snippet}
</EmptyState>
