<script lang="ts">
	import type { Skill, SupportiveAdultType, HelpMethod, CrisisResource } from '$lib/types/database';
	import type {
		SelectedSkill,
		CustomSkill,
		SelectedSupportiveAdult,
		CustomSupportiveAdult,
		SelectedHelpMethod,
		CustomHelpMethod
	} from '$lib/stores/actionPlanDraft';
	import { getCategoryDisplayName } from '$lib/stores/actionPlanDraft';
	import ReviewSection from './ReviewSection.svelte';

	interface Props {
		patientNickname: string;
		skills: Skill[];
		selectedSkills: SelectedSkill[];
		customSkills: CustomSkill[];
		happyWhen: string;
		happyBecause: string;
		supportiveAdultTypes: SupportiveAdultType[];
		selectedSupportiveAdults: SelectedSupportiveAdult[];
		customSupportiveAdults: CustomSupportiveAdult[];
		helpMethods: HelpMethod[];
		selectedHelpMethods: SelectedHelpMethod[];
		customHelpMethods: CustomHelpMethod[];
		crisisResources: CrisisResource[];
		isSubmitting?: boolean;
		onBack: () => void;
		onEditStep: (step: number) => void;
		onCreatePlan: () => void;
	}

	let {
		patientNickname,
		skills,
		selectedSkills,
		customSkills,
		happyWhen,
		happyBecause,
		supportiveAdultTypes,
		selectedSupportiveAdults,
		customSupportiveAdults,
		helpMethods,
		selectedHelpMethods,
		customHelpMethods,
		crisisResources,
		isSubmitting = false,
		onBack,
		onEditStep,
		onCreatePlan
	}: Props = $props();

	// Get skill details with fill-in values
	function getSelectedSkillDetails() {
		const details: Array<{
			id: string;
			title: string;
			category: string;
			fillInValue?: string;
			isCustom: boolean;
		}> = [];

		// Add predefined skills
		for (const selected of selectedSkills) {
			const skill = skills.find((s) => s.id === selected.skillId);
			if (skill) {
				details.push({
					id: skill.id,
					title: skill.title,
					category: getCategoryDisplayName(skill.category || 'mindfulness'),
					fillInValue: selected.fillInValue,
					isCustom: false
				});
			}
		}

		// Add custom skills
		for (const custom of customSkills) {
			details.push({
				id: custom.id,
				title: custom.title,
				category: getCategoryDisplayName(custom.category),
				isCustom: true
			});
		}

		return details;
	}

	// Get supportive adult details
	function getSupportiveAdultDetails() {
		const details: Array<{
			id: string;
			type: string;
			name: string;
			contactInfo?: string;
			isPrimary: boolean;
			isCustom: boolean;
		}> = [];

		// Add predefined adults
		for (const selected of selectedSupportiveAdults) {
			const adultType = supportiveAdultTypes.find((t) => t.id === selected.typeId);
			if (adultType) {
				details.push({
					id: adultType.id,
					type: adultType.label,
					name: selected.name,
					contactInfo: selected.contactInfo,
					isPrimary: selected.isPrimary,
					isCustom: false
				});
			}
		}

		// Add custom adults
		for (const custom of customSupportiveAdults) {
			details.push({
				id: custom.id,
				type: custom.label,
				name: custom.name,
				contactInfo: custom.contactInfo,
				isPrimary: custom.isPrimary,
				isCustom: true
			});
		}

		return details;
	}

	// Get help method details
	function getHelpMethodDetails() {
		const details: Array<{
			id: string;
			title: string;
			additionalInfo?: string;
			isCustom: boolean;
		}> = [];

		// Add predefined help methods
		for (const selected of selectedHelpMethods) {
			const method = helpMethods.find((m) => m.id === selected.helpMethodId);
			if (method) {
				details.push({
					id: method.id,
					title: method.title,
					additionalInfo: selected.additionalInfo,
					isCustom: false
				});
			}
		}

		// Add custom help methods
		for (const custom of customHelpMethods) {
			details.push({
				id: custom.id,
				title: custom.title,
				additionalInfo: custom.additionalInfo,
				isCustom: true
			});
		}

		return details;
	}

	const skillDetails = $derived(getSelectedSkillDetails());
	const adultDetails = $derived(getSupportiveAdultDetails());
	const helpMethodDetails = $derived(getHelpMethodDetails());

	const totalSkills = $derived(skillDetails.length);
	const totalAdults = $derived(adultDetails.length);
	const totalHelpMethods = $derived(helpMethodDetails.length);
</script>

