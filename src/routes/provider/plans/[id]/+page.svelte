<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import PlanDetail from '$lib/components/plans/PlanDetail.svelte';

	let { data }: { data: PageData } = $props();

	let isArchiving = $state(false);
	let isGeneratingToken = $state(false);
	let actionMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'active':
				return 'badge-active';
			case 'draft':
				return 'badge-draft';
			case 'archived':
				return 'badge-archived';
			default:
				return '';
		}
	}
</script>

<svelte:head>
	<title>{data.plan.planPayload?.patientNickname || 'Action Plan'} - Well-Being Action Plan</title>
</svelte:head>

<div class="plan-detail-page">
	<header class="page-header">
		<div class="header-content">
			<div class="header-top">
				<a href="/provider" class="back-link">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="back-icon"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
						/>
					</svg>
					Back to Dashboard
				</a>
			</div>

			<div class="header-main">
				<div class="title-section">
					<h1>{data.plan.planPayload?.patientNickname || 'Action Plan'}</h1>
					<span class="status-badge {getStatusBadgeClass(data.plan.status)}">
						{data.plan.status.charAt(0).toUpperCase() + data.plan.status.slice(1)}
					</span>
				</div>

				<p class="meta-info">
					Created {formatDate(data.plan.created_at)}
					{#if data.plan.latestRevision}
						<span class="separator">&bull;</span>
						Version {data.plan.latestRevision.version}
					{/if}
					{#if data.plan.revisionCount > 1}
						<span class="separator">&bull;</span>
						<a href="/provider/plans/{data.plan.id}/history" class="history-link">
							View History ({data.plan.revisionCount} revisions)
						</a>
					{/if}
				</p>
			</div>

			<div class="header-actions">
				{#if data.plan.status !== 'archived'}
					<a href="/provider/plans/{data.plan.id}/revise" class="btn btn-primary">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="btn-icon"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
							/>
						</svg>
						Create Revision
					</a>
					<a href="/provider/plans/{data.plan.id}/edit" class="btn btn-outline">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="btn-icon"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
							/>
						</svg>
						Quick Edit
					</a>
					<form
						method="POST"
						action="?/generateToken"
						use:enhance={() => {
							isGeneratingToken = true;
							actionMessage = null;
							return async ({ result }) => {
								isGeneratingToken = false;
								if (result.type === 'success') {
									actionMessage = { type: 'success', text: 'New access link generated!' };
									// Reload the page to get the new token
									window.location.reload();
								} else if (result.type === 'failure') {
									const data = result.data as { error?: string } | undefined;
									actionMessage = {
										type: 'error',
										text: data?.error || 'Failed to generate token'
									};
								}
							};
						}}
					>
						<button type="submit" class="btn btn-outline" disabled={isGeneratingToken}>
							{#if isGeneratingToken}
								<span class="spinner" aria-hidden="true"></span>
								Generating...
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="2"
									stroke="currentColor"
									class="btn-icon"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
									/>
								</svg>
								Generate New Link
							{/if}
						</button>
					</form>

					<form
						method="POST"
						action="?/archive"
						use:enhance={() => {
							if (!confirm('Are you sure you want to archive this action plan?')) {
								return async () => {};
							}
							isArchiving = true;
							actionMessage = null;
							return async ({ result }) => {
								isArchiving = false;
								if (result.type === 'failure') {
									const data = result.data as { error?: string } | undefined;
									actionMessage = {
										type: 'error',
										text: data?.error || 'Failed to archive plan'
									};
								}
							};
						}}
					>
						<button type="submit" class="btn btn-danger-outline" disabled={isArchiving}>
							{#if isArchiving}
								<span class="spinner" aria-hidden="true"></span>
								Archiving...
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="2"
									stroke="currentColor"
									class="btn-icon"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
									/>
								</svg>
								Archive
							{/if}
						</button>
					</form>
				{/if}
			</div>
		</div>
	</header>

	{#if actionMessage}
		<div class="message message-{actionMessage.type}" role="alert">
			{actionMessage.text}
		</div>
	{/if}

	{#if data.plan.planPayload}
		<PlanDetail planPayload={data.plan.planPayload} activeToken={data.plan.activeToken} />
	{:else}
		<div class="empty-state">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="empty-icon"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
				/>
			</svg>
			<h2>No Plan Data</h2>
			<p>This action plan doesn't have any content yet.</p>
		</div>
	{/if}
</div>

<style>
	.plan-detail-page {
		max-width: 64rem;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.page-header {
		margin-bottom: var(--space-6);
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.header-top {
		display: flex;
		align-items: center;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--font-size-sm);
		transition: color 0.15s ease;
	}

	.back-link:hover {
		color: var(--color-primary);
	}

	.back-link:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.back-icon {
		width: 1rem;
		height: 1rem;
	}

	.header-main {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.title-section {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.title-section h1 {
		margin: 0;
		font-size: var(--font-size-2xl);
		color: var(--color-text);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: var(--space-1) var(--space-3);
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-full);
		text-transform: capitalize;
	}

	.badge-active {
		background-color: #dcfce7;
		color: #166534;
	}

	.badge-draft {
		background-color: #fef9c3;
		color: #854d0e;
	}

	.badge-archived {
		background-color: var(--color-gray-100);
		color: var(--color-text-muted);
	}

	.meta-info {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.separator {
		margin: 0 var(--space-2);
	}

	.history-link {
		color: var(--color-primary);
		text-decoration: none;
	}

	.history-link:hover {
		text-decoration: underline;
	}

	.history-link:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.header-actions {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		font-weight: 500;
		font-size: var(--font-size-sm);
		border-radius: var(--radius-md);
		border: none;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
		cursor: pointer;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-primary);
		border: 1px solid var(--color-primary);
	}

	.btn-outline:hover:not(:disabled) {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.btn-outline:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-danger-outline {
		background-color: transparent;
		color: #b91c1c;
		border: 1px solid #b91c1c;
	}

	.btn-danger-outline:hover:not(:disabled) {
		background-color: #b91c1c;
		color: var(--color-white);
	}

	.btn-danger-outline:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-icon {
		width: 1rem;
		height: 1rem;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.75s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.message {
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-4);
		font-size: var(--font-size-sm);
	}

	.message-success {
		background-color: #dcfce7;
		color: #166534;
		border: 1px solid #86efac;
	}

	.message-error {
		background-color: rgba(239, 68, 68, 0.1);
		color: #b91c1c;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-12);
		text-align: center;
		background-color: var(--color-gray-50);
		border-radius: var(--radius-xl);
	}

	.empty-icon {
		width: 3rem;
		height: 3rem;
		color: var(--color-text-muted);
		margin-bottom: var(--space-4);
	}

	.empty-state h2 {
		margin: 0 0 var(--space-2);
		color: var(--color-text);
		font-size: var(--font-size-lg);
	}

	.empty-state p {
		margin: 0;
		color: var(--color-text-muted);
	}

	@media (max-width: 640px) {
		.plan-detail-page {
			padding: var(--space-4);
		}

		.header-actions {
			flex-direction: column;
		}

		.btn {
			width: 100%;
		}
	}

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}
	}

	@media print {
		.page-header {
			border-bottom: 2px solid var(--color-gray-200);
			padding-bottom: var(--space-4);
		}

		.back-link,
		.header-actions {
			display: none;
		}

		.plan-detail-page {
			max-width: none;
			padding: 0;
		}
	}
</style>
