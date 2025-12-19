<script lang="ts">
	interface SupportiveAdult {
		id: string;
		name: string;
		type: string;
		typeDescription?: string;
		contactInfo: string;
		isPrimary: boolean;
	}

	interface Props {
		adults: SupportiveAdult[];
		selectedIds: string[];
		onToggle: (id: string) => void;
	}

	let { adults, selectedIds, onToggle }: Props = $props();

	function isSelected(id: string): boolean {
		return selectedIds.includes(id);
	}

	function handleToggle(id: string) {
		onToggle(id);
	}

	function handleKeyDown(event: KeyboardEvent, id: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleToggle(id);
		}
	}

	function getTypeLabel(adult: SupportiveAdult): string {
		if (adult.typeDescription) {
			return adult.typeDescription;
		}
		return adult.type;
	}
</script>

<div class="adults-list" role="group" aria-label="Select supportive adults to reach out to">
	{#if adults.length === 0}
		<p class="empty-state">No supportive adults found in your plan.</p>
	{:else}
		<div class="adult-items">
			{#each adults as adult (adult.id)}
				<button
					type="button"
					class="adult-item"
					class:selected={isSelected(adult.id)}
					class:primary={adult.isPrimary}
					onclick={() => handleToggle(adult.id)}
					onkeydown={(e) => handleKeyDown(e, adult.id)}
					aria-pressed={isSelected(adult.id)}
				>
					<span class="checkbox" aria-hidden="true">
						{#if isSelected(adult.id)}
							<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
							</svg>
						{/if}
					</span>
					<span class="adult-content">
						<span class="adult-name">
							{adult.name}
							{#if adult.isPrimary}
								<span class="primary-badge" aria-label="Primary contact">Primary</span>
							{/if}
						</span>
						<span class="adult-type">({getTypeLabel(adult)})</span>
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.adults-list {
		width: 100%;
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--space-6);
		font-style: italic;
	}

	.adult-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.adult-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--color-white);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.adult-item:hover {
		border-color: var(--color-gray-300);
		background-color: var(--color-gray-50);
	}

	.adult-item:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.adult-item.selected {
		border-color: #ffca28;
		background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
	}

	.adult-item.primary {
		border-left: 4px solid #ffb300;
	}

	.checkbox {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		min-width: 24px;
		border: 2px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		background: var(--color-white);
		color: var(--color-white);
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	.adult-item.selected .checkbox {
		border-color: #f9a825;
		background-color: #f9a825;
	}

	.checkbox svg {
		width: 16px;
		height: 16px;
	}

	.adult-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
	}

	.adult-name {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: 500;
		color: var(--color-gray-900);
		font-size: var(--font-size-base);
	}

	.primary-badge {
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: #f57f17;
		background: #fff8e1;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.adult-type {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.adult-item,
		.checkbox {
			transition: none;
		}
	}

	/* Touch device optimizations */
	@media (pointer: coarse) {
		.adult-item {
			padding: var(--space-4);
			min-height: 56px;
		}

		.checkbox {
			width: 28px;
			height: 28px;
			min-width: 28px;
		}

		.checkbox svg {
			width: 18px;
			height: 18px;
		}
	}

	/* High contrast mode support */
	@media (forced-colors: active) {
		.adult-item {
			border: 2px solid currentColor;
		}

		.adult-item.selected {
			outline: 3px solid highlight;
		}

		.checkbox {
			border: 2px solid currentColor;
		}
	}
</style>
