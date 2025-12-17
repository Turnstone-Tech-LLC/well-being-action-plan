import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function generateId(): string {
		return Math.random().toString(36).substring(2, 9);
	}

	function add(message: string, type: ToastType = 'info', duration: number = 5000): string {
		const id = generateId();
		const toast: Toast = { id, message, type, duration };

		update((toasts) => [...toasts, toast]);

		// Auto-remove after duration (if not 0)
		if (duration > 0) {
			setTimeout(() => {
				remove(id);
			}, duration);
		}

		return id;
	}

	function remove(id: string): void {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	function clear(): void {
		update(() => []);
	}

	return {
		subscribe,
		add,
		remove,
		clear,
		success: (message: string, duration?: number) => add(message, 'success', duration),
		error: (message: string, duration?: number) => add(message, 'error', duration),
		info: (message: string, duration?: number) => add(message, 'info', duration),
		warning: (message: string, duration?: number) => add(message, 'warning', duration)
	};
}

export const toastStore = createToastStore();
