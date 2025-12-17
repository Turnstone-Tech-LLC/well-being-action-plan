<script lang="ts">
	import type { ActionPlanSummary } from '../../../routes/provider/+layout.server';

	interface Props {
		plans: ActionPlanSummary[];
		searchQuery?: string;
	}

	let { plans, searchQuery = '' }: Props = $props();

	let localSearch = $state(searchQuery);

	const filteredPlans = $derived(
		plans.filter((plan) => {
			if (!localSearch.trim()) return true;
			const search = localSearch.toLowerCase();
			const nickname = plan.patient_nickname?.toLowerCase() || '';
			return nickname.includes(search);
		})
	);

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatRelativeDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
			if (diffHours === 0) {
				const diffMinutes = Math.floor(diffMs / (1000 * 60));
				return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
			}
			return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
		}
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		return formatDate(dateString);
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

<div class="plans-list-container">
	<div class="list-header">
		<div class="search-container">
			<label for="search-plans" class="visually-hidden">Search action plans</label>
			<div class="search-input-wrapper">
				<svg
					class="search-icon"
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
						d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
					/>
				</svg>
				<input
					id="search-plans"
					type="search"
					placeholder="Search by patient nickname..."
					bind:value={localSearch}
					class="search-input"
				/>
			</div>
		</div>
		<a href="/provider/plans/new" class="btn btn-primary">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="btn-icon"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Create Action Plan
		</a>
	</div>

	{#if filteredPlans.length === 0}
		<div class="no-results" role="status" aria-live="polite">
			{#if localSearch.trim()}
				<p>No action plans match "{localSearch}"</p>
				<button type="button" class="btn btn-outline" onclick={() => (localSearch = '')}>
					Clear search
				</button>
			{:else}
				<p>No action plans found</p>
			{/if}
		</div>
	{:else}
		<div class="table-container" role="region" aria-label="Action plans list">
			<table>
				<thead>
					<tr>
						<th scope="col">Patient</th>
						<th scope="col">Status</th>
						<th scope="col">Version</th>
						<th scope="col">Created</th>
						<th scope="col">Last Updated</th>
						<th scope="col"><span class="visually-hidden">Actions</span></th>
					</tr>
				</thead>
				<tbody>
					{#each filteredPlans as plan (plan.id)}
						<tr>
							<td class="patient-cell">
								<a href="/provider/plans/{plan.id}" class="patient-link">
									{plan.patient_nickname || 'Unnamed Patient'}
								</a>
							</td>
							<td>
								<span class="badge {getStatusBadgeClass(plan.status)}">
									{plan.status}
								</span>
							</td>
							<td class="version-cell">v{plan.latest_version}</td>
							<td class="date-cell">{formatDate(plan.created_at)}</td>
							<td class="date-cell" title={formatDate(plan.updated_at)}>
								{formatRelativeDate(plan.updated_at)}
							</td>
							<td class="actions-cell">
								<a
									href="/provider/plans/{plan.id}"
									class="action-link"
									aria-label="View plan for {plan.patient_nickname || 'Unnamed Patient'}"
								>
									View
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="results-count" role="status" aria-live="polite">
			{filteredPlans.length}
			{filteredPlans.length === 1 ? 'plan' : 'plans'}
			{#if localSearch.trim()}
				matching "{localSearch}"
			{/if}
		</p>
	{/if}
</div>

<style>
	.plans-list-container {
		background-color: var(--color-white);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-md);
		overflow: hidden;
	}

	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid var(--color-gray-200);
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.search-container {
		flex: 1;
		min-width: 200px;
		max-width: 400px;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: var(--space-3);
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-gray-400);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		padding-left: var(--space-10);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.btn-icon {
		width: 1.25rem;
		height: 1.25rem;
		margin-right: var(--space-2);
	}

	.no-results {
		padding: var(--space-12);
		text-align: center;
		color: var(--color-text-muted);
	}

	.no-results p {
		margin-bottom: var(--space-4);
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		text-align: left;
		padding: var(--space-3) var(--space-4);
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text-muted);
		background-color: var(--color-gray-50);
		border-bottom: 1px solid var(--color-gray-200);
	}

	td {
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-gray-100);
		font-size: var(--font-size-sm);
	}

	tr:hover {
		background-color: var(--color-gray-50);
	}

	.patient-cell {
		font-weight: 500;
	}

	.patient-link {
		color: var(--color-primary);
		text-decoration: none;
	}

	.patient-link:hover {
		text-decoration: underline;
	}

	.version-cell {
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
	}

	.date-cell {
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.actions-cell {
		text-align: right;
	}

	.action-link {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 500;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		transition: background-color 0.15s ease;
	}

	.action-link:hover {
		background-color: var(--color-gray-100);
		text-decoration: none;
	}

	.badge {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-xs);
		font-weight: 500;
		border-radius: var(--radius-sm);
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
		color: var(--color-gray-600);
	}

	.results-count {
		padding: var(--space-3) var(--space-6);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		background-color: var(--color-gray-50);
		border-top: 1px solid var(--color-gray-200);
	}

	.visually-hidden {
		border: 0;
		clip: rect(0 0 0 0);
		height: 1px;
		margin: -1px;
		overflow: hidden;
		padding: 0;
		position: absolute;
		width: 1px;
		white-space: nowrap;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.list-header {
			padding: var(--space-3) var(--space-4);
		}

		.search-container {
			order: 2;
			min-width: 100%;
		}

		th,
		td {
			padding: var(--space-2) var(--space-3);
		}

		.version-cell,
		.date-cell:first-of-type {
			display: none;
		}
	}
</style>
