<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { actionPlanDraft, type ActionPlanDraft } from '$lib/stores/actionPlanDraft';
	import type { SkillCategory } from '$lib/types/database';
	import StepIndicator from '$lib/components/plans/StepIndicator.svelte';
	import BasicInfoStep from '$lib/components/plans/BasicInfoStep.svelte';
	import GreenZoneSkillsStep from '$lib/components/plans/GreenZoneSkillsStep.svelte';
	import SupportiveAdultsStep from '$lib/components/plans/SupportiveAdultsStep.svelte';
	import YellowZoneStep from '$lib/components/plans/YellowZoneStep.svelte';
	import ReviewStep from '$lib/components/plans/ReviewStep.svelte';
	import type { EditPlanPageData } from './+page.server';

	let { data }: { data: EditPlanPageData } = $props();

	// State for submission
	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);
	let submitSuccess = $state(false);

	// State for token regeneration
	let showRegenerateModal = $state(false);
	let isRegenerating = $state(false);
	let regenerateError = $state<string | null>(null);
	let newToken = $state<{ token: string; expiresAt: string } | null>(null);

	// State for archive/unarchive
	let isArchiving = $state(false);
	let showArchiveModal = $state(false);

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

	// Initialize the store with existing data on mount
	onMount(() => {
		// Reset store first to clear any previous session data
		actionPlanDraft.reset();

		// Load existing data into the store
		const existing = data.existingData;

		// Set patient nickname
		actionPlanDraft.setPatientNickname(existing.patientNickname);

		// Set reflective questions
		actionPlanDraft.setHappyWhen(existing.happyWhen);
		actionPlanDraft.setHappyBecause(existing.happyBecause);

		// Set selected skills
		for (const skill of existing.selectedSkills) {
			actionPlanDraft.toggleSkill(skill.skillId);
			if (skill.fillInValue) {
				actionPlanDraft.setSkillFillIn(skill.skillId, skill.fillInValue);
			}
		}

		// Add custom skills
		for (const custom of existing.customSkills) {
			actionPlanDraft.addCustomSkill(custom.title, custom.category);
		}

		// Set selected supportive adults
		for (const adult of existing.selectedSupportiveAdults) {
			actionPlanDraft.toggleSupportiveAdult(adult.typeId);
			actionPlanDraft.setSupportiveAdultName(adult.typeId, adult.name);
			if (adult.contactInfo) {
				actionPlanDraft.setSupportiveAdultContactInfo(adult.typeId, adult.contactInfo);
			}
			if (adult.isPrimary) {
				actionPlanDraft.setSupportiveAdultPrimary(adult.typeId, null);
			}
		}

		// Add custom supportive adults
		for (const custom of existing.customSupportiveAdults) {
			const id = actionPlanDraft.addCustomSupportiveAdult(custom.label, custom.name);
			if (custom.contactInfo) {
				actionPlanDraft.updateCustomSupportiveAdult(id, { contactInfo: custom.contactInfo });
			}
			if (custom.isPrimary) {
				actionPlanDraft.setSupportiveAdultPrimary(null, id);
			}
		}

		// Set selected help methods
		for (const method of existing.selectedHelpMethods) {
			actionPlanDraft.toggleHelpMethod(method.helpMethodId);
			if (method.additionalInfo) {
				actionPlanDraft.setHelpMethodAdditionalInfo(method.helpMethodId, method.additionalInfo);
			}
		}

		// Add custom help methods
		for (const custom of existing.customHelpMethods) {
			actionPlanDraft.addCustomHelpMethod(custom.title, custom.additionalInfo);
		}
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

	// Review step handlers
	function handleEditStep(step: number) {
		actionPlanDraft.setStep(step);
	}

	// Update action plan handler
	async function handleUpdatePlan() {
		isSubmitting = true;
		submitError = null;

		try {
			const formData = new FormData();
			formData.set(
				'draft',
				JSON.stringify({
					patientNickname: draft.patientNickname,
					selectedSkills: draft.selectedSkills,
					customSkills: draft.customSkills,
					happyWhen: draft.happyWhen,
					happyBecause: draft.happyBecause,
					selectedSupportiveAdults: draft.selectedSupportiveAdults,
					customSupportiveAdults: draft.customSupportiveAdults,
					selectedHelpMethods: draft.selectedHelpMethods,
					customHelpMethods: draft.customHelpMethods
				})
			);
			formData.set('updatedAt', data.updatedAt);

			const response = await fetch('?/updatePlan', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'failure') {
				submitError = result.data?.error || 'Failed to update action plan';
				return;
			}

			// Success - clear the draft and redirect
			actionPlanDraft.reset();
			submitSuccess = true;

			// Redirect to detail view after a brief delay
			setTimeout(() => {
				goto(`/provider/plans/${data.planId}`);
			}, 1500);
		} catch (error) {
			console.error('Error updating action plan:', error);
			submitError = 'An unexpected error occurred. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	// Token regeneration handlers
	function handleOpenRegenerateModal() {
		showRegenerateModal = true;
		regenerateError = null;
	}

	function handleCloseRegenerateModal() {
		showRegenerateModal = false;
		regenerateError = null;
	}

	async function handleRegenerateToken() {
		isRegenerating = true;
		regenerateError = null;

		try {
			const formData = new FormData();
			const response = await fetch('?/regenerateToken', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'failure') {
				regenerateError = result.data?.error || 'Failed to generate new link';
				return;
			}

			// Success - update token display
			newToken = {
				token: result.data.token,
				expiresAt: result.data.expiresAt
			};
			showRegenerateModal = false;
		} catch (error) {
			console.error('Error regenerating token:', error);
			regenerateError = 'An unexpected error occurred. Please try again.';
		} finally {
			isRegenerating = false;
		}
	}

	// Archive handlers
	function handleOpenArchiveModal() {
		showArchiveModal = true;
	}

	function handleCloseArchiveModal() {
		showArchiveModal = false;
	}

	async function handleArchive() {
		isArchiving = true;

		try {
			const formData = new FormData();
			const response = await fetch('?/archive', {
				method: 'POST',
				body: formData
			});

			// The action redirects on success, so we only handle failure
			const result = await response.json();
			if (result.type === 'failure') {
				submitError = result.data?.error || 'Failed to archive action plan';
			}
		} catch (error) {
			console.error('Error archiving action plan:', error);
			submitError = 'An unexpected error occurred. Please try again.';
		} finally {
			isArchiving = false;
			showArchiveModal = false;
		}
	}

	async function handleUnarchive() {
		isArchiving = true;

		try {
			const formData = new FormData();
			const response = await fetch('?/unarchive', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			if (result.type === 'failure') {
				submitError = result.data?.error || 'Failed to unarchive action plan';
			} else {
				// Refresh the page to show updated status
				window.location.reload();
			}
		} catch (error) {
			console.error('Error unarchiving action plan:', error);
			submitError = 'An unexpected error occurred. Please try again.';
		} finally {
			isArchiving = false;
		}
	}

	function handleCancel() {
		actionPlanDraft.reset();
		goto(`/provider/plans/${data.planId}`);
	}

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	// Get the current active token (either from data or newly generated)
	const currentToken = $derived(newToken || data.activeToken);
</script>

<svelte:head>
	<title>Edit Action Plan | Well-Being Action Plan</title>
</svelte:head>

<main class="wizard-page">
	<div class="wizard-container">
		{#if submitSuccess}
			<!-- Success message -->
			<div class="success-container">
				<div class="success-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
					</svg>
				</div>
				<h2>Action Plan Updated!</h2>
				<p>Your changes have been saved successfully.</p>
				<p class="redirect-message">Redirecting to plan details...</p>
			</div>
		{:else}
			<!-- Header with status and actions -->
			<header class="edit-header">
				<div class="header-left">
					<a href="/provider/plans/{data.planId}" class="back-link">
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
						Back to Plan
					</a>
					<h1>Edit Action Plan</h1>
					<span class="status-badge status-{data.status}">
						{data.status.charAt(0).toUpperCase() + data.status.slice(1)}
					</span>
				</div>
				<div class="header-actions">
					{#if data.status !== 'archived'}
						<button
							type="button"
							class="btn btn-outline btn-sm"
							onclick={handleOpenRegenerateModal}
						>
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
							Regenerate Link
						</button>
						<button
							type="button"
							class="btn btn-danger-outline btn-sm"
							onclick={handleOpenArchiveModal}
						>
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
						</button>
					{:else}
						<button
							type="button"
							class="btn btn-outline btn-sm"
							onclick={handleUnarchive}
							disabled={isArchiving}
						>
							{#if isArchiving}
								<span class="spinner" aria-hidden="true"></span>
								Unarchiving...
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
										d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0 3-3m-3 3-3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
									/>
								</svg>
								Unarchive
							{/if}
						</button>
					{/if}
				</div>
			</header>

			<!-- Token info banner -->
			{#if currentToken}
				<div class="token-banner">
					<div class="token-info">
						<span class="token-label">Current Access Code:</span>
						<code class="token-code">{currentToken.token}</code>
						<span class="token-expires">Expires {formatDate(currentToken.expiresAt)}</span>
					</div>
				</div>
			{/if}

			<StepIndicator currentStep={draft.currentStep} {steps} />

			<div class="wizard-content">
				{#if submitError}
					<div class="error-banner" role="alert">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="error-icon"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
							/>
						</svg>
						<p>{submitError}</p>
						<button
							type="button"
							class="dismiss-btn"
							onclick={() => (submitError = null)}
							aria-label="Dismiss error"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/if}

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
				{:else if draft.currentStep === 5}
					<ReviewStep
						patientNickname={draft.patientNickname}
						skills={data.skills}
						selectedSkills={draft.selectedSkills}
						customSkills={draft.customSkills}
						happyWhen={draft.happyWhen}
						happyBecause={draft.happyBecause}
						supportiveAdultTypes={data.supportiveAdultTypes}
						selectedSupportiveAdults={draft.selectedSupportiveAdults}
						customSupportiveAdults={draft.customSupportiveAdults}
						helpMethods={data.helpMethods}
						selectedHelpMethods={draft.selectedHelpMethods}
						customHelpMethods={draft.customHelpMethods}
						crisisResources={data.crisisResources}
						{isSubmitting}
						onBack={handlePrevStep}
						onEditStep={handleEditStep}
						onCreatePlan={handleUpdatePlan}
						submitButtonText="Save Changes"
					/>
					<div class="edit-cancel-action">
						<button
							type="button"
							class="btn btn-text"
							onclick={handleCancel}
							disabled={isSubmitting}
						>
							Cancel changes
						</button>
					</div>
				{:else}
					<div class="placeholder-step">
						<h2>Step Not Found</h2>
						<p>Step {draft.currentStep} is not recognized.</p>
						<div class="placeholder-actions">
							<button type="button" class="btn btn-outline" onclick={handlePrevStep}> Back </button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</main>

<!-- Regenerate Token Modal -->
{#if showRegenerateModal}
	<div
		class="modal-overlay"
		onclick={handleCloseRegenerateModal}
		onkeydown={(e) => e.key === 'Escape' && handleCloseRegenerateModal()}
		role="button"
		tabindex="0"
	>
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && handleCloseRegenerateModal()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="regenerate-modal-title"
			tabindex="-1"
		>
			<h2 id="regenerate-modal-title">Regenerate Access Link?</h2>
			<div class="modal-warning">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="warning-icon"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
					/>
				</svg>
				<p>
					<strong>Warning:</strong> This will invalidate the previous access link. Anyone who has the
					old link will no longer be able to use it to access the action plan.
				</p>
			</div>
			{#if regenerateError}
				<div class="modal-error" role="alert">
					{regenerateError}
				</div>
			{/if}
			<div class="modal-actions">
				<button
					type="button"
					class="btn btn-outline"
					onclick={handleCloseRegenerateModal}
					disabled={isRegenerating}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={handleRegenerateToken}
					disabled={isRegenerating}
				>
					{#if isRegenerating}
						<span class="spinner" aria-hidden="true"></span>
						Generating...
					{:else}
						Generate New Link
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Archive Confirmation Modal -->
{#if showArchiveModal}
	<div
		class="modal-overlay"
		onclick={handleCloseArchiveModal}
		onkeydown={(e) => e.key === 'Escape' && handleCloseArchiveModal()}
		role="button"
		tabindex="0"
	>
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && handleCloseArchiveModal()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="archive-modal-title"
			tabindex="-1"
		>
			<h2 id="archive-modal-title">Archive Action Plan?</h2>
			<p>
				Archiving this plan will hide it from your active plans list. The plan data will be
				preserved and can be unarchived later.
			</p>
			<div class="modal-actions">
				<button
					type="button"
					class="btn btn-outline"
					onclick={handleCloseArchiveModal}
					disabled={isArchiving}
				>
					Cancel
				</button>
				<button type="button" class="btn btn-danger" onclick={handleArchive} disabled={isArchiving}>
					{#if isArchiving}
						<span class="spinner" aria-hidden="true"></span>
						Archiving...
					{:else}
						Archive Plan
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

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

	.edit-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-4);
		padding: var(--space-6);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
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

	.back-icon {
		width: 1rem;
		height: 1rem;
	}

	.header-left h1 {
		margin: 0;
		font-size: var(--font-size-xl);
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
		width: fit-content;
	}

	.status-active {
		background-color: #dcfce7;
		color: #166534;
	}

	.status-draft {
		background-color: #fef9c3;
		color: #854d0e;
	}

	.status-archived {
		background-color: var(--color-gray-100);
		color: var(--color-text-muted);
	}

	.header-actions {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.token-banner {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-6);
		background-color: var(--color-gray-50);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.token-info {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}

	.token-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.token-code {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		background-color: var(--color-white);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-gray-200);
	}

	.token-expires {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.wizard-content {
		padding: var(--space-8);
	}

	.success-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-12);
		text-align: center;
	}

	.success-icon {
		width: 4rem;
		height: 4rem;
		background-color: #dcfce7;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--space-4);
	}

	.success-icon svg {
		width: 2rem;
		height: 2rem;
		color: #166534;
	}

	.success-container h2 {
		margin: 0 0 var(--space-2);
		color: var(--color-text);
	}

	.success-container p {
		margin: 0;
		color: var(--color-text-muted);
	}

	.redirect-message {
		margin-top: var(--space-4) !important;
		font-size: var(--font-size-sm);
		font-style: italic;
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

	.edit-cancel-action {
		display: flex;
		justify-content: center;
		margin-top: var(--space-4);
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

	.btn-sm {
		padding: var(--space-2) var(--space-3);
		font-size: var(--font-size-sm);
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-text);
		border: 1px solid var(--color-gray-300);
	}

	.btn-outline:hover:not(:disabled) {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.btn-outline:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
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

	.btn-danger-outline {
		background-color: transparent;
		color: #b91c1c;
		border: 1px solid #b91c1c;
	}

	.btn-danger-outline:hover:not(:disabled) {
		background-color: #b91c1c;
		color: var(--color-white);
	}

	.btn-danger {
		background-color: #b91c1c;
		color: var(--color-white);
	}

	.btn-danger:hover:not(:disabled) {
		background-color: #991b1b;
	}

	.btn-text {
		background-color: transparent;
		color: var(--color-text-muted);
		padding: var(--space-2);
	}

	.btn-text:hover:not(:disabled) {
		color: var(--color-text);
		text-decoration: underline;
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

	.error-banner {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-6);
		color: #b91c1c;
	}

	.error-banner p {
		flex: 1;
		margin: 0;
		font-size: var(--font-size-sm);
	}

	.error-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}

	.dismiss-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: #b91c1c;
		flex-shrink: 0;
	}

	.dismiss-btn:hover {
		background-color: rgba(239, 68, 68, 0.1);
	}

	.dismiss-btn svg {
		width: 1rem;
		height: 1rem;
	}

	/* Modal styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: var(--space-4);
	}

	.modal-content {
		background-color: var(--color-white);
		border-radius: var(--radius-xl);
		padding: var(--space-6);
		max-width: 28rem;
		width: 100%;
		box-shadow: var(--shadow-xl);
	}

	.modal-content h2 {
		margin: 0 0 var(--space-4);
		font-size: var(--font-size-lg);
	}

	.modal-content p {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4);
	}

	.modal-warning {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-3);
		background-color: #fef9c3;
		border-radius: var(--radius-md);
		margin-bottom: var(--space-4);
	}

	.modal-warning p {
		margin: 0;
		font-size: var(--font-size-sm);
		color: #854d0e;
	}

	.warning-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		color: #ca8a04;
	}

	.modal-error {
		padding: var(--space-3);
		background-color: rgba(239, 68, 68, 0.1);
		border-radius: var(--radius-md);
		color: #b91c1c;
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-4);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
	}

	@media (max-width: 640px) {
		.wizard-page {
			padding: var(--space-4) var(--space-2);
		}

		.edit-header {
			flex-direction: column;
			padding: var(--space-4);
		}

		.header-actions {
			width: 100%;
		}

		.header-actions .btn {
			flex: 1;
		}

		.wizard-content {
			padding: var(--space-6) var(--space-4);
		}

		.token-banner {
			padding: var(--space-3) var(--space-4);
		}

		.modal-actions {
			flex-direction: column;
		}

		.modal-actions .btn {
			width: 100%;
		}
	}

	@media (pointer: coarse) {
		.btn {
			min-height: 44px;
		}
	}
</style>
