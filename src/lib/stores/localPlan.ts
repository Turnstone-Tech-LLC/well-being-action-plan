import { writable, derived, type Readable } from 'svelte/store';
import type { LocalActionPlan, PlanPayload } from '$lib/db';
import {
	hasLocalPlan,
	getLocalPlan,
	saveLocalPlan,
	clearLocalPlan,
	deleteLocalPlan,
	isIndexedDBAvailable,
	type SaveLocalPlanInput
} from '$lib/db/plans';
import { browser } from '$app/environment';

/**
 * Response from version check API.
 */
interface PlanVersionResponse {
	latestVersion: number;
	updatedAt: string;
	revisionNotes: string | null;
}

/**
 * Response from plan update API.
 */
interface PlanUpdateResponse {
	success: boolean;
	planPayload: PlanPayload;
	revisionId: string;
	revisionVersion: number;
	revisionNotes: string | null;
}

/**
 * Update availability info.
 */
export interface UpdateInfo {
	available: boolean;
	latestVersion: number;
	revisionNotes: string | null;
}

/**
 * Store state for local plan management.
 */
interface LocalPlanState {
	/** The currently loaded local plan, if any */
	plan: LocalActionPlan | null;
	/** Whether we're currently loading from IndexedDB */
	loading: boolean;
	/** Whether IndexedDB is available */
	available: boolean;
	/** Any error that occurred during operations */
	error: string | null;
	/** Info about available update, if any */
	updateInfo: UpdateInfo | null;
}

/**
 * Create the initial state.
 */
function createInitialState(): LocalPlanState {
	return {
		plan: null,
		loading: false,
		available: browser ? isIndexedDBAvailable() : false,
		error: null,
		updateInfo: null
	};
}

/**
 * Create the local plan store.
 */
