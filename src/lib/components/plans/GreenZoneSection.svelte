<script lang="ts">
	interface Skill {
		id: string;
		title: string;
		description: string;
		category: string;
		additionalInfo?: string;
		displayOrder: number;
	}

	interface SupportiveAdult {
		id: string;
		type: string;
		typeDescription?: string;
		name: string;
		contactInfo: string;
		isPrimary: boolean;
		displayOrder: number;
	}

	interface Props {
		skills: Skill[];
		supportiveAdults: SupportiveAdult[];
	}

	let { skills, supportiveAdults }: Props = $props();

	// Group skills by category
	const skillsByCategory = $derived(() => {
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

	function getCategoryDisplayName(category: string): string {
		const names: Record<string, string> = {
			physical: 'Physical Activities',
			creative: 'Creative Expression',
			social: 'Social Connection',
			mindfulness: 'Mindfulness',
			Other: 'Other'
		};
		return names[category] || category;
	}

	function getCategoryIcon(category: string): string {
		// Return different icons based on category
		switch (category) {
			case 'physical':
				return 'M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z';
			case 'creative':
				return 'M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42';
			case 'social':
				return 'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z';
			case 'mindfulness':
				return 'M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z';
			default:
				return 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z';
		}
	}
</script>

<section class="green-zone-section detail-section" aria-labelledby="green-zone-heading">
	<header class="section-header green-header">
		<h2 id="green-zone-heading">Green Zone - Coping Skills</h2>
		<span class="zone-badge zone-badge-green">
			<span class="zone-indicator"></span>
			{skills.length} skill{skills.length === 1 ? '' : 's'}
		</span>
	</header>

	<div class="section-content">
		{#if skills.length > 0}
			<div class="skills-container">
				{#each Object.entries(skillsByCategory()) as [category, categorySkills] (category)}
					<div class="category-group">
						<h3 class="category-title">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="category-icon"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d={getCategoryIcon(category)}
								/>
							</svg>
							{getCategoryDisplayName(category)}
						</h3>
						<ul class="skills-list" role="list">
							{#each categorySkills.sort((a, b) => a.displayOrder - b.displayOrder) as skill (skill.id)}
								<li class="skill-item">
									<div class="skill-header">
										<span class="skill-title">{skill.title}</span>
									</div>
									{#if skill.description}
										<p class="skill-description">{skill.description}</p>
									{/if}
									{#if skill.additionalInfo}
										<p class="skill-additional">"{skill.additionalInfo}"</p>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		{:else}
			<p class="empty-message">No coping skills selected.</p>
		{/if}

		<!-- Supportive Adults -->
		{#if supportiveAdults.length > 0}
			<div class="supportive-adults-container">
				<h3 class="subsection-title">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="subsection-icon"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
						/>
					</svg>
					Supportive Adults
				</h3>
				<ul class="adults-list" role="list">
					{#each supportiveAdults.sort((a, b) => a.displayOrder - b.displayOrder) as adult (adult.id)}
						<li class="adult-item">
							<div class="adult-header">
								<span class="adult-name">{adult.name || '(No name provided)'}</span>
								<span class="adult-type">{adult.type}</span>
								{#if adult.isPrimary}
									<span class="primary-badge">Primary</span>
								{/if}
							</div>
							{#if adult.contactInfo}
								<p class="adult-contact">{adult.contactInfo}</p>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</section>

<style>
	.detail-section {
		background-color: var(--color-white);
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.green-header {
		background: linear-gradient(135deg, rgba(0, 89, 76, 0.05) 0%, rgba(0, 89, 76, 0.1) 100%);
		border-bottom: 2px solid rgba(0, 89, 76, 0.2);
	}

	.section-header h2 {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-primary);
	}

	.zone-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-md);
		font-size: var(--font-size-xs);
		font-weight: 600;
	}

	.zone-indicator {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
	}

	.zone-badge-green {
		background-color: rgba(0, 89, 76, 0.1);
		color: var(--color-primary);
	}

	.zone-badge-green .zone-indicator {
		background-color: var(--color-primary);
	}

	.section-content {
		padding: var(--space-5);
	}

	.skills-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.category-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.category-title {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0;
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text);
	}

	.category-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-primary);
	}

	.skills-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-3);
	}

	.skill-item {
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-primary);
	}

	.skill-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.skill-title {
		font-weight: 500;
		color: var(--color-text);
	}

	.skill-description {
		margin: var(--space-2) 0 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.skill-additional {
		margin: var(--space-2) 0 0;
		font-size: var(--font-size-sm);
		color: var(--color-primary);
		font-style: italic;
	}

	.supportive-adults-container {
		margin-top: var(--space-6);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-gray-200);
	}

	.subsection-title {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin: 0 0 var(--space-4);
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text);
	}

	.subsection-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-primary);
	}

	.adults-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-3);
	}

	@media (min-width: 640px) {
		.adults-list {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.adult-item {
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
		border-left: 3px solid #3b82f6;
	}

	.adult-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.adult-name {
		font-weight: 500;
		color: var(--color-text);
	}

	.adult-type {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		background-color: var(--color-gray-200);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
	}

	.primary-badge {
		font-size: var(--font-size-xs);
		color: #1d4ed8;
		background-color: rgba(59, 130, 246, 0.1);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-weight: 600;
	}

	.adult-contact {
		margin: var(--space-2) 0 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.empty-message {
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0;
		text-align: center;
		padding: var(--space-6);
	}

	@media print {
		.detail-section {
			box-shadow: none;
			border: 1px solid var(--color-gray-200);
			break-inside: avoid;
		}

		.green-header {
			background: rgba(0, 89, 76, 0.05);
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		.skill-item,
		.adult-item {
			background-color: rgba(0, 0, 0, 0.02);
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
	}
</style>