<div class="review-step">
	<div class="step-header">
		<h2>Review Your Action Plan</h2>
		<p class="step-description">
			Please review your selections before creating the action plan
			{#if patientNickname}
				for <strong>{patientNickname}</strong>
			{/if}.
		</p>
	</div>

	<div class="review-sections">
		<!-- Reflective Questions Section -->
		{#if happyWhen || happyBecause}
			<ReviewSection title="About Me" badgeColor="blue" onEdit={() => onEditStep(2)}>
				<div class="reflective-questions">
					{#if happyWhen}
						<div class="reflective-item">
							<span class="reflective-label">I feel happy when...</span>
							<p class="reflective-value">{happyWhen}</p>
						</div>
					{/if}
					{#if happyBecause}
						<div class="reflective-item">
							<span class="reflective-label">I can tell I'm happy because...</span>
							<p class="reflective-value">{happyBecause}</p>
						</div>
					{/if}
				</div>
			</ReviewSection>
		{/if}

		<!-- Green Zone Skills Section -->
		<ReviewSection
			title="Green Zone Skills"
			badgeText="Green Zone"
			badgeColor="green"
			itemCount={totalSkills}
			onEdit={() => onEditStep(2)}
		>
			{#if skillDetails.length > 0}
				<ul class="review-list" role="list">
					{#each skillDetails as skill (skill.id)}
						<li class="review-item">
							<div class="item-header">
								<span class="item-title">{skill.title}</span>
								<span class="item-category">{skill.category}</span>
								{#if skill.isCustom}
									<span class="custom-badge">Custom</span>
								{/if}
							</div>
							{#if skill.fillInValue}
								<p class="item-detail">"{skill.fillInValue}"</p>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty-state">No coping skills selected.</p>
			{/if}
		</ReviewSection>

		<!-- Supportive Adults Section -->
		<ReviewSection
			title="Supportive Adults"
			badgeColor="blue"
			itemCount={totalAdults}
			onEdit={() => onEditStep(3)}
		>
			{#if adultDetails.length > 0}
				<ul class="review-list" role="list">
					{#each adultDetails as adult (adult.id)}
						<li class="review-item">
							<div class="item-header">
								<span class="item-title">{adult.name || '(No name provided)'}</span>
								<span class="item-category">{adult.type}</span>
								{#if adult.isPrimary}
									<span class="primary-badge">Primary</span>
								{/if}
								{#if adult.isCustom}
									<span class="custom-badge">Custom</span>
								{/if}
							</div>
							{#if adult.contactInfo}
								<p class="item-detail">{adult.contactInfo}</p>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty-state">No supportive adults selected.</p>
			{/if}
		</ReviewSection>

		<!-- Yellow Zone Help Methods Section -->
		<ReviewSection
			title="Yellow Zone Help Methods"
			badgeText="Yellow Zone"
			badgeColor="yellow"
			itemCount={totalHelpMethods}
			onEdit={() => onEditStep(4)}
		>
			{#if helpMethodDetails.length > 0}
				<ul class="review-list" role="list">
					{#each helpMethodDetails as method (method.id)}
						<li class="review-item">
							<div class="item-header">
								<span class="item-title">{method.title}</span>
								{#if method.isCustom}
									<span class="custom-badge">Custom</span>
								{/if}
							</div>
							{#if method.additionalInfo}
								<p class="item-detail">"{method.additionalInfo}"</p>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty-state">No help methods selected.</p>
			{/if}
		</ReviewSection>

		<!-- Red Zone Crisis Resources Section -->
		<ReviewSection
			title="Red Zone Crisis Resources"
			badgeText="Red Zone"
			badgeColor="red"
			itemCount={crisisResources.length}
			defaultExpanded={true}
		>
			{#if crisisResources.length > 0}
				<ul class="review-list" role="list">
					{#each crisisResources as resource (resource.id)}
						<li class="review-item">
							<div class="item-header">
								<span class="item-title">{resource.name}</span>
								{#if resource.contact_type}
									<span class="item-category"
										>{resource.contact_type === 'phone'
											? 'Call'
											: resource.contact_type === 'text'
												? 'Text'
												: 'Website'}</span
									>
								{/if}
							</div>
							<p class="item-detail">{resource.contact}</p>
							{#if resource.description}
								<p class="item-description">{resource.description}</p>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty-state">No crisis resources available.</p>
			{/if}
			<p class="red-zone-note">
				These crisis resources are always available and cannot be modified.
			</p>
		</ReviewSection>
	</div>

	<div class="step-actions">
		<button type="button" class="btn btn-outline" onclick={onBack} disabled={isSubmitting}>
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
		<button
			type="button"
			class="btn btn-primary"
			onclick={onCreatePlan}
			disabled={isSubmitting}
			aria-describedby="create-plan-description"
		>
			{#if isSubmitting}
				<span class="spinner" aria-hidden="true"></span>
				Creating...
			{:else}
				Create Action Plan
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="btn-icon"
					aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
				</svg>
			{/if}
		</button>
	</div>
	<p id="create-plan-description" class="sr-only">
		This will save the action plan and generate an access token for the patient.
	</p>
</div>

<style>
	.review-step {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.step-header {
		text-align: center;
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

	.review-sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.reflective-questions {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.reflective-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.reflective-label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.reflective-value {
		font-size: var(--font-size-base);
		color: var(--color-text);
		margin: 0;
		padding: var(--space-2) var(--space-3);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
		font-style: italic;
	}

	.review-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.review-item {
		padding: var(--space-3);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
	}

	.item-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.item-title {
		font-weight: 500;
		color: var(--color-text);
	}

	.item-category {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		background-color: var(--color-gray-200);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
	}

	.custom-badge {
		font-size: var(--font-size-xs);
		color: var(--color-primary);
		background-color: rgba(0, 89, 76, 0.1);
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

	.item-detail {
		margin: var(--space-2) 0 0;
		font-size: var(--font-size-sm);
		color: var(--color-text);
	}

	.item-description {
		margin: var(--space-1) 0 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.empty-state {
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0;
	}

	.red-zone-note {
		margin-top: var(--space-3);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-style: italic;
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

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.btn-primary:hover:not(:disabled) {
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

	.btn-outline:hover:not(:disabled) {
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

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	@media (max-width: 640px) {
		.step-actions {
			flex-direction: column;
			gap: var(--space-3);
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
</style>
