<script lang="ts">
	import { actionPlanDraft, type ActionPlanDraft } from '$lib/stores/actionPlanDraft';
	import type {
		Skill,
		SkillCategory,
		SupportiveAdultType,
		HelpMethod,
		CrisisResource
	} from '$lib/types/database';
	import StepIndicator from '$lib/components/plans/StepIndicator.svelte';
	import BasicInfoStep from '$lib/components/plans/BasicInfoStep.svelte';
	import GreenZoneSkillsStep from '$lib/components/plans/GreenZoneSkillsStep.svelte';
	import SupportiveAdultsStep from '$lib/components/plans/SupportiveAdultsStep.svelte';
	import YellowZoneStep from '$lib/components/plans/YellowZoneStep.svelte';

	interface PageData {
		skills: Skill[];
		supportiveAdultTypes: SupportiveAdultType[];
		helpMethods: HelpMethod[];
		crisisResources: CrisisResource[];
	}

	let { data }: { data: PageData } = $props();

	// Subscribe to the store for reactive updates
	let draft: ActionPlanDraft = $state({
		currentStep: 1,
		patientNickname: '',
		selectedSkills: [],
		customSkills: [],
		happyWhen: '',
		happyBecause: '',
		selectedSupportiveAdults: [],
		customSupportiveAdults: [],
		selectedHelpMethods: [],
		customHelpMethods: []
	});

	// Keep draft in sync with store
	$effect(() => {
		const unsubscribe = actionPlanDraft.subscribe((value) => {
			draft = value;
		});
		return unsubscribe;
	});

	// Define wizard steps
	const steps = [
		{ number: 1, label: 'Basic Info' },
		{ number: 2, label: 'Green Zone Skills' },
		{ number: 3, label: 'Supportive Adults' },
		{ number: 4, label: 'Help Methods' },
		{ number: 5, label: 'Review' }
	];

	// Step navigation handlers
	function handleNextStep() {
		actionPlanDraft.nextStep();
	}

	function handlePrevStep() {
		actionPlanDraft.prevStep();
	}

	// Basic info handlers
	function handleNicknameChange(value: string) {
		actionPlanDraft.setPatientNickname(value);
	}

	// Green zone handlers
	function handleToggleSkill(skillId: string) {
		actionPlanDraft.toggleSkill(skillId);
	}

	function handleSkillFillIn(skillId: string, value: string) {
		actionPlanDraft.setSkillFillIn(skillId, value);
	}

	function handleAddCustomSkill(title: string, category: SkillCategory) {
		actionPlanDraft.addCustomSkill(title, category);
	}

	function handleRemoveCustomSkill(customSkillId: string) {
		actionPlanDraft.removeCustomSkill(customSkillId);
	}

	function handleHappyWhenChange(value: string) {
		actionPlanDraft.setHappyWhen(value);
	}

	function handleHappyBecauseChange(value: string) {
		actionPlanDraft.setHappyBecause(value);
	}

	// Supportive adults handlers
	function handleToggleSupportiveAdult(typeId: string) {
		actionPlanDraft.toggleSupportiveAdult(typeId);
	}

	function handleSetSupportiveAdultName(typeId: string, name: string) {
		actionPlanDraft.setSupportiveAdultName(typeId, name);
	}

	function handleSetSupportiveAdultContactInfo(typeId: string, contactInfo: string) {
		actionPlanDraft.setSupportiveAdultContactInfo(typeId, contactInfo);
	}

	function handleSetSupportiveAdultPrimary(typeId: string | null, customId: string | null) {
		actionPlanDraft.setSupportiveAdultPrimary(typeId, customId);
	}

	function handleAddCustomSupportiveAdult(label: string, name: string) {
		actionPlanDraft.addCustomSupportiveAdult(label, name);
	}

	function handleUpdateCustomSupportiveAdult(
		customId: string,
		updates: { label?: string; name?: string; contactInfo?: string }
	) {
		actionPlanDraft.updateCustomSupportiveAdult(customId, updates);
	}

	function handleRemoveCustomSupportiveAdult(customId: string) {
		actionPlanDraft.removeCustomSupportiveAdult(customId);
	}

	// Yellow zone (help methods) handlers
	function handleToggleHelpMethod(helpMethodId: string) {
		actionPlanDraft.toggleHelpMethod(helpMethodId);
	}

	function handleSetHelpMethodAdditionalInfo(helpMethodId: string, additionalInfo: string) {
		actionPlanDraft.setHelpMethodAdditionalInfo(helpMethodId, additionalInfo);
	}

	function handleAddCustomHelpMethod(title: string) {
		actionPlanDraft.addCustomHelpMethod(title);
	}

	function handleUpdateCustomHelpMethod(
		customId: string,
		updates: { title?: string; additionalInfo?: string }
	) {
		actionPlanDraft.updateCustomHelpMethod(customId, updates);
	}

	function handleRemoveCustomHelpMethod(customId: string) {
		actionPlanDraft.removeCustomHelpMethod(customId);
	}
