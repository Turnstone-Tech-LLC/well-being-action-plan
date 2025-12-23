<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { SvelteSet } from 'svelte/reactivity';
	import { REVISION_TOTAL_STEPS } from '$lib/stores/revisionDraft';
	import type { CheckInSummary } from '$lib/server/types';
	import type { SkillCategory } from '$lib/types/database';

	let { data }: { data: PageData } = $props();

	let currentStep = $state(1);
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	// Form state
	let checkInSummary = $state<CheckInSummary | null>(null);
	let whatWorkedNotes = $state('');
	let whatDidntWorkNotes = $state('');
	let revisionNotes = $state('');

	// Track skills to keep/remove - using SvelteSet for proper reactivity
	// Initialize with all existing skills as "to keep"
	const initialSkillIds = [
		...data.existingData.selectedSkills.map((s) => s.skillId),
		...data.existingData.customSkills.map((s) => s.id)
	];
	let skillsToKeep = new SvelteSet<string>(initialSkillIds);
	let skillsToRemove = new SvelteSet<string>();

	// Skills from library that can be added (not already selected)
	let addedLibrarySkills = new SvelteSet<string>();

	// New custom skills added during revision
	let newSkills = $state<Array<{ id: string; title: string; category: SkillCategory }>>([]);

	// Derived: removed skills list for Step 3
	let removedSkillsList = $derived(
		Array.from(skillsToRemove).map((skillId) => ({
			id: skillId,
			title: getSkillTitle(skillId)
		}))
	);

	// Derived: available library skills (not already in plan and not already added)
	let availableLibrarySkills = $derived(
		data.skills.filter(
			(skill) =>
				!data.existingData.selectedSkills.some((s) => s.skillId === skill.id) &&
				!addedLibrarySkills.has(skill.id)
		)
	);

	// Add skill form state
	let showAddSkillForm = $state(false);
	let newSkillTitle = $state('');
	let newSkillCategory = $state<SkillCategory>('mindfulness');

	// Editable copies of adults and methods
	let selectedSupportiveAdults = $state([...data.existingData.selectedSupportiveAdults]);
	let customSupportiveAdults = $state([...data.existingData.customSupportiveAdults]);
	let selectedHelpMethods = $state([...data.existingData.selectedHelpMethods]);
	let customHelpMethods = $state([...data.existingData.customHelpMethods]);

	// Add adult form state
	let showAddAdultForm = $state(false);
	let newAdultType = $state<'predefined' | 'custom'>('predefined');
	let newAdultTypeId = $state('');
	let newAdultCustomLabel = $state('');
	let newAdultName = $state('');
	let newAdultContactInfo = $state('');

	// Edit adult state
	let editingAdultId = $state<string | null>(null);
	let editingAdultName = $state('');
	let editingAdultContactInfo = $state('');

	// Add help method form state
	let showAddMethodForm = $state(false);
	let newMethodType = $state<'predefined' | 'custom'>('predefined');
	let newMethodId = $state('');
	let newMethodCustomTitle = $state('');
	let newMethodAdditionalInfo = $state('');

	// Edit method state
	let editingMethodId = $state<string | null>(null);
	let editingMethodAdditionalInfo = $state('');

	function nextStep(): void {
		if (currentStep < REVISION_TOTAL_STEPS) {
			currentStep++;
		}
	}

	function prevStep(): void {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	function toggleSkill(skillId: string): void {
		if (skillsToKeep.has(skillId)) {
			skillsToKeep.delete(skillId);
			skillsToRemove.add(skillId);
		} else {
			skillsToRemove.delete(skillId);
			skillsToKeep.add(skillId);
		}
	}

	function addLibrarySkill(skillId: string): void {
		addedLibrarySkills.add(skillId);
		skillsToKeep.add(skillId);
	}

	function removeLibrarySkill(skillId: string): void {
		addedLibrarySkills.delete(skillId);
		skillsToKeep.delete(skillId);
	}

	function getSkillTitle(skillId: string): string {
		// Check predefined skills
		const skill = data.skills.find((s) => s.id === skillId);
		if (skill) return skill.title;

		// Check selected skills with fill-in
		const selected = data.existingData.selectedSkills.find((s) => s.skillId === skillId);
		if (selected) {
			const refSkill = data.skills.find((s) => s.id === selected.skillId);
			return refSkill?.title || skillId;
		}

		// Check custom skills
		const custom = data.existingData.customSkills.find((s) => s.id === skillId);
		if (custom) return custom.title;

		// Check newly added skills
		const newSkill = newSkills.find((s) => s.id === skillId);
		if (newSkill) return newSkill.title;

		return skillId;
	}

	function addNewSkill(): void {
		if (!newSkillTitle.trim()) return;

		const id = `new-skill-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
		newSkills = [...newSkills, { id, title: newSkillTitle.trim(), category: newSkillCategory }];
		skillsToKeep.add(id);

		// Reset form
		newSkillTitle = '';
		newSkillCategory = 'mindfulness';
		showAddSkillForm = false;
	}

	function removeNewSkill(skillId: string): void {
		newSkills = newSkills.filter((s) => s.id !== skillId);
		skillsToKeep.delete(skillId);
	}

	function getCategoryLabel(category: SkillCategory | null): string {
		if (!category) return 'General';
		const labels: Record<string, string> = {
			physical: 'Physical',
			creative: 'Creative',
			social: 'Social',
			mindfulness: 'Mindfulness'
		};
		return labels[category] || category;
	}

	// Supportive Adults CRUD
	function addSupportiveAdult(): void {
		if (newAdultType === 'predefined') {
			if (!newAdultTypeId || !newAdultName.trim()) return;
			// Check if type already exists
			if (selectedSupportiveAdults.some((a) => a.typeId === newAdultTypeId)) {
				return; // Already exists
			}
			selectedSupportiveAdults = [
				...selectedSupportiveAdults,
				{
					typeId: newAdultTypeId,
					name: newAdultName.trim(),
					contactInfo: newAdultContactInfo.trim() || undefined,
					isPrimary: selectedSupportiveAdults.length === 0 && customSupportiveAdults.length === 0
				}
			];
		} else {
			if (!newAdultCustomLabel.trim() || !newAdultName.trim()) return;
			const id = `new-adult-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
			customSupportiveAdults = [
				...customSupportiveAdults,
				{
					id,
					label: newAdultCustomLabel.trim(),
					name: newAdultName.trim(),
					contactInfo: newAdultContactInfo.trim() || undefined,
					isPrimary: selectedSupportiveAdults.length === 0 && customSupportiveAdults.length === 0
				}
			];
		}

		// Reset form
		newAdultType = 'predefined';
		newAdultTypeId = '';
		newAdultCustomLabel = '';
		newAdultName = '';
		newAdultContactInfo = '';
		showAddAdultForm = false;
	}

	function startEditingAdult(typeId: string | null, customId: string | null): void {
		if (typeId) {
			const adult = selectedSupportiveAdults.find((a) => a.typeId === typeId);
			if (adult) {
				editingAdultId = `type-${typeId}`;
				editingAdultName = adult.name;
				editingAdultContactInfo = adult.contactInfo || '';
			}
		} else if (customId) {
			const adult = customSupportiveAdults.find((a) => a.id === customId);
			if (adult) {
				editingAdultId = `custom-${customId}`;
				editingAdultName = adult.name;
				editingAdultContactInfo = adult.contactInfo || '';
			}
		}
	}

	function saveEditingAdult(): void {
		if (!editingAdultId) return;

		if (editingAdultId.startsWith('type-')) {
			const typeId = editingAdultId.replace('type-', '');
			selectedSupportiveAdults = selectedSupportiveAdults.map((a) =>
				a.typeId === typeId
					? {
							...a,
							name: editingAdultName.trim(),
							contactInfo: editingAdultContactInfo.trim() || undefined
						}
					: a
			);
		} else if (editingAdultId.startsWith('custom-')) {
			const customId = editingAdultId.replace('custom-', '');
			customSupportiveAdults = customSupportiveAdults.map((a) =>
				a.id === customId
					? {
							...a,
							name: editingAdultName.trim(),
							contactInfo: editingAdultContactInfo.trim() || undefined
						}
					: a
			);
		}

		editingAdultId = null;
		editingAdultName = '';
		editingAdultContactInfo = '';
	}

	function cancelEditingAdult(): void {
		editingAdultId = null;
		editingAdultName = '';
		editingAdultContactInfo = '';
	}

	function toggleAdultPrimary(typeId: string | null, customId: string | null): void {
		selectedSupportiveAdults = selectedSupportiveAdults.map((a) => ({
			...a,
			isPrimary: a.typeId === typeId
		}));
		customSupportiveAdults = customSupportiveAdults.map((a) => ({
			...a,
			isPrimary: a.id === customId
		}));
	}

	// Help Methods CRUD
	function addHelpMethod(): void {
		if (newMethodType === 'predefined') {
			if (!newMethodId) return;
			// Check if method already exists
			if (selectedHelpMethods.some((m) => m.helpMethodId === newMethodId)) {
				return; // Already exists
			}
			selectedHelpMethods = [
				...selectedHelpMethods,
				{
					helpMethodId: newMethodId,
					additionalInfo: newMethodAdditionalInfo.trim() || undefined
				}
			];
		} else {
			if (!newMethodCustomTitle.trim()) return;
			const id = `new-method-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
			customHelpMethods = [
				...customHelpMethods,
				{
					id,
					title: newMethodCustomTitle.trim(),
					additionalInfo: newMethodAdditionalInfo.trim() || undefined
				}
			];
		}

		// Reset form
		newMethodType = 'predefined';
		newMethodId = '';
		newMethodCustomTitle = '';
		newMethodAdditionalInfo = '';
		showAddMethodForm = false;
	}

	function startEditingMethod(helpMethodId: string | null, customId: string | null): void {
		if (helpMethodId) {
			const method = selectedHelpMethods.find((m) => m.helpMethodId === helpMethodId);
			if (method) {
				editingMethodId = `method-${helpMethodId}`;
				editingMethodAdditionalInfo = method.additionalInfo || '';
			}
		} else if (customId) {
			const method = customHelpMethods.find((m) => m.id === customId);
			if (method) {
				editingMethodId = `custom-${customId}`;
				editingMethodAdditionalInfo = method.additionalInfo || '';
			}
		}
	}

	function saveEditingMethod(): void {
		if (!editingMethodId) return;

		if (editingMethodId.startsWith('method-')) {
			const methodId = editingMethodId.replace('method-', '');
			selectedHelpMethods = selectedHelpMethods.map((m) =>
				m.helpMethodId === methodId
					? { ...m, additionalInfo: editingMethodAdditionalInfo.trim() || undefined }
					: m
			);
		} else if (editingMethodId.startsWith('custom-')) {
			const customId = editingMethodId.replace('custom-', '');
			customHelpMethods = customHelpMethods.map((m) =>
				m.id === customId
					? { ...m, additionalInfo: editingMethodAdditionalInfo.trim() || undefined }
					: m
			);
		}

		editingMethodId = null;
		editingMethodAdditionalInfo = '';
	}

	function cancelEditingMethod(): void {
		editingMethodId = null;
		editingMethodAdditionalInfo = '';
	}

	function buildDraftData() {
		// Build the draft data from current state
		const keptSelectedSkills = data.existingData.selectedSkills.filter((s) =>
			skillsToKeep.has(s.skillId)
		);
		const keptCustomSkills = data.existingData.customSkills.filter((s) => skillsToKeep.has(s.id));

		// Include library skills added during revision as selected skills
		const librarySkillsToAdd = Array.from(addedLibrarySkills).map((skillId) => ({
			skillId,
			fillInValue: undefined
		}));
		const allSelectedSkills = [...keptSelectedSkills, ...librarySkillsToAdd];

		// Include newly added custom skills
		const allCustomSkills = [...keptCustomSkills, ...newSkills];

		return {
			patientNickname: data.existingData.patientNickname,
			happyWhen: data.existingData.happyWhen,
			happyBecause: data.existingData.happyBecause,
			selectedSkills: allSelectedSkills,
			customSkills: allCustomSkills,
			selectedSupportiveAdults,
			customSupportiveAdults,
			selectedHelpMethods,
			customHelpMethods
		};
	}

	const stepTitles = [
		'Check-In Summary',
		'What Worked',
		'What to Improve',
		'Supportive Adults',
		'Help Methods',
		'Review & Create'
	];
</script>

<svelte:head>
	<title>Create Revision - {data.existingData.patientNickname} - Well-Being Action Plan</title>
</svelte:head>

<div class="revise-page">
	<header class="page-header">
		<div class="header-content">
			<div class="header-top">
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
					Cancel
				</a>
			</div>

			<div class="header-main">
				<h1>Create Revision</h1>
				<p class="subtitle">
					{data.existingData.patientNickname} - Currently Version {data.currentVersion}
				</p>
			</div>
		</div>
	</header>

	<!-- Progress indicator -->
	<div class="progress-container">
		<div class="progress-bar">
			<div class="progress-fill" style="width: {(currentStep / REVISION_TOTAL_STEPS) * 100}%"></div>
		</div>
		<div class="step-indicators">
			{#each stepTitles as title, index}
				<div
					class="step-indicator"
					class:active={currentStep === index + 1}
					class:completed={currentStep > index + 1}
				>
					<span class="step-number">{index + 1}</span>
					<span class="step-title">{title}</span>
				</div>
			{/each}
		</div>
	</div>

	{#if errorMessage}
		<div class="error-message" role="alert">
			{errorMessage}
		</div>
	{/if}

	<div class="wizard-content">
		<!-- Step 1: Check-In Summary -->
		{#if currentStep === 1}
			<div class="step-content">
				<h2>Review Check-In Summary</h2>
				<p class="step-description">
					If you have the patient's check-in report (PDF export), you can import it here to review
					their progress since the last visit. This step is optional.
				</p>

				<div class="import-section">
					<div class="import-placeholder">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="import-icon"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
							/>
						</svg>
						<p>PDF import will be available in a future update.</p>
						<p class="import-hint">
							For now, you can review the printed report with the patient and proceed.
						</p>
					</div>
				</div>

				<div class="step-actions">
					<button type="button" class="btn btn-primary" onclick={nextStep}> Continue </button>
				</div>
			</div>
		{/if}

		<!-- Step 2: What Worked -->
		{#if currentStep === 2}
			<div class="step-content">
				<h2>What Worked?</h2>
				<p class="step-description">
					Review the current coping skills and identify which ones have been helpful. Toggle off any
					that should be removed from the revised plan, and add new skills that have been
					discovered.
				</p>

				<div class="skills-review">
					<h3>Current Coping Skills</h3>
					<div class="skills-list">
						{#each [...data.existingData.selectedSkills.map((s) => s.skillId), ...data.existingData.customSkills.map((s) => s.id)] as skillId}
							<label class="skill-toggle" class:removed={skillsToRemove.has(skillId)}>
								<input
									type="checkbox"
									checked={skillsToKeep.has(skillId)}
									onchange={() => toggleSkill(skillId)}
								/>
								<span class="skill-title">{getSkillTitle(skillId)}</span>
								<span class="skill-status">
									{skillsToKeep.has(skillId) ? 'Keep' : 'Remove'}
								</span>
							</label>
						{/each}
					</div>

					<!-- Newly added skills -->
					{#if newSkills.length > 0}
						<h4 class="new-items-heading">New Skills to Add</h4>
						<div class="skills-list">
							{#each newSkills as skill}
								<div class="new-item-card">
									<div class="new-item-info">
										<span class="new-item-title">{skill.title}</span>
										<span class="new-item-badge">{getCategoryLabel(skill.category)}</span>
									</div>
									<button type="button" class="remove-btn" onclick={() => removeNewSkill(skill.id)}>
										Remove
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Library skills that can be added -->
					{#if availableLibrarySkills.length > 0}
						<div class="library-skills-section">
							<h4 class="section-heading">Add from Skill Library</h4>
							<p class="section-hint">
								These are skills from the resource library that aren't currently in the plan.
							</p>
							<div class="library-skills-list">
								{#each availableLibrarySkills as skill}
									<button
										type="button"
										class="library-skill-item"
										onclick={() => addLibrarySkill(skill.id)}
									>
										<span class="library-skill-title">{skill.title}</span>
										<span class="library-skill-category">{getCategoryLabel(skill.category)}</span>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="2"
											stroke="currentColor"
											class="add-library-icon"
											aria-hidden="true"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M12 4.5v15m7.5-7.5h-15"
											/>
										</svg>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Skills added from library during this revision -->
					{#if addedLibrarySkills.size > 0}
						<h4 class="new-items-heading">Skills Added from Library</h4>
						<div class="skills-list">
							{#each Array.from(addedLibrarySkills) as skillId}
								{@const skill = data.skills.find((s) => s.id === skillId)}
								{#if skill}
									<div class="new-item-card library-added">
										<div class="new-item-info">
											<span class="new-item-title">{skill.title}</span>
											<span class="new-item-badge">{getCategoryLabel(skill.category)}</span>
										</div>
										<button
											type="button"
											class="remove-btn"
											onclick={() => removeLibrarySkill(skillId)}
										>
											Remove
										</button>
									</div>
								{/if}
							{/each}
						</div>
					{/if}

					<!-- Add new skill form -->
					{#if showAddSkillForm}
						<div class="add-form">
							<h4>Add Custom Skill</h4>
							<div class="form-row">
								<div class="form-field">
									<label for="new-skill-title">Skill Name</label>
									<input
										type="text"
										id="new-skill-title"
										bind:value={newSkillTitle}
										placeholder="e.g., Going for a walk"
									/>
								</div>
								<div class="form-field">
									<label for="new-skill-category">Category</label>
									<select id="new-skill-category" bind:value={newSkillCategory}>
										{#each data.categories as category}
											<option value={category}>{getCategoryLabel(category)}</option>
										{/each}
									</select>
								</div>
							</div>
							<div class="form-actions">
								<button
									type="button"
									class="btn btn-sm btn-outline"
									onclick={() => (showAddSkillForm = false)}
								>
									Cancel
								</button>
								<button
									type="button"
									class="btn btn-sm btn-primary"
									onclick={addNewSkill}
									disabled={!newSkillTitle.trim()}
								>
									Add Skill
								</button>
							</div>
						</div>
					{:else}
						<button type="button" class="add-btn" onclick={() => (showAddSkillForm = true)}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="add-icon"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
							</svg>
							Add Custom Skill
						</button>
					{/if}
				</div>

				<div class="notes-section">
					<label for="what-worked-notes">
						<strong>Notes: What worked well?</strong>
					</label>
					<textarea
						id="what-worked-notes"
						bind:value={whatWorkedNotes}
						rows="4"
						placeholder="Describe what strategies were particularly helpful..."
					></textarea>
				</div>

				<div class="step-actions">
					<button type="button" class="btn btn-outline" onclick={prevStep}> Back </button>
					<button type="button" class="btn btn-primary" onclick={nextStep}> Continue </button>
				</div>
			</div>
		{/if}

		<!-- Step 3: What Didn't Work -->
		{#if currentStep === 3}
			<div class="step-content">
				<h2>What Should We Improve?</h2>
				<p class="step-description">
					Review the strategies that weren't effective and capture notes about what could be
					improved.
				</p>

				<!-- Show removed skills from Step 2 -->
				{#if removedSkillsList.length > 0}
					<div class="removed-skills-section">
						<h3>Strategies Being Removed</h3>
						<p class="section-description">
							These skills were marked for removal in the previous step. Review them with the
							patient to understand why they weren't helpful.
						</p>
						<div class="removed-skills-list">
							{#each removedSkillsList as skill}
								<div class="removed-skill-item">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="2"
										stroke="currentColor"
										class="removed-icon"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
									</svg>
									<span>{skill.title}</span>
									<button type="button" class="restore-btn" onclick={() => toggleSkill(skill.id)}>
										Restore
									</button>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="no-removed-skills">
						<p>No skills have been marked for removal. All current strategies are being kept.</p>
					</div>
				{/if}

				<div class="notes-section">
					<label for="what-didnt-work-notes">
						<strong>Notes: What should change?</strong>
					</label>
					<textarea
						id="what-didnt-work-notes"
						bind:value={whatDidntWorkNotes}
						rows="6"
						placeholder="Were there situations where nothing on the plan helped? What strategies were tried but didn't work? Any patterns or triggers to note?"
					></textarea>
				</div>

				<div class="step-actions">
					<button type="button" class="btn btn-outline" onclick={prevStep}> Back </button>
					<button type="button" class="btn btn-primary" onclick={nextStep}> Continue </button>
				</div>
			</div>
		{/if}

		<!-- Step 4: Supportive Adults -->
		{#if currentStep === 4}
			<div class="step-content">
				<h2>Review Supportive Adults</h2>
				<p class="step-description">
					Review and update the patient's supportive adults. You can edit, remove, or add new
					adults.
				</p>

				<div class="adults-list">
					{#each selectedSupportiveAdults as adult, index}
						{@const isEditing = editingAdultId === `type-${adult.typeId}`}
						<div class="adult-card" class:editing={isEditing}>
							{#if isEditing}
								<div class="edit-form">
									<div class="form-field">
										<label for="edit-adult-name-{adult.typeId}">Name</label>
										<input
											type="text"
											id="edit-adult-name-{adult.typeId}"
											bind:value={editingAdultName}
										/>
									</div>
									<div class="form-field">
										<label for="edit-adult-contact-{adult.typeId}">Contact Info (optional)</label>
										<input
											type="text"
											id="edit-adult-contact-{adult.typeId}"
											bind:value={editingAdultContactInfo}
											placeholder="Phone, email, etc."
										/>
									</div>
									<div class="edit-actions">
										<button
											type="button"
											class="btn btn-sm btn-outline"
											onclick={cancelEditingAdult}>Cancel</button
										>
										<button type="button" class="btn btn-sm btn-primary" onclick={saveEditingAdult}
											>Save</button
										>
									</div>
								</div>
							{:else}
								<div class="adult-info">
									<span class="adult-type">
										{data.supportiveAdultTypes.find((t) => t.id === adult.typeId)?.label || 'Adult'}
									</span>
									<span class="adult-name">{adult.name}</span>
									{#if adult.contactInfo}
										<span class="adult-contact">{adult.contactInfo}</span>
									{/if}
									{#if adult.isPrimary}
										<span class="primary-badge">Primary Contact</span>
									{/if}
								</div>
								<div class="adult-actions">
									{#if !adult.isPrimary}
										<button
											type="button"
											class="action-btn"
											title="Set as primary contact"
											onclick={() => toggleAdultPrimary(adult.typeId, null)}
										>
											Set Primary
										</button>
									{/if}
									<button
										type="button"
										class="action-btn"
										onclick={() => startEditingAdult(adult.typeId, null)}
									>
										Edit
									</button>
									<button
										type="button"
										class="remove-btn"
										onclick={() => {
											selectedSupportiveAdults = selectedSupportiveAdults.filter(
												(_, i) => i !== index
											);
										}}
									>
										Remove
									</button>
								</div>
							{/if}
						</div>
					{/each}
					{#each customSupportiveAdults as adult, index}
						{@const isEditing = editingAdultId === `custom-${adult.id}`}
						<div class="adult-card" class:editing={isEditing}>
							{#if isEditing}
								<div class="edit-form">
									<div class="form-field">
										<label for="edit-custom-adult-name-{adult.id}">Name</label>
										<input
											type="text"
											id="edit-custom-adult-name-{adult.id}"
											bind:value={editingAdultName}
										/>
									</div>
									<div class="form-field">
										<label for="edit-custom-adult-contact-{adult.id}">Contact Info (optional)</label
										>
										<input
											type="text"
											id="edit-custom-adult-contact-{adult.id}"
											bind:value={editingAdultContactInfo}
											placeholder="Phone, email, etc."
										/>
									</div>
									<div class="edit-actions">
										<button
											type="button"
											class="btn btn-sm btn-outline"
											onclick={cancelEditingAdult}>Cancel</button
										>
										<button type="button" class="btn btn-sm btn-primary" onclick={saveEditingAdult}
											>Save</button
										>
									</div>
								</div>
							{:else}
								<div class="adult-info">
									<span class="adult-type">{adult.label}</span>
									<span class="adult-name">{adult.name}</span>
									{#if adult.contactInfo}
										<span class="adult-contact">{adult.contactInfo}</span>
									{/if}
									{#if adult.isPrimary}
										<span class="primary-badge">Primary Contact</span>
									{/if}
								</div>
								<div class="adult-actions">
									{#if !adult.isPrimary}
										<button
											type="button"
											class="action-btn"
											title="Set as primary contact"
											onclick={() => toggleAdultPrimary(null, adult.id)}
										>
											Set Primary
										</button>
									{/if}
									<button
										type="button"
										class="action-btn"
										onclick={() => startEditingAdult(null, adult.id)}
									>
										Edit
									</button>
									<button
										type="button"
										class="remove-btn"
										onclick={() => {
											customSupportiveAdults = customSupportiveAdults.filter((_, i) => i !== index);
										}}
									>
										Remove
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Add new adult form -->
				{#if showAddAdultForm}
					<div class="add-form">
						<h4>Add Supportive Adult</h4>
						<fieldset class="form-row">
							<legend class="sr-only">Adult Type Selection</legend>
							<div class="form-field">
								<span class="field-label">Type</span>
								<div class="radio-group">
									<label class="radio-label">
										<input type="radio" bind:group={newAdultType} value="predefined" />
										Choose from list
									</label>
									<label class="radio-label">
										<input type="radio" bind:group={newAdultType} value="custom" />
										Custom type
									</label>
								</div>
							</div>
						</fieldset>
						<div class="form-row">
							{#if newAdultType === 'predefined'}
								<div class="form-field">
									<label for="new-adult-type">Adult Type</label>
									<select id="new-adult-type" bind:value={newAdultTypeId}>
										<option value="">Select a type...</option>
										{#each data.supportiveAdultTypes.filter((t) => !selectedSupportiveAdults.some((a) => a.typeId === t.id)) as adultType}
											<option value={adultType.id}>{adultType.label}</option>
										{/each}
									</select>
								</div>
							{:else}
								<div class="form-field">
									<label for="new-adult-label">Custom Type</label>
									<input
										type="text"
										id="new-adult-label"
										bind:value={newAdultCustomLabel}
										placeholder="e.g., Coach, Mentor, Neighbor"
									/>
								</div>
							{/if}
							<div class="form-field">
								<label for="new-adult-name">Name</label>
								<input
									type="text"
									id="new-adult-name"
									bind:value={newAdultName}
									placeholder="Adult's name"
								/>
							</div>
						</div>
						<div class="form-row">
							<div class="form-field full-width">
								<label for="new-adult-contact">Contact Info (optional)</label>
								<input
									type="text"
									id="new-adult-contact"
									bind:value={newAdultContactInfo}
									placeholder="Phone number, email, etc."
								/>
							</div>
						</div>
						<div class="form-actions">
							<button
								type="button"
								class="btn btn-sm btn-outline"
								onclick={() => (showAddAdultForm = false)}
							>
								Cancel
							</button>
							<button
								type="button"
								class="btn btn-sm btn-primary"
								onclick={addSupportiveAdult}
								disabled={(newAdultType === 'predefined' && !newAdultTypeId) ||
									(newAdultType === 'custom' && !newAdultCustomLabel.trim()) ||
									!newAdultName.trim()}
							>
								Add Adult
							</button>
						</div>
					</div>
				{:else}
					<button type="button" class="add-btn" onclick={() => (showAddAdultForm = true)}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="add-icon"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
						Add Supportive Adult
					</button>
				{/if}

				<div class="step-actions">
					<button type="button" class="btn btn-outline" onclick={prevStep}> Back </button>
					<button type="button" class="btn btn-primary" onclick={nextStep}> Continue </button>
				</div>
			</div>
		{/if}

		<!-- Step 5: Help Methods -->
		{#if currentStep === 5}
			<div class="step-content">
				<h2>Review Help Methods</h2>
				<p class="step-description">
					Review and update the Yellow Zone help methods. You can edit, remove, or add new methods.
				</p>

				<div class="methods-list">
					{#each selectedHelpMethods as method, index}
						{@const isEditing = editingMethodId === `method-${method.helpMethodId}`}
						<div class="method-card" class:editing={isEditing}>
							{#if isEditing}
								<div class="edit-form">
									<div class="form-field full-width">
										<label for="edit-method-info-{method.helpMethodId}"
											>Additional Details (optional)</label
										>
										<input
											type="text"
											id="edit-method-info-{method.helpMethodId}"
											bind:value={editingMethodAdditionalInfo}
											placeholder="Specific details about this method..."
										/>
									</div>
									<div class="edit-actions">
										<button
											type="button"
											class="btn btn-sm btn-outline"
											onclick={cancelEditingMethod}>Cancel</button
										>
										<button type="button" class="btn btn-sm btn-primary" onclick={saveEditingMethod}
											>Save</button
										>
									</div>
								</div>
							{:else}
								<div class="method-info">
									<span class="method-title">
										{data.helpMethods.find((m) => m.id === method.helpMethodId)?.title ||
											'Help Method'}
									</span>
									{#if method.additionalInfo}
										<span class="method-detail">{method.additionalInfo}</span>
									{/if}
								</div>
								<div class="method-actions">
									<button
										type="button"
										class="action-btn"
										onclick={() => startEditingMethod(method.helpMethodId, null)}
									>
										Edit
									</button>
									<button
										type="button"
										class="remove-btn"
										onclick={() => {
											selectedHelpMethods = selectedHelpMethods.filter((_, i) => i !== index);
										}}
									>
										Remove
									</button>
								</div>
							{/if}
						</div>
					{/each}
					{#each customHelpMethods as method, index}
						{@const isEditing = editingMethodId === `custom-${method.id}`}
						<div class="method-card" class:editing={isEditing}>
							{#if isEditing}
								<div class="edit-form">
									<div class="form-field full-width">
										<label for="edit-custom-method-info-{method.id}"
											>Additional Details (optional)</label
										>
										<input
											type="text"
											id="edit-custom-method-info-{method.id}"
											bind:value={editingMethodAdditionalInfo}
											placeholder="Specific details about this method..."
										/>
									</div>
									<div class="edit-actions">
										<button
											type="button"
											class="btn btn-sm btn-outline"
											onclick={cancelEditingMethod}>Cancel</button
										>
										<button type="button" class="btn btn-sm btn-primary" onclick={saveEditingMethod}
											>Save</button
										>
									</div>
								</div>
							{:else}
								<div class="method-info">
									<span class="method-title">{method.title}</span>
									{#if method.additionalInfo}
										<span class="method-detail">{method.additionalInfo}</span>
									{/if}
								</div>
								<div class="method-actions">
									<button
										type="button"
										class="action-btn"
										onclick={() => startEditingMethod(null, method.id)}
									>
										Edit
									</button>
									<button
										type="button"
										class="remove-btn"
										onclick={() => {
											customHelpMethods = customHelpMethods.filter((_, i) => i !== index);
										}}
									>
										Remove
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Add new method form -->
				{#if showAddMethodForm}
					<div class="add-form">
						<h4>Add Help Method</h4>
						<fieldset class="form-row">
							<legend class="sr-only">Method Type Selection</legend>
							<div class="form-field">
								<span class="field-label">Type</span>
								<div class="radio-group">
									<label class="radio-label">
										<input type="radio" bind:group={newMethodType} value="predefined" />
										Choose from list
									</label>
									<label class="radio-label">
										<input type="radio" bind:group={newMethodType} value="custom" />
										Custom method
									</label>
								</div>
							</div>
						</fieldset>
						<div class="form-row">
							{#if newMethodType === 'predefined'}
								<div class="form-field">
									<label for="new-method-id">Help Method</label>
									<select id="new-method-id" bind:value={newMethodId}>
										<option value="">Select a method...</option>
										{#each data.helpMethods.filter((m) => !selectedHelpMethods.some((sm) => sm.helpMethodId === m.id)) as helpMethod}
											<option value={helpMethod.id}>{helpMethod.title}</option>
										{/each}
									</select>
								</div>
							{:else}
								<div class="form-field">
									<label for="new-method-title">Method Title</label>
									<input
										type="text"
										id="new-method-title"
										bind:value={newMethodCustomTitle}
										placeholder="e.g., Talk to school counselor"
									/>
								</div>
							{/if}
						</div>
						<div class="form-row">
							<div class="form-field full-width">
								<label for="new-method-info">Additional Details (optional)</label>
								<input
									type="text"
									id="new-method-info"
									bind:value={newMethodAdditionalInfo}
									placeholder="Specific details or instructions..."
								/>
							</div>
						</div>
						<div class="form-actions">
							<button
								type="button"
								class="btn btn-sm btn-outline"
								onclick={() => (showAddMethodForm = false)}
							>
								Cancel
							</button>
							<button
								type="button"
								class="btn btn-sm btn-primary"
								onclick={addHelpMethod}
								disabled={(newMethodType === 'predefined' && !newMethodId) ||
									(newMethodType === 'custom' && !newMethodCustomTitle.trim())}
							>
								Add Method
							</button>
						</div>
					</div>
				{:else}
					<button type="button" class="add-btn" onclick={() => (showAddMethodForm = true)}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="add-icon"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
						Add Help Method
					</button>
				{/if}

				<div class="step-actions">
					<button type="button" class="btn btn-outline" onclick={prevStep}> Back </button>
					<button type="button" class="btn btn-primary" onclick={nextStep}> Continue </button>
				</div>
			</div>
		{/if}

		<!-- Step 6: Review & Create -->
		{#if currentStep === 6}
			<div class="step-content">
				<h2>Review & Create Revision</h2>
				<p class="step-description">
					Review the changes and add any final notes for this revision.
				</p>

				<div class="review-summary">
					<div class="summary-section">
						<h3>Skills</h3>
						<p>
							<strong>{skillsToKeep.size}</strong> skills kept,
							<strong>{skillsToRemove.size}</strong> removed
							{#if addedLibrarySkills.size > 0}
								, <strong>{addedLibrarySkills.size}</strong> added from library
							{/if}
							{#if newSkills.length > 0}
								, <strong>{newSkills.length}</strong> custom
							{/if}
						</p>
					</div>

					<div class="summary-section">
						<h3>Supportive Adults</h3>
						<p>
							<strong>{selectedSupportiveAdults.length + customSupportiveAdults.length}</strong> adults
						</p>
					</div>

					<div class="summary-section">
						<h3>Help Methods</h3>
						<p>
							<strong>{selectedHelpMethods.length + customHelpMethods.length}</strong> methods
						</p>
					</div>

					{#if whatWorkedNotes}
						<div class="summary-section">
							<h3>What Worked</h3>
							<p class="notes-preview">{whatWorkedNotes}</p>
						</div>
					{/if}

					{#if whatDidntWorkNotes}
						<div class="summary-section">
							<h3>What to Improve</h3>
							<p class="notes-preview">{whatDidntWorkNotes}</p>
						</div>
					{/if}
				</div>

				<div class="notes-section">
					<label for="revision-notes">
						<strong>Revision Summary</strong>
						<span class="label-hint"
							>This will be visible to the patient when they update their plan.</span
						>
					</label>
					<textarea
						id="revision-notes"
						bind:value={revisionNotes}
						rows="3"
						placeholder="Brief summary of what changed in this revision..."
					></textarea>
				</div>

				<form
					method="POST"
					action="?/createRevision"
					use:enhance={() => {
						isSubmitting = true;
						errorMessage = null;
						return async ({ result }) => {
							isSubmitting = false;
							if (result.type === 'failure') {
								const data = result.data as { error?: string } | undefined;
								errorMessage = data?.error || 'Failed to create revision';
							}
						};
					}}
				>
					<input type="hidden" name="draft" value={JSON.stringify(buildDraftData())} />
					<input type="hidden" name="revisionNotes" value={revisionNotes} />
					<input type="hidden" name="whatWorkedNotes" value={whatWorkedNotes} />
					<input type="hidden" name="whatDidntWorkNotes" value={whatDidntWorkNotes} />
					{#if checkInSummary}
						<input type="hidden" name="checkInSummary" value={JSON.stringify(checkInSummary)} />
					{/if}

					<div class="step-actions">
						<button
							type="button"
							class="btn btn-outline"
							onclick={prevStep}
							disabled={isSubmitting}
						>
							Back
						</button>
						<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
							{#if isSubmitting}
								<span class="spinner" aria-hidden="true"></span>
								Creating Revision...
							{:else}
								Create Revision (Version {data.currentVersion + 1})
							{/if}
						</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
</div>

<style>
	.revise-page {
		max-width: 48rem;
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

	.back-icon {
		width: 1rem;
		height: 1rem;
	}

	.header-main h1 {
		margin: 0;
		font-size: var(--font-size-2xl);
		color: var(--color-text);
	}

	.subtitle {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 0;
	}

	/* Progress bar */
	.progress-container {
		margin-bottom: var(--space-6);
	}

	.progress-bar {
		height: 4px;
		background-color: var(--color-gray-200);
		border-radius: var(--radius-full);
		overflow: hidden;
		margin-bottom: var(--space-4);
	}

	.progress-fill {
		height: 100%;
		background-color: var(--color-primary);
		transition: width 0.3s ease;
	}

	.step-indicators {
		display: flex;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.step-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		flex: 1;
		text-align: center;
	}

	.step-number {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: var(--color-gray-200);
		color: var(--color-text-muted);
		font-size: var(--font-size-xs);
		font-weight: 600;
	}

	.step-indicator.active .step-number {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.step-indicator.completed .step-number {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.step-title {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		display: none;
	}

	@media (min-width: 640px) {
		.step-title {
			display: block;
		}
	}

	/* Wizard content */
	.wizard-content {
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-xl);
		padding: var(--space-6);
	}

	.step-content h2 {
		margin: 0 0 var(--space-2);
		font-size: var(--font-size-xl);
	}

	.step-description {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-6);
	}

	/* Import section */
	.import-section {
		margin-bottom: var(--space-6);
	}

	.import-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-8);
		background-color: var(--color-gray-50);
		border: 2px dashed var(--color-gray-300);
		border-radius: var(--radius-lg);
		text-align: center;
	}

	.import-icon {
		width: 3rem;
		height: 3rem;
		color: var(--color-text-muted);
		margin-bottom: var(--space-4);
	}

	.import-placeholder p {
		margin: 0;
		color: var(--color-text-muted);
	}

	.import-hint {
		font-size: var(--font-size-sm);
		margin-top: var(--space-2) !important;
	}

	/* Skills review */
	.skills-review {
		margin-bottom: var(--space-6);
	}

	.skills-review h3 {
		margin: 0 0 var(--space-3);
		font-size: var(--font-size-lg);
	}

	.skills-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.skill-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.skill-toggle:hover {
		background-color: var(--color-gray-100);
	}

	.skill-toggle.removed {
		background-color: rgba(239, 68, 68, 0.1);
		text-decoration: line-through;
		color: var(--color-text-muted);
	}

	.skill-toggle input {
		width: 1.25rem;
		height: 1.25rem;
	}

	.skill-title {
		flex: 1;
	}

	.skill-status {
		font-size: var(--font-size-xs);
		font-weight: 500;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		background-color: #dcfce7;
		color: #166534;
	}

	.skill-toggle.removed .skill-status {
		background-color: #fee2e2;
		color: #991b1b;
	}

	/* Notes section */
	.notes-section {
		margin-bottom: var(--space-6);
	}

	.notes-section label {
		display: block;
		margin-bottom: var(--space-2);
	}

	.label-hint {
		display: block;
		font-weight: normal;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-top: var(--space-1);
	}

	.notes-section textarea {
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-family: inherit;
		font-size: var(--font-size-base);
		resize: vertical;
	}

	.notes-section textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	/* Adults and methods lists */
	.adults-list,
	.methods-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.adult-card,
	.method-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
	}

	.adult-info,
	.method-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.adult-type,
	.method-title {
		font-weight: 500;
	}

	.adult-name,
	.method-detail {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.primary-badge {
		display: inline-flex;
		padding: var(--space-1) var(--space-2);
		background-color: var(--color-primary);
		color: var(--color-white);
		font-size: var(--font-size-xs);
		font-weight: 500;
		border-radius: var(--radius-sm);
		margin-top: var(--space-1);
		width: fit-content;
	}

	.remove-btn {
		padding: var(--space-1) var(--space-2);
		background-color: transparent;
		color: #b91c1c;
		border: 1px solid #b91c1c;
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.remove-btn:hover {
		background-color: #b91c1c;
		color: var(--color-white);
	}

	/* Review summary */
	.review-summary {
		display: grid;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}

	.summary-section {
		padding: var(--space-4);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
	}

	.summary-section h3 {
		margin: 0 0 var(--space-1);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.summary-section p {
		margin: 0;
	}

	.notes-preview {
		font-size: var(--font-size-sm);
		white-space: pre-wrap;
	}

	/* Step actions */
	.step-actions {
		display: flex;
		justify-content: space-between;
		gap: var(--space-3);
		margin-top: var(--space-6);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-gray-200);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-6);
		font-weight: 500;
		font-size: var(--font-size-sm);
		border-radius: var(--radius-md);
		border: none;
		cursor: pointer;
		transition: background-color 0.15s ease;
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
		background-color: var(--color-primary-dark, #004a3f);
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

	.error-message {
		padding: var(--space-3) var(--space-4);
		background-color: rgba(239, 68, 68, 0.1);
		color: #b91c1c;
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-4);
	}

	@media (max-width: 640px) {
		.revise-page {
			padding: var(--space-4);
		}

		.wizard-content {
			padding: var(--space-4);
		}

		.step-actions {
			flex-direction: column;
		}

		.btn {
			width: 100%;
		}
	}

	/* New items heading */
	.new-items-heading {
		margin: var(--space-4) 0 var(--space-2);
		font-size: var(--font-size-base);
		font-weight: 500;
		color: var(--color-primary);
	}

	/* New item cards */
	.new-item-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3);
		background-color: rgba(0, 89, 76, 0.05);
		border: 1px solid rgba(0, 89, 76, 0.2);
		border-radius: var(--radius-md);
	}

	.new-item-info {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.new-item-title {
		font-weight: 500;
	}

	.new-item-badge {
		font-size: var(--font-size-xs);
		padding: var(--space-1) var(--space-2);
		background-color: var(--color-primary);
		color: var(--color-white);
		border-radius: var(--radius-sm);
	}

	/* Add button */
	.add-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-3);
		padding: var(--space-2) var(--space-3);
		background-color: transparent;
		color: var(--color-primary);
		border: 1px dashed var(--color-primary);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.add-btn:hover {
		background-color: rgba(0, 89, 76, 0.05);
		border-style: solid;
	}

	.add-icon {
		width: 1rem;
		height: 1rem;
	}

	/* Add forms */
	.add-form {
		margin-top: var(--space-4);
		padding: var(--space-4);
		background-color: var(--color-gray-50);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-md);
	}

	.add-form h4 {
		margin: 0 0 var(--space-3);
		font-size: var(--font-size-base);
	}

	.form-row {
		display: flex;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.form-field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.form-field.full-width {
		flex: 1 1 100%;
	}

	.form-field label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.form-field input,
	.form-field select {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
	}

	.form-field input:focus,
	.form-field select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-top: var(--space-3);
	}

	.btn-sm {
		padding: var(--space-2) var(--space-3);
		font-size: var(--font-size-xs);
	}

	/* Fieldset reset */
	fieldset.form-row {
		border: none;
		padding: 0;
		margin: 0;
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
		border: 0;
	}

	.field-label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-muted);
		display: block;
		margin-bottom: var(--space-1);
	}

	/* Radio groups */
	.radio-group {
		display: flex;
		gap: var(--space-4);
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-sm);
		cursor: pointer;
	}

	.radio-label input[type='radio'] {
		width: 1rem;
		height: 1rem;
	}

	/* Action buttons for cards */
	.adult-actions,
	.method-actions {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.action-btn {
		padding: var(--space-1) var(--space-2);
		background-color: transparent;
		color: var(--color-primary);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.action-btn:hover {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	/* Editing state for cards */
	.adult-card.editing,
	.method-card.editing {
		flex-direction: column;
		align-items: stretch;
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
	}

	.edit-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
	}

	/* Contact info display */
	.adult-contact {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	/* Step 3: Removed skills section */
	.removed-skills-section {
		margin-bottom: var(--space-6);
	}

	.removed-skills-section h3 {
		margin: 0 0 var(--space-2);
		font-size: var(--font-size-lg);
		color: #b91c1c;
	}

	.section-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3);
	}

	.removed-skills-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.removed-skill-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background-color: rgba(239, 68, 68, 0.05);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--radius-md);
	}

	.removed-icon {
		width: 1rem;
		height: 1rem;
		color: #b91c1c;
		flex-shrink: 0;
	}

	.removed-skill-item span {
		flex: 1;
		text-decoration: line-through;
		color: var(--color-text-muted);
	}

	.restore-btn {
		padding: var(--space-1) var(--space-2);
		background-color: transparent;
		color: var(--color-primary);
		border: 1px solid var(--color-primary);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.restore-btn:hover {
		background-color: var(--color-primary);
		color: var(--color-white);
	}

	.no-removed-skills {
		padding: var(--space-4);
		background-color: var(--color-gray-50);
		border-radius: var(--radius-md);
		text-align: center;
		margin-bottom: var(--space-6);
	}

	.no-removed-skills p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	/* Library skills section */
	.library-skills-section {
		margin-top: var(--space-4);
		padding: var(--space-4);
		background-color: var(--color-gray-50);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-md);
	}

	.section-heading {
		margin: 0 0 var(--space-1);
		font-size: var(--font-size-base);
		font-weight: 500;
	}

	.section-hint {
		margin: 0 0 var(--space-3);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.library-skills-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.library-skill-item {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.library-skill-item:hover {
		border-color: var(--color-primary);
		background-color: rgba(0, 89, 76, 0.05);
	}

	.library-skill-title {
		font-weight: 500;
	}

	.library-skill-category {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.add-library-icon {
		width: 1rem;
		height: 1rem;
		color: var(--color-primary);
	}

	.new-item-card.library-added {
		background-color: rgba(59, 130, 246, 0.05);
		border-color: rgba(59, 130, 246, 0.3);
	}

	/* Mobile responsive for form rows */
	@media (max-width: 640px) {
		.form-row {
			flex-direction: column;
		}

		.adult-actions,
		.method-actions {
			flex-wrap: wrap;
		}

		.radio-group {
			flex-direction: column;
			gap: var(--space-2);
		}

		.library-skills-list {
			flex-direction: column;
		}

		.library-skill-item {
			width: 100%;
			justify-content: space-between;
		}
	}
</style>
