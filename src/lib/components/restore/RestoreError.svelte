<script lang="ts">
	import EmptyState from '$lib/components/empty-states/EmptyState.svelte';
	import type { RestoreErrorType } from '$lib/restore/errors';

	interface Props {
		errorType: RestoreErrorType;
		onTryAgain: () => void;
		onReturnHome: () => void;
	}

	let { errorType, onTryAgain, onReturnHome }: Props = $props();

	const errorContent = $derived.by(() => {
		switch (errorType) {
			case 'wrong_passphrase':
				return {
					title: "We couldn't restore your data",
					body: "The passphrase you entered didn't match the one used to create this backup. Please double-check and try again.",
					guidance: "Your original backup file hasn't been changed."
				};
			case 'corrupt_file':
				return {
					title: "We couldn't restore your data",
					body: 'The backup file appears to be damaged or incomplete. This can happen if the file was modified or only partially downloaded.',
					guidance: 'If you have another copy of your backup, please try that instead.'
				};
			case 'wrong_format':
				return {
					title: "We couldn't restore your data",
					body: "This file doesn't appear to be a valid Well-Being Action Plan backup. Please select a file ending in .wbap or .json.",
					guidance: 'Your original backup file hasn\'t been changed.'
				};
			default:
				return {
					title: "We couldn't restore your data",
					body: 'Something unexpected happened while trying to restore your plan.',
					guidance: "Don't worry — your original backup file hasn't been changed."
				};
		}
	});
</script>

<EmptyState title={errorContent.title} body={errorContent.body} guidance={errorContent.guidance}>
	{#snippet actions()}
		<button class="btn btn-primary" onclick={onTryAgain}>Try again</button>
		<button class="btn btn-outline" onclick={onReturnHome}>Return to home</button>
	{/snippet}
</EmptyState>
