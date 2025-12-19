<script lang="ts">
	interface Skill {
		id: string;
		title: string;
		description: string;
		category: string;
	}

	interface Props {
		skills: Skill[];
		selectedIds: string[];
		onToggle: (id: string) => void;
	}

	let { skills, selectedIds, onToggle }: Props = $props();

	// Group skills by category
	const groupedSkills = $derived(() => {
		const groups: Record<string, Skill[]> = {};
		for (const skill of skills) {
			const category = skill.category || 'Other';
			if (!groups[category]) {
				groups[category] = [];
			}
			groups[category].push(skill);
		}
		return groups;
	});

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
</script>

<div class="strategy-selector" role="group" aria-label="Select coping skills">
	{#if skills.length === 0}
		<p class="empty-state">No coping skills found in your plan.</p>
	{:else}
		{@const groups = groupedSkills()}
		{#each Object.entries(groups) as [category, categorySkills] (category)}
			<div class="skill-category">
				{#if Object.keys(groups).length > 1}
					<h3 class="category-title">{category}</h3>
				{/if}
				<div class="skill-list">
					{#each categorySkills as skill (skill.id)}
						<button
							type="button"
							class="skill-item"
							class:selected={isSelected(skill.id)}
							onclick={() => handleToggle(skill.id)}
							onkeydown={(e) => handleKeyDown(e, skill.id)}
							aria-pressed={isSelected(skill.id)}
						>
							<span class="checkbox" aria-hidden="true">
								{#if isSelected(skill.id)}
									<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
									</svg>
								{/if}
							</span>
							<span class="skill-content">
								<span class="skill-title">{skill.title}</span>
								{#if skill.description}
									<span class="skill-description">{skill.description}</span>
								{/if}
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.strategy-selector {
		width: 100%;
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--space-6);
		font-style: italic;
	}

	.skill-category {
		margin-bottom: var(--space-4);
	}

	.category-title {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-2);
		padding-left: var(--space-1);
	}

	.skill-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.skill-item {
		display: flex;
		align-items: flex-start;
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

	.skill-item:hover {
		border-color: var(--color-gray-300);
		background-color: var(--color-gray-50);
	}

	.skill-item:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.skill-item.selected {
		border-color: #66bb6a;
		background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
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

	.skill-item.selected .checkbox {
		border-color: #43a047;
		background-color: #43a047;
	}

	.checkbox svg {
		width: 16px;
		height: 16px;
	}

	.skill-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
	}

	.skill-title {
		font-weight: 500;
		color: var(--color-gray-900);
		font-size: var(--font-size-base);
	}

	.skill-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.skill-item,
		.checkbox {
			transition: none;
		}
	}

	/* Touch device optimizations */
	@media (pointer: coarse) {
		.skill-item {
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
		.skill-item {
			border: 2px solid currentColor;
		}

		.skill-item.selected {
			outline: 3px solid highlight;
		}

		.checkbox {
			border: 2px solid currentColor;
		}
	}
</style>