function createLocalPlanStore() {
	const { subscribe, set, update } = writable<LocalPlanState>(createInitialState());

	return {
		subscribe,

		/**
		 * Initialize the store by loading any existing local plan.
		 * Should be called once on app startup (client-side only).
		 */
		async init(): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const available = isIndexedDBAvailable();
				if (!available) {
					update((state) => ({
						...state,
						loading: false,
						available: false,
						error: 'IndexedDB is not available in this browser'
					}));
					return;
				}

				const plan = await getLocalPlan();
				update((state) => ({
					...state,
					plan,
					loading: false,
					available: true,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to load local plan';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
			}
		},

		/**
		 * Check if a local plan exists.
		 */
		async checkExists(): Promise<boolean> {
			if (!browser) return false;

			try {
				return await hasLocalPlan();
			} catch {
				return false;
			}
		},

		/**
		 * Save a plan to local storage and update the store.
		 */
		async save(input: SaveLocalPlanInput): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				await saveLocalPlan(input);
				const plan = await getLocalPlan();
				update((state) => ({
					...state,
					plan,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to save local plan';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
				throw err;
			}
		},

		/**
		 * Clear all local plans and update the store.
		 */
		async clear(): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				await clearLocalPlan();
				update((state) => ({
					...state,
					plan: null,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to clear local plan';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
				throw err;
			}
		},

		/**
		 * Delete a specific plan by action plan ID.
		 */
		async delete(actionPlanId: string): Promise<void> {
			if (!browser) return;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				await deleteLocalPlan(actionPlanId);
				// Reload to get the next plan (if any)
				const plan = await getLocalPlan();
				update((state) => ({
					...state,
					plan,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to delete local plan';
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
				const plan = await getLocalPlan();
				update((state) => ({
					...state,
					plan,
					loading: false,
					error: null
				}));
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to refresh local plan';
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
		},

		/**
		 * Check if an update is available for the current plan.
		 * Compares local version with server version.
		 */
		async checkForUpdates(): Promise<UpdateInfo | null> {
			if (!browser) return null;

			// Get current state
			let currentPlan: LocalActionPlan | null = null;
			const unsubscribe = subscribe((state) => {
				currentPlan = state.plan;
			});
			unsubscribe();

			if (!currentPlan) return null;

			const { actionPlanId, accessCode, revisionVersion } = currentPlan;

			try {
				const response = await fetch(
					`/api/plan-version/${actionPlanId}?token=${encodeURIComponent(accessCode)}`
				);

				if (!response.ok) {
					console.error('Failed to check for updates:', response.statusText);
					return null;
				}

				const data: PlanVersionResponse = await response.json();

				const updateInfo: UpdateInfo = {
					available: data.latestVersion > revisionVersion,
					latestVersion: data.latestVersion,
					revisionNotes: data.revisionNotes
				};

				update((state) => ({ ...state, updateInfo }));

				return updateInfo;
			} catch (err) {
				console.error('Error checking for updates:', err);
				return null;
			}
		},

		/**
		 * Apply an available update by fetching the new plan and saving it.
		 */
		async applyUpdate(): Promise<boolean> {
			if (!browser) return false;

			// Get current state
			let currentPlan: LocalActionPlan | null = null;
			const unsubscribe = subscribe((state) => {
				currentPlan = state.plan;
			});
			unsubscribe();

			if (!currentPlan) return false;

			const { actionPlanId, accessCode, deviceInstallId } = currentPlan;

			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const response = await fetch(`/api/plan-version/${actionPlanId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token: accessCode })
				});

				if (!response.ok) {
					const message = `Failed to fetch update: ${response.statusText}`;
					update((state) => ({ ...state, loading: false, error: message }));
					return false;
				}

				const data: PlanUpdateResponse = await response.json();

				// Save the updated plan to IndexedDB
				await saveLocalPlan({
					actionPlanId,
					accessCode,
					deviceInstallId,
					planPayload: data.planPayload,
					revisionId: data.revisionId,
					revisionVersion: data.revisionVersion
				});

				// Reload the plan from IndexedDB
				const plan = await getLocalPlan();

				update((state) => ({
					...state,
					plan,
					loading: false,
					error: null,
					updateInfo: null // Clear update info after applying
				}));

				return true;
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to apply update';
				update((state) => ({
					...state,
					loading: false,
					error: message
				}));
				return false;
			}
		},

		/**
		 * Dismiss the update notification without applying.
		 */
		dismissUpdate(): void {
			update((state) => ({ ...state, updateInfo: null }));
		}
	};
}

/**
 * The main local plan store instance.
 */
export const localPlanStore = createLocalPlanStore();

/**
 * Derived store for just the plan data.
 */
export const localPlan: Readable<LocalActionPlan | null> = derived(
	localPlanStore,
	($store) => $store.plan
);

/**
 * Derived store for just the plan payload.
 */
export const planPayload: Readable<PlanPayload | null> = derived(
	localPlanStore,
	($store) => $store.plan?.planPayload ?? null
);

/**
 * Derived store for loading state.
 */
export const localPlanLoading: Readable<boolean> = derived(
	localPlanStore,
	($store) => $store.loading
);

/**
 * Derived store for availability state.
 */
export const localPlanAvailable: Readable<boolean> = derived(
	localPlanStore,
	($store) => $store.available
);

/**
 * Derived store for error state.
 */
export const localPlanError: Readable<string | null> = derived(
	localPlanStore,
	($store) => $store.error
);

/**
 * Derived store that indicates if a plan is currently loaded.
 */
export const hasPlan: Readable<boolean> = derived(localPlanStore, ($store) => $store.plan !== null);

/**
 * Derived store for update info.
 */
export const updateInfo: Readable<UpdateInfo | null> = derived(
	localPlanStore,
	($store) => $store.updateInfo
);

/**
 * Derived store that indicates if an update is available.
 */
export const hasUpdate: Readable<boolean> = derived(
	localPlanStore,
	($store) => $store.updateInfo?.available ?? false
);
