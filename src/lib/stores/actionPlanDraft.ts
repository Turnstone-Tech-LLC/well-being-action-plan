import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Skill, SkillCategory } from '$lib/types/database';

/**
 * Selected skill with optional fill-in value.
 */
export interface SelectedSkill {
	skillId: string;
	fillInValue?: string;
}

/**
 * Custom skill added by the provider.
 */
export interface CustomSkill {
	id: string;
	title: string;
	category: SkillCategory;
}

/**
 * Action plan draft state for the wizard.
 */
export interface ActionPlanDraft {
	/** Current wizard step (1-indexed) */
	currentStep: number;
	/** Patient nickname (for provider reference) */
	patientNickname: string;
	/** Selected skills from the predefined list */
	selectedSkills: SelectedSkill[];
	/** Custom skills added by the provider */
	customSkills: CustomSkill[];
	/** Reflective question: "I feel happy when..." */
	happyWhen: string;
	/** Reflective question: "I can tell I am feeling happy because..." */
	happyBecause: string;
}

const STORAGE_KEY = 'actionPlanDraft';

/**
 * Create initial empty draft state.
 */
function createInitialDraft(): ActionPlanDraft {
	return {
		currentStep: 1,
		patientNickname: '',
		selectedSkills: [],
		customSkills: [],
		happyWhen: '',
		happyBecause: ''
	};
}

/**
 * Load draft from session storage.
 */
function loadFromStorage(): ActionPlanDraft {
	if (!browser) return createInitialDraft();

	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as Partial<ActionPlanDraft>;
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
function saveToStorage(draft: ActionPlanDraft): void {
	if (!browser) return;

	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
	} catch {
		// Ignore storage errors
	}
}

/**
 * Create the action plan draft store.
 */
function createActionPlanDraftStore() {
	const { subscribe, set, update } = writable<ActionPlanDraft>(loadFromStorage());

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
		 * Set patient nickname.
		 */
		setPatientNickname(nickname: string): void {
			update((draft) => ({ ...draft, patientNickname: nickname }));
		},

		/**
		 * Toggle a skill selection.
		 */
		toggleSkill(skillId: string): void {
			update((draft) => {
				const exists = draft.selectedSkills.some((s) => s.skillId === skillId);
				if (exists) {
					return {
						...draft,
						selectedSkills: draft.selectedSkills.filter((s) => s.skillId !== skillId)
					};
				} else {
					return {
						...draft,
						selectedSkills: [...draft.selectedSkills, { skillId }]
					};
				}
			});
		},

		/**
		 * Set fill-in value for a selected skill.
		 */
		setSkillFillIn(skillId: string, fillInValue: string): void {
			update((draft) => ({
				...draft,
				selectedSkills: draft.selectedSkills.map((s) =>
					s.skillId === skillId ? { ...s, fillInValue } : s
				)
			}));
		},

		/**
		 * Add a custom skill.
		 */
		addCustomSkill(title: string, category: SkillCategory): string {
			const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
			update((draft) => ({
				...draft,
				customSkills: [...draft.customSkills, { id, title, category }]
			}));
			return id;
		},

		/**
		 * Remove a custom skill.
		 */
		removeCustomSkill(customSkillId: string): void {
			update((draft) => ({
				...draft,
				customSkills: draft.customSkills.filter((s) => s.id !== customSkillId)
			}));
		},

		/**
		 * Set reflective question: "I feel happy when..."
		 */
		setHappyWhen(value: string): void {
			update((draft) => ({ ...draft, happyWhen: value }));
		},

		/**
		 * Set reflective question: "I can tell I am feeling happy because..."
		 */
		setHappyBecause(value: string): void {
			update((draft) => ({ ...draft, happyBecause: value }));
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
		 * Check if a skill is selected.
		 */
		isSkillSelected(skillId: string): boolean {
			let result = false;
			const unsubscribe = subscribe((draft) => {
				result = draft.selectedSkills.some((s) => s.skillId === skillId);
			});
			unsubscribe();
			return result;
		},

		/**
		 * Get fill-in value for a skill.
		 */
		getSkillFillIn(skillId: string): string | undefined {
			let result: string | undefined;
			const unsubscribe = subscribe((draft) => {
				result = draft.selectedSkills.find((s) => s.skillId === skillId)?.fillInValue;
			});
			unsubscribe();
			return result;
		}
	};
}

/**
 * The main action plan draft store instance.
 */
export const actionPlanDraft = createActionPlanDraftStore();

/**
 * Derived store for current step.
 */
export const currentStep: Readable<number> = derived(
	actionPlanDraft,
	($draft) => $draft.currentStep
);

/**
 * Derived store for patient nickname.
 */
export const patientNickname: Readable<string> = derived(
	actionPlanDraft,
	($draft) => $draft.patientNickname
);

/**
 * Derived store for selected skills.
 */
export const selectedSkills: Readable<SelectedSkill[]> = derived(
	actionPlanDraft,
	($draft) => $draft.selectedSkills
);

/**
 * Derived store for custom skills.
 */
export const customSkills: Readable<CustomSkill[]> = derived(
	actionPlanDraft,
	($draft) => $draft.customSkills
);

/**
 * Helper to check if a skill is selected (reactive).
 */
export function createIsSkillSelected(skillId: string): Readable<boolean> {
	return derived(actionPlanDraft, ($draft) =>
		$draft.selectedSkills.some((s) => s.skillId === skillId)
	);
}

/**
 * Helper to get skill fill-in value (reactive).
 */
export function createSkillFillIn(skillId: string): Readable<string | undefined> {
	return derived(
		actionPlanDraft,
		($draft) => $draft.selectedSkills.find((s) => s.skillId === skillId)?.fillInValue
	);
}

/**
 * Group skills by category with custom skills merged in.
 */
export function groupSkillsByCategory(
	skills: Skill[],
	customSkillsList: CustomSkill[]
): Map<SkillCategory, (Skill | CustomSkill)[]> {
	const groups = new Map<SkillCategory, (Skill | CustomSkill)[]>();

	// Standard category order
	const categoryOrder: SkillCategory[] = ['physical', 'creative', 'social', 'mindfulness'];

	// Initialize groups in order
	for (const category of categoryOrder) {
		groups.set(category, []);
	}

	// Add predefined skills
	for (const skill of skills) {
		const category = skill.category || 'mindfulness';
		if (!groups.has(category)) {
			groups.set(category, []);
		}
		groups.get(category)!.push(skill);
	}

	// Add custom skills
	for (const customSkill of customSkillsList) {
		if (!groups.has(customSkill.category)) {
			groups.set(customSkill.category, []);
		}
		groups.get(customSkill.category)!.push(customSkill);
	}

	return groups;
}

/**
 * Type guard to check if a skill is custom.
 */
export function isCustomSkill(skill: Skill | CustomSkill): skill is CustomSkill {
	return 'id' in skill && typeof skill.id === 'string' && skill.id.startsWith('custom-');
}

/**
 * Get category display name.
 */
export function getCategoryDisplayName(category: SkillCategory): string {
	const names: Record<string, string> = {
		physical: 'Physical',
		creative: 'Creative',
		social: 'Social',
		mindfulness: 'Mindfulness'
	};
	return names[category] || category;
}
