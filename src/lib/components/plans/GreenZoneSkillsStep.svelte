<script lang="ts">
	import { generateA11yId } from '$lib/a11y';
	import type { Skill, SkillCategory } from '$lib/types/database';
	import {
		type CustomSkill,
		type SelectedSkill,
		groupSkillsByCategory,
		isCustomSkill,
		getCategoryDisplayName
	} from '$lib/stores/actionPlanDraft';
	import SkillSelector from './SkillSelector.svelte';
	import CustomSkillAdd from './CustomSkillAdd.svelte';

	interface Props {
		skills: Skill[];
		selectedSkills: SelectedSkill[];
		customSkills: CustomSkill[];
		happyWhen: string;
		happyBecause: string;
		onBack: () => void;
		onContinue: () => void;
		onToggleSkill: (skillId: string) => void;
		onSkillFillIn: (skillId: string, value: string) => void;
		onAddCustomSkill: (title: string, category: SkillCategory) => void;
		onRemoveCustomSkill: (customSkillId: string) => void;
		onHappyWhenChange: (value: string) => void;
		onHappyBecauseChange: (value: string) => void;
	}

	let {
		skills,
		selectedSkills,
		customSkills,
		happyWhen,
		happyBecause,
		onBack,
		onContinue,
		onToggleSkill,
		onSkillFillIn,
		onAddCustomSkill,
		onRemoveCustomSkill,
		onHappyWhenChange,
		onHappyBecauseChange
	}: Props = $props();

	// IDs for accessibility
	const happyWhenId = generateA11yId('happy-when');
	const happyBecauseId = generateA11yId('happy-because');

	// Group skills by category
	const skillsByCategory = $derived(groupSkillsByCategory(skills, customSkills));

	// Check if a skill is selected
	function isSelected(skillId: string): boolean {
		return selectedSkills.some((s) => s.skillId === skillId);
	}

	// Get fill-in value for a skill
	function getFillInValue(skillId: string): string {
		return selectedSkills.find((s) => s.skillId === skillId)?.fillInValue || '';
	}

	// Category order for display
	const categoryOrder: SkillCategory[] = ['physical', 'creative', 'social', 'mindfulness'];

	// Get category icon based on category name
	function getCategoryIcon(category: SkillCategory): string {
		const icons: Record<string, string> = {
			physical: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', // Activity/clock
			creative:
				'M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42', // Paint brush
			social:
				'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z', // Users
			mindfulness:
				'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' // Light bulb
		};
		return icons[category] || icons.mindfulness;
	}
</script>

<div class="green-zone-step">
	<div class="step-header">
		<div class="zone-badge">
			<span class="zone-indicator green"></span>
			Green Zone
		</div>
		<h2>Coping Skills</h2>
		<p class="step-description">
			It is normal to have different feelings. These are coping skills I use to feel happy again.
		</p>
	</div>

	<div class="skills-content">
		{#each categoryOrder as category (category)}
			{@const categorySkills = skillsByCategory.get(category) || []}
			<section class="category-section" aria-labelledby="category-{category}">
				<h3 id="category-{category}" class="category-header">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="category-icon"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d={getCategoryIcon(category)} />
					</svg>
					{getCategoryDisplayName(category)}
				</h3>

				<div class="skills-grid">
					{#each categorySkills as skill (isCustomSkill(skill) ? skill.id : skill.id)}
						{@const skillId = skill.id}
						{@const custom = isCustomSkill(skill)}
						<SkillSelector
							{skill}
							isSelected={isSelected(skillId)}
							fillInValue={getFillInValue(skillId)}
							isCustom={custom}
							onToggle={() => onToggleSkill(skillId)}
							onFillInChange={(value) => onSkillFillIn(skillId, value)}
							onRemoveCustom={custom ? () => onRemoveCustomSkill(skillId) : undefined}
						/>
					{/each}
				</div>

				<CustomSkillAdd {category} onAdd={onAddCustomSkill} />
			</section>
		{/each}
	</div>

	<div class="reflective-questions">
		<h3 class="questions-header">Reflective Questions</h3>

		<div class="question-group">
			<label for={happyWhenId} class="question-label"> I feel happy when... </label>
			<textarea
				id={happyWhenId}
				value={happyWhen}
				oninput={(e) => onHappyWhenChange((e.target as HTMLTextAreaElement).value)}
				class="question-input"
				rows="3"
				placeholder="What makes you feel happy?"
				maxlength="500"
			></textarea>
		</div>

		<div class="question-group">
			<label for={happyBecauseId} class="question-label">
				I can tell I am feeling happy because...
			</label>
			<textarea
				id={happyBecauseId}
				value={happyBecause}
				oninput={(e) => onHappyBecauseChange((e.target as HTMLTextAreaElement).value)}
				class="question-input"
				rows="3"
				placeholder="How do you know when you're feeling happy?"
				maxlength="500"
			></textarea>
		</div>
	</div>

	<div class="step-actions">
		<button type="button" class="btn btn-outline" onclick={onBack}>
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
					d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
				/>
			</svg>
			Back
		</button>
		<button type="button" class="btn btn-primary" onclick={onContinue}>
			Continue
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
					d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
				/>
			</svg>
		</button>
	</div>
</div>

<style>
	.green-zone-step {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.step-header {
		text-align: center;
	}

	.zone-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background-color: rgba(34, 197, 94, 0.1);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: #166534;
		margin-bottom: var(--space-3);
	}

	.zone-indicator {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
	}

	.zone-indicator.green {
		background-color: #22c55e;
	}

	.step-header h2 {
		margin-bottom: var(--space-2);
	}

	.step-description {
		color: var(--color-text-muted);
		font-size: var(--font-size-base);
		max-width: 36rem;
		margin: 0 auto;
	}

	.skills-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.category-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
		padding-bottom: var(--space-2);
		border-bottom: 2px solid var(--color-gray-200);
	}

	.category-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-primary);
	}

	.skills-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: var(--space-3);
	}

	.reflective-questions {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		padding: var(--space-6);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-lg);
	}

	.questions-header {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
	}

	.question-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.question-label {
		font-weight: 500;
		color: var(--color-text);
		font-size: var(--font-size-base);
	}

	.question-input {
		padding: var(--space-3) var(--space-4);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		font-family: inherit;
		color: var(--color-text);
		background-color: var(--color-white);
		resize: vertical;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.question-input::placeholder {
		color: var(--color-gray-400);
	}

	.question-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.step-actions {
		display: flex;
		justify-content: center;
		gap: var(--space-4);
		padding-top: var(--space-4);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-6);
		font-weight: 500;
		font-size: var(--font-size-base);
		border-radius: var(--radius-md);
		border: none;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease;
		cursor: pointer;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover {
		background-color: #004a3f;
	}

	.btn-primary:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-text);
		border: 2px solid var(--color-gray-300);
	}

	.btn-outline:hover {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.btn-outline:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-icon {
		width: 1rem;
		height: 1rem;
	}

	@media (max-width: 640px) {
		.skills-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}
	}
</style>
