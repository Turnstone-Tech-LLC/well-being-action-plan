import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import type { SkillCategory } from '$lib/types/database';
import type { CheckInSummary } from '$lib/server/types';
import type {
	SelectedSkill,
	CustomSkill,
	SelectedSupportiveAdult,
	CustomSupportiveAdult,
	SelectedHelpMethod,
	CustomHelpMethod
} from './actionPlanDraft';

// Re-export types from actionPlanDraft for convenience
export type {
	SelectedSkill,
	CustomSkill,
	SelectedSupportiveAdult,
	CustomSupportiveAdult,
	SelectedHelpMethod,
	CustomHelpMethod
};

/**
 * Revision draft state for the follow-up visit wizard.
 */
export interface RevisionDraft {
	/** The action plan ID being revised */
	actionPlanId: string;
	/** Current wizard step (1-indexed) */
	currentStep: number;

	/** Step 1: Check-in summary (from imported PDF) */
	checkInSummary: CheckInSummary | null;

	/** Step 2: What worked */
	whatWorkedNotes: string;
	/** Skills to keep from the current plan */
	skillsToKeep: string[];
	/** Skills to remove from the current plan */
	skillsToRemove: string[];
	/** New skills to add */
	newSkills: CustomSkill[];

	/** Step 3: What didn't work */
	whatDidntWorkNotes: string;

	/** Step 4: Supportive adults (copied from current plan, editable) */
	selectedSupportiveAdults: SelectedSupportiveAdult[];
	customSupportiveAdults: CustomSupportiveAdult[];

	/** Step 5: Help methods (copied from current plan, editable) */
	selectedHelpMethods: SelectedHelpMethod[];
	customHelpMethods: CustomHelpMethod[];

	/** Step 6: Review - summary notes for the revision */
	revisionNotes: string;

	/** Original plan data for reference */
	originalPlanData: {
		patientNickname: string;
		happyWhen: string;
		happyBecause: string;
		selectedSkills: SelectedSkill[];
		customSkills: CustomSkill[];
	} | null;
}

const STORAGE_KEY = 'revisionDraft';

/**
 * Create initial empty revision draft state.
 */
function createInitialDraft(): RevisionDraft {
	return {
		actionPlanId: '',
		currentStep: 1,
		checkInSummary: null,
		whatWorkedNotes: '',
		skillsToKeep: [],
		skillsToRemove: [],
		newSkills: [],
		whatDidntWorkNotes: '',
		selectedSupportiveAdults: [],
		customSupportiveAdults: [],
		selectedHelpMethods: [],
		customHelpMethods: [],
		revisionNotes: '',
		originalPlanData: null
	};
}

/**
 * Load draft from session storage.
 */
function loadFromStorage(): RevisionDraft {
	if (!browser) return createInitialDraft();

	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as Partial<RevisionDraft>;
			// Merge with defaults in case new fields were added
			return { ...createInitialDraft(), ...parsed };
		}
	} catch {
		// Ignore storage errors
	}

	return createInitialDraft();
}

/**
 * Save draft to session storage.
 */
function saveToStorage(draft: RevisionDraft): void {
	if (!browser) return;

	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
	} catch {
		// Ignore storage errors
	}
}

/**
 * Create the revision draft store.
 */
