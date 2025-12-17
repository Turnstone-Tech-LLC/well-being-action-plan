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
}

/**
 * Create the initial state.
 */
function createInitialState(): LocalPlanState {
	return {
		plan: null,
		loading: false,
		available: browser ? isIndexedDBAvailable() : false,
		error: null
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
