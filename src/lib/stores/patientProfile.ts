import { writable, derived, type Readable } from 'svelte/store';
import type { PatientProfile } from '$lib/db';
import {
	getCurrentPatientProfile,
	getPatientProfile,
	createPatientProfile,
	completeOnboarding,
	updateDisplayName,
	updateNotificationPreferences,
	deletePatientProfile,
	clearPatientProfiles,
	type CreatePatientProfileInput,
	type UpdateNotificationPreferencesInput
} from '$lib/db/profile';
import { browser } from '$app/environment';

/**
 * Store state for patient profile management.
 */
interface PatientProfileState {
	/** The currently loaded patient profile, if any */
	profile: PatientProfile | null;
	/** Whether we're currently loading from IndexedDB */
	loading: boolean;
	/** Any error that occurred during operations */
	error: string | null;
}

/**
 * Create the initial state.
 */
function createInitialState(): PatientProfileState {
	return {
		profile: null,
		loading: false,
		error: null
	};
}

/**
 * Create the patient profile store.
 */
function createPatientProfileStore() {
	const { subscribe, set, update } = writable<PatientProfileState>(createInitialState());

	return {
		subscribe,

		/**
		 * Initialize the store by loading the current patient profile.
		 * Should be called once on app startup (client-side only).
		 */
		async init(): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const profile = await getCurrentPatientProfile();
				update((state) => ({
					...state,
					profile,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to load patient profile';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
			}
		},

		/**
		 * Load a specific patient profile by action plan ID.
		 */
		async load(actionPlanId: string): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const profile = await getPatientProfile(actionPlanId);
				update((state) => ({
					...state,
					profile,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to load patient profile';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
			}
		},

		/**
		 * Create a new patient profile and update the store.
		 */
		async create(input: CreatePatientProfileInput): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				await createPatientProfile(input);
				const profile = await getPatientProfile(input.actionPlanId);
				update((state) => ({
					...state,
					profile,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to create patient profile';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
				throw err;
			}
		},

		/**
		 * Mark onboarding as complete and update the store.
		 */
		async completeOnboarding(actionPlanId: string): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				await completeOnboarding(actionPlanId);
				const profile = await getPatientProfile(actionPlanId);
				update((state) => ({
					...state,
					profile,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to complete onboarding';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
				throw err;
			}
		},

		/**
		 * Update the display name and refresh the store.
		 */
		async updateDisplayName(actionPlanId: string, displayName: string): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				await updateDisplayName(actionPlanId, displayName);
				const profile = await getPatientProfile(actionPlanId);
				update((state) => ({
					...state,
					profile,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to update display name';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
				throw err;
			}
		},

		/**
		 * Update notification preferences and refresh the store.
		 */
		async updateNotificationPreferences(input: UpdateNotificationPreferencesInput): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				await updateNotificationPreferences(input);
				const profile = await getPatientProfile(input.actionPlanId);
				update((state) => ({
					...state,
					profile,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message =
					err instanceof Error ? err.message : 'Failed to update notification preferences';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
				throw err;
			}
		},

		/**
		 * Delete a specific patient profile.
		 */
		async delete(actionPlanId: string): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				await deletePatientProfile(actionPlanId);
				// Reload to get the next profile (if any)
				const profile = await getCurrentPatientProfile();
				update((state) => ({
					...state,
					profile,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to delete patient profile';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
				throw err;
			}
		},

		/**
		 * Clear all patient profiles and update the store.
		 */
		async clear(): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				await clearPatientProfiles();
				update((state) => ({
					...state,
					profile: null,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to clear patient profiles';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
				throw err;
			}
		},

		/**
		 * Refresh the store by reloading from IndexedDB.
		 */
		async refresh(): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const profile = await getCurrentPatientProfile();
				update((state) => ({
					...state,
					profile,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to refresh patient profile';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
			}
		},

		/**
		 * Reset the store to initial state.
		 */
		reset(): void {
			set(createInitialState());
		}
	};
}

/**
 * The main patient profile store instance.
 */
export const patientProfileStore = createPatientProfileStore();

/**
 * Derived store for just the profile data.
 */
export const patientProfile: Readable<PatientProfile | null> = derived(
	patientProfileStore,
	($store) => $store.profile
);

/**
 * Derived store for loading state.
 */
export const patientProfileLoading: Readable<boolean> = derived(
	patientProfileStore,
	($store) => $store.loading
);

/**
 * Derived store for error state.
 */
export const patientProfileError: Readable<string | null> = derived(
	patientProfileStore,
	($store) => $store.error
);

/**
 * Derived store that indicates if a profile is currently loaded.
 */
export const hasProfile: Readable<boolean> = derived(
	patientProfileStore,
	($store) => $store.profile !== null
);

/**
 * Derived store that indicates if onboarding is complete.
 */
export const onboardingComplete: Readable<boolean> = derived(
	patientProfileStore,
	($store) => $store.profile?.onboardingComplete ?? false
);

/**
 * Derived store for the display name.
 */
export const displayName: Readable<string | null> = derived(
	patientProfileStore,
	($store) => $store.profile?.displayName ?? null
);