function createRevisionDraftStore() {
	const { subscribe, set, update } = writable<RevisionDraft>(loadFromStorage());

	// Auto-save to storage on changes
	let initialized = false;
	subscribe((draft) => {
		if (initialized) {
			saveToStorage(draft);
		}
		initialized = true;
	});

	return {
		subscribe,

		/**
		 * Initialize the draft with plan data.
		 */
		initialize(
			actionPlanId: string,
			existingData: {
				patientNickname: string;
				happyWhen: string;
				happyBecause: string;
				selectedSkills: SelectedSkill[];
				customSkills: CustomSkill[];
				selectedSupportiveAdults: SelectedSupportiveAdult[];
				customSupportiveAdults: CustomSupportiveAdult[];
				selectedHelpMethods: SelectedHelpMethod[];
				customHelpMethods: CustomHelpMethod[];
			}
		): void {
			// Get all skill IDs to initially mark as "keep"
			const allSkillIds = [
				...existingData.selectedSkills.map((s) => s.skillId),
				...existingData.customSkills.map((s) => s.id)
			];

			set({
				actionPlanId,
				currentStep: 1,
				checkInSummary: null,
				whatWorkedNotes: '',
				skillsToKeep: allSkillIds,
				skillsToRemove: [],
				newSkills: [],
				whatDidntWorkNotes: '',
				selectedSupportiveAdults: [...existingData.selectedSupportiveAdults],
				customSupportiveAdults: [...existingData.customSupportiveAdults],
				selectedHelpMethods: [...existingData.selectedHelpMethods],
				customHelpMethods: [...existingData.customHelpMethods],
				revisionNotes: '',
				originalPlanData: {
					patientNickname: existingData.patientNickname,
					happyWhen: existingData.happyWhen,
					happyBecause: existingData.happyBecause,
					selectedSkills: existingData.selectedSkills,
					customSkills: existingData.customSkills
				}
			});
		},

		/**
		 * Set the current step.
		 */
		setStep(step: number): void {
			update((draft) => ({ ...draft, currentStep: step }));
		},

		/**
		 * Go to next step.
		 */
		nextStep(): void {
			update((draft) => ({ ...draft, currentStep: draft.currentStep + 1 }));
		},

		/**
		 * Go to previous step.
		 */
		prevStep(): void {
			update((draft) => ({ ...draft, currentStep: Math.max(1, draft.currentStep - 1) }));
		},

		/**
		 * Set check-in summary from imported PDF.
		 */
		setCheckInSummary(summary: CheckInSummary | null): void {
			update((draft) => ({ ...draft, checkInSummary: summary }));
		},

		/**
		 * Set "what worked" notes.
		 */
		setWhatWorkedNotes(notes: string): void {
			update((draft) => ({ ...draft, whatWorkedNotes: notes }));
		},

		/**
		 * Toggle whether a skill is kept or removed.
		 */
		toggleSkillKeep(skillId: string): void {
			update((draft) => {
				const isCurrentlyKept = draft.skillsToKeep.includes(skillId);
				if (isCurrentlyKept) {
					return {
						...draft,
						skillsToKeep: draft.skillsToKeep.filter((id) => id !== skillId),
						skillsToRemove: [...draft.skillsToRemove, skillId]
					};
				} else {
					return {
						...draft,
						skillsToRemove: draft.skillsToRemove.filter((id) => id !== skillId),
						skillsToKeep: [...draft.skillsToKeep, skillId]
					};
				}
			});
		},

		/**
		 * Add a new skill during revision.
		 */
		addNewSkill(title: string, category: SkillCategory): string {
			const id = `revision-skill-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
			update((draft) => ({
				...draft,
				newSkills: [...draft.newSkills, { id, title, category }]
			}));
			return id;
		},

		/**
		 * Remove a new skill added during revision.
		 */
		removeNewSkill(skillId: string): void {
			update((draft) => ({
				...draft,
				newSkills: draft.newSkills.filter((s) => s.id !== skillId)
			}));
		},

		/**
		 * Set "what didn't work" notes.
		 */
		setWhatDidntWorkNotes(notes: string): void {
			update((draft) => ({ ...draft, whatDidntWorkNotes: notes }));
		},

		/**
		 * Add a supportive adult.
		 */
		addSupportiveAdult(adult: SelectedSupportiveAdult): void {
			update((draft) => ({
				...draft,
				selectedSupportiveAdults: [...draft.selectedSupportiveAdults, adult]
			}));
		},

		/**
		 * Remove a supportive adult by typeId.
		 */
		removeSupportiveAdult(typeId: string): void {
			update((draft) => ({
				...draft,
				selectedSupportiveAdults: draft.selectedSupportiveAdults.filter((a) => a.typeId !== typeId)
			}));
		},

		/**
		 * Update a supportive adult.
		 */
		updateSupportiveAdult(typeId: string, updates: Partial<SelectedSupportiveAdult>): void {
			update((draft) => ({
				...draft,
				selectedSupportiveAdults: draft.selectedSupportiveAdults.map((a) =>
					a.typeId === typeId ? { ...a, ...updates } : a
				)
			}));
		},

		/**
		 * Add a custom supportive adult.
		 */
		addCustomSupportiveAdult(label: string, name: string): string {
			const id = `revision-adult-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
			update((draft) => ({
				...draft,
				customSupportiveAdults: [
					...draft.customSupportiveAdults,
					{ id, label, name, isPrimary: false }
				]
			}));
			return id;
		},

		/**
		 * Remove a custom supportive adult.
		 */
		removeCustomSupportiveAdult(customId: string): void {
			update((draft) => ({
				...draft,
				customSupportiveAdults: draft.customSupportiveAdults.filter((a) => a.id !== customId)
			}));
		},

		/**
		 * Update a custom supportive adult.
		 */
		updateCustomSupportiveAdult(customId: string, updates: Partial<CustomSupportiveAdult>): void {
			update((draft) => ({
				...draft,
				customSupportiveAdults: draft.customSupportiveAdults.map((a) =>
					a.id === customId ? { ...a, ...updates } : a
				)
			}));
		},

		/**
		 * Set a supportive adult as primary.
		 */
		setSupportiveAdultPrimary(typeId: string | null, customId: string | null): void {
			update((draft) => ({
				...draft,
				selectedSupportiveAdults: draft.selectedSupportiveAdults.map((a) => ({
					...a,
					isPrimary: a.typeId === typeId
				})),
				customSupportiveAdults: draft.customSupportiveAdults.map((a) => ({
					...a,
					isPrimary: a.id === customId
				}))
			}));
		},

		/**
		 * Add a help method.
		 */
		addHelpMethod(method: SelectedHelpMethod): void {
			update((draft) => ({
				...draft,
				selectedHelpMethods: [...draft.selectedHelpMethods, method]
			}));
		},

		/**
		 * Remove a help method.
		 */
		removeHelpMethod(helpMethodId: string): void {
			update((draft) => ({
				...draft,
				selectedHelpMethods: draft.selectedHelpMethods.filter(
					(m) => m.helpMethodId !== helpMethodId
				)
			}));
		},

		/**
		 * Update a help method.
		 */
		updateHelpMethod(helpMethodId: string, updates: Partial<SelectedHelpMethod>): void {
			update((draft) => ({
				...draft,
				selectedHelpMethods: draft.selectedHelpMethods.map((m) =>
					m.helpMethodId === helpMethodId ? { ...m, ...updates } : m
				)
			}));
		},

		/**
		 * Add a custom help method.
		 */
		addCustomHelpMethod(title: string, additionalInfo?: string): string {
			const id = `revision-help-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
			update((draft) => ({
				...draft,
				customHelpMethods: [...draft.customHelpMethods, { id, title, additionalInfo }]
			}));
			return id;
		},

		/**
		 * Remove a custom help method.
		 */
		removeCustomHelpMethod(customId: string): void {
			update((draft) => ({
				...draft,
				customHelpMethods: draft.customHelpMethods.filter((m) => m.id !== customId)
			}));
		},

		/**
		 * Update a custom help method.
		 */
		updateCustomHelpMethod(customId: string, updates: Partial<CustomHelpMethod>): void {
			update((draft) => ({
				...draft,
				customHelpMethods: draft.customHelpMethods.map((m) =>
					m.id === customId ? { ...m, ...updates } : m
				)
			}));
		},

		/**
		 * Set revision notes.
		 */
		setRevisionNotes(notes: string): void {
			update((draft) => ({ ...draft, revisionNotes: notes }));
		},

		/**
		 * Reset the draft to initial state.
		 */
		reset(): void {
			const initial = createInitialDraft();
			set(initial);
			if (browser) {
				sessionStorage.removeItem(STORAGE_KEY);
			}
		},

		/**
		 * Check if a skill is being kept.
		 */
		isSkillKept(skillId: string): boolean {
			let result = false;
			const unsubscribe = subscribe((draft) => {
				result = draft.skillsToKeep.includes(skillId);
			});
			unsubscribe();
			return result;
		}
	};
}

/**
 * The main revision draft store instance.
 */
export const revisionDraft = createRevisionDraftStore();

/**
 * Derived store for current step.
 */
export const currentRevisionStep: Readable<number> = derived(
	revisionDraft,
	($draft) => $draft.currentStep
);

/**
 * Derived store for check-in summary.
 */
export const checkInSummary: Readable<CheckInSummary | null> = derived(
	revisionDraft,
	($draft) => $draft.checkInSummary
);

/**
 * Derived store for skills to keep.
 */
export const skillsToKeep: Readable<string[]> = derived(
	revisionDraft,
	($draft) => $draft.skillsToKeep
);

/**
 * Derived store for skills to remove.
 */
export const skillsToRemove: Readable<string[]> = derived(
	revisionDraft,
	($draft) => $draft.skillsToRemove
);

/**
 * Derived store for new skills.
 */
export const newSkills: Readable<CustomSkill[]> = derived(
	revisionDraft,
	($draft) => $draft.newSkills
);

/**
 * Total steps in the revision wizard.
 */
export const REVISION_TOTAL_STEPS = 6;