</script>

<svelte:head>
	<title>Create Action Plan | Well-Being Action Plan</title>
</svelte:head>

<main class="wizard-page">
	<div class="wizard-container">
		<StepIndicator currentStep={draft.currentStep} {steps} />

		<div class="wizard-content">
			{#if draft.currentStep === 1}
				<BasicInfoStep
					patientNickname={draft.patientNickname}
					onContinue={handleNextStep}
					onNicknameChange={handleNicknameChange}
				/>
			{:else if draft.currentStep === 2}
				<GreenZoneSkillsStep
					skills={data.skills}
					selectedSkills={draft.selectedSkills}
					customSkills={draft.customSkills}
					happyWhen={draft.happyWhen}
					happyBecause={draft.happyBecause}
					onBack={handlePrevStep}
					onContinue={handleNextStep}
					onToggleSkill={handleToggleSkill}
					onSkillFillIn={handleSkillFillIn}
					onAddCustomSkill={handleAddCustomSkill}
					onRemoveCustomSkill={handleRemoveCustomSkill}
					onHappyWhenChange={handleHappyWhenChange}
					onHappyBecauseChange={handleHappyBecauseChange}
				/>
			{:else if draft.currentStep === 3}
				<SupportiveAdultsStep
					supportiveAdultTypes={data.supportiveAdultTypes}
					selectedSupportiveAdults={draft.selectedSupportiveAdults}
					customSupportiveAdults={draft.customSupportiveAdults}
					onBack={handlePrevStep}
					onContinue={handleNextStep}
					onToggleSupportiveAdult={handleToggleSupportiveAdult}
					onSetName={handleSetSupportiveAdultName}
					onSetContactInfo={handleSetSupportiveAdultContactInfo}
					onSetPrimary={handleSetSupportiveAdultPrimary}
					onAddCustomSupportiveAdult={handleAddCustomSupportiveAdult}
					onUpdateCustomSupportiveAdult={handleUpdateCustomSupportiveAdult}
					onRemoveCustomSupportiveAdult={handleRemoveCustomSupportiveAdult}
				/>
			{:else if draft.currentStep === 4}
				<YellowZoneStep
					helpMethods={data.helpMethods}
					selectedHelpMethods={draft.selectedHelpMethods}
					customHelpMethods={draft.customHelpMethods}
					crisisResources={data.crisisResources}
					onBack={handlePrevStep}
					onContinue={handleNextStep}
					onToggleHelpMethod={handleToggleHelpMethod}
					onSetAdditionalInfo={handleSetHelpMethodAdditionalInfo}
					onAddCustomHelpMethod={handleAddCustomHelpMethod}
					onUpdateCustomHelpMethod={handleUpdateCustomHelpMethod}
					onRemoveCustomHelpMethod={handleRemoveCustomHelpMethod}
				/>
			{:else}
				<!-- Placeholder for future steps -->
				<div class="placeholder-step">
					<h2>Coming Soon</h2>
					<p>Step {draft.currentStep} is not yet implemented.</p>
					<div class="placeholder-actions">
						<button type="button" class="btn btn-outline" onclick={handlePrevStep}> Back </button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</main>

<style>
	.wizard-page {
		min-height: calc(100vh - var(--nav-height));
		background-color: var(--color-bg-subtle);
		padding: var(--space-6) var(--space-4);
	}

	.wizard-container {
		max-width: 56rem;
		margin: 0 auto;
		background-color: var(--color-white);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-md);
		overflow: hidden;
	}

	.wizard-content {
		padding: var(--space-8);
	}

	.placeholder-step {
		text-align: center;
		padding: var(--space-12) var(--space-4);
	}

	.placeholder-step h2 {
		margin-bottom: var(--space-2);
		color: var(--color-text-muted);
	}

	.placeholder-step p {
		color: var(--color-text-muted);
		margin-bottom: var(--space-6);
	}

	.placeholder-actions {
		display: flex;
		justify-content: center;
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

	@media (max-width: 640px) {
		.wizard-page {
			padding: var(--space-4) var(--space-2);
		}

		.wizard-content {
			padding: var(--space-6) var(--space-4);
		}
	}
</style>
