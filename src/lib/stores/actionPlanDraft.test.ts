import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock session storage
const mockSessionStorage = {
	store: {} as Record<string, string>,
	getItem(key: string) {
		return this.store[key] || null;
	},
	setItem(key: string, value: string) {
		this.store[key] = value;
	},
	removeItem(key: string) {
		delete this.store[key];
	},
	clear() {
		this.store = {};
	}
};

vi.stubGlobal('sessionStorage', mockSessionStorage);

// Import after mocking
import {
	actionPlanDraft,
	isCustomSupportiveAdult,
	type SelectedSupportiveAdult,
	type CustomSupportiveAdult
} from './actionPlanDraft';

describe('actionPlanDraft store - Supportive Adults', () => {
	beforeEach(() => {
		mockSessionStorage.clear();
		actionPlanDraft.reset();
	});

	afterEach(() => {
		mockSessionStorage.clear();
	});

	describe('toggleSupportiveAdult', () => {
		it('adds a supportive adult when not selected', () => {
			actionPlanDraft.toggleSupportiveAdult('type-1');

			const draft = get(actionPlanDraft);
			expect(draft.selectedSupportiveAdults).toHaveLength(1);
			expect(draft.selectedSupportiveAdults[0]).toEqual({
				typeId: 'type-1',
				name: '',
				isPrimary: false
			});
		});

		it('removes a supportive adult when already selected', () => {
			actionPlanDraft.toggleSupportiveAdult('type-1');
			actionPlanDraft.toggleSupportiveAdult('type-1');

			const draft = get(actionPlanDraft);
			expect(draft.selectedSupportiveAdults).toHaveLength(0);
		});

		it('can select multiple supportive adults', () => {
			actionPlanDraft.toggleSupportiveAdult('type-1');
			actionPlanDraft.toggleSupportiveAdult('type-2');

			const draft = get(actionPlanDraft);
			expect(draft.selectedSupportiveAdults).toHaveLength(2);
		});
	});

	describe('setSupportiveAdultName', () => {
		it('sets the name for a selected supportive adult', () => {
			actionPlanDraft.toggleSupportiveAdult('type-1');
			actionPlanDraft.setSupportiveAdultName('type-1', 'John Doe');

			const draft = get(actionPlanDraft);
			expect(draft.selectedSupportiveAdults[0].name).toBe('John Doe');
		});

		it('does not affect other supportive adults', () => {
			actionPlanDraft.toggleSupportiveAdult('type-1');
			actionPlanDraft.toggleSupportiveAdult('type-2');
			actionPlanDraft.setSupportiveAdultName('type-1', 'John Doe');

			const draft = get(actionPlanDraft);
			expect(draft.selectedSupportiveAdults.find((a) => a.typeId === 'type-2')?.name).toBe('');
		});
	});

	describe('setSupportiveAdultContactInfo', () => {
		it('sets the contact info for a selected supportive adult', () => {
			actionPlanDraft.toggleSupportiveAdult('type-1');
			actionPlanDraft.setSupportiveAdultContactInfo('type-1', '555-1234');

			const draft = get(actionPlanDraft);
			expect(draft.selectedSupportiveAdults[0].contactInfo).toBe('555-1234');
		});
	});

	describe('setSupportiveAdultPrimary', () => {
		it('sets a supportive adult as primary', () => {
			actionPlanDraft.toggleSupportiveAdult('type-1');
			actionPlanDraft.toggleSupportiveAdult('type-2');
			actionPlanDraft.setSupportiveAdultPrimary('type-1', null);

			const draft = get(actionPlanDraft);
			expect(draft.selectedSupportiveAdults.find((a) => a.typeId === 'type-1')?.isPrimary).toBe(
				true
			);
			expect(draft.selectedSupportiveAdults.find((a) => a.typeId === 'type-2')?.isPrimary).toBe(
				false
			);
		});

		it('ensures only one supportive adult is primary', () => {
			actionPlanDraft.toggleSupportiveAdult('type-1');
			actionPlanDraft.toggleSupportiveAdult('type-2');
			actionPlanDraft.setSupportiveAdultPrimary('type-1', null);
			actionPlanDraft.setSupportiveAdultPrimary('type-2', null);

			const draft = get(actionPlanDraft);
			expect(draft.selectedSupportiveAdults.find((a) => a.typeId === 'type-1')?.isPrimary).toBe(
				false
			);
			expect(draft.selectedSupportiveAdults.find((a) => a.typeId === 'type-2')?.isPrimary).toBe(
				true
			);
		});

		it('can set a custom supportive adult as primary', () => {
			const customId = actionPlanDraft.addCustomSupportiveAdult('Aunt', 'Jane Doe');
			actionPlanDraft.toggleSupportiveAdult('type-1');
			actionPlanDraft.setSupportiveAdultPrimary(null, customId);

			const draft = get(actionPlanDraft);
			expect(draft.customSupportiveAdults[0].isPrimary).toBe(true);
			expect(draft.selectedSupportiveAdults[0].isPrimary).toBe(false);
		});

		it('clears all primary when both are null', () => {
			actionPlanDraft.toggleSupportiveAdult('type-1');
			actionPlanDraft.setSupportiveAdultPrimary('type-1', null);
			actionPlanDraft.setSupportiveAdultPrimary(null, null);

			const draft = get(actionPlanDraft);
			expect(draft.selectedSupportiveAdults[0].isPrimary).toBe(false);
		});
	});

	describe('addCustomSupportiveAdult', () => {
		it('adds a custom supportive adult', () => {
			const id = actionPlanDraft.addCustomSupportiveAdult('Aunt', 'Jane Smith');

			const draft = get(actionPlanDraft);
			expect(draft.customSupportiveAdults).toHaveLength(1);
			expect(draft.customSupportiveAdults[0]).toMatchObject({
				id,
				label: 'Aunt',
				name: 'Jane Smith',
				isPrimary: false
			});
		});

		it('generates unique IDs for custom adults', () => {
			const id1 = actionPlanDraft.addCustomSupportiveAdult('Aunt', 'Jane');
			const id2 = actionPlanDraft.addCustomSupportiveAdult('Uncle', 'John');

			expect(id1).not.toBe(id2);
			expect(id1).toMatch(/^custom-adult-/);
			expect(id2).toMatch(/^custom-adult-/);
		});
	});

	describe('updateCustomSupportiveAdult', () => {
		it('updates the name of a custom supportive adult', () => {
			const id = actionPlanDraft.addCustomSupportiveAdult('Aunt', 'Jane');
			actionPlanDraft.updateCustomSupportiveAdult(id, { name: 'Jane Smith' });

			const draft = get(actionPlanDraft);
			expect(draft.customSupportiveAdults[0].name).toBe('Jane Smith');
		});

		it('updates the contact info of a custom supportive adult', () => {
			const id = actionPlanDraft.addCustomSupportiveAdult('Aunt', 'Jane');
			actionPlanDraft.updateCustomSupportiveAdult(id, { contactInfo: 'jane@email.com' });

			const draft = get(actionPlanDraft);
			expect(draft.customSupportiveAdults[0].contactInfo).toBe('jane@email.com');
		});

		it('updates multiple fields at once', () => {
			const id = actionPlanDraft.addCustomSupportiveAdult('Aunt', 'Jane');
			actionPlanDraft.updateCustomSupportiveAdult(id, {
				label: 'Favorite Aunt',
				name: 'Jane Smith',
				contactInfo: '555-0000'
			});

			const draft = get(actionPlanDraft);
			expect(draft.customSupportiveAdults[0]).toMatchObject({
				label: 'Favorite Aunt',
				name: 'Jane Smith',
				contactInfo: '555-0000'
			});
		});
	});

	describe('removeCustomSupportiveAdult', () => {
		it('removes a custom supportive adult', () => {
			const id = actionPlanDraft.addCustomSupportiveAdult('Aunt', 'Jane');
			actionPlanDraft.removeCustomSupportiveAdult(id);

			const draft = get(actionPlanDraft);
			expect(draft.customSupportiveAdults).toHaveLength(0);
		});

		it('only removes the specified custom adult', () => {
			const id1 = actionPlanDraft.addCustomSupportiveAdult('Aunt', 'Jane');
			const id2 = actionPlanDraft.addCustomSupportiveAdult('Uncle', 'John');
			actionPlanDraft.removeCustomSupportiveAdult(id1);

			const draft = get(actionPlanDraft);
			expect(draft.customSupportiveAdults).toHaveLength(1);
			expect(draft.customSupportiveAdults[0].id).toBe(id2);
		});
	});
});

describe('isCustomSupportiveAdult', () => {
	it('returns true for custom supportive adults', () => {
		const customAdult: CustomSupportiveAdult = {
			id: 'custom-adult-123',
			label: 'Aunt',
			name: 'Jane',
			isPrimary: false
		};

		expect(isCustomSupportiveAdult(customAdult)).toBe(true);
	});

	it('returns false for selected supportive adults', () => {
		const selectedAdult: SelectedSupportiveAdult = {
			typeId: 'type-1',
			name: 'John',
			isPrimary: false
		};

		expect(isCustomSupportiveAdult(selectedAdult)).toBe(false);
	});

	it('returns false for objects with non-custom IDs', () => {
		const notCustom = {
			id: 'regular-id-123',
			label: 'Parent',
			name: 'Test',
			isPrimary: false
		};

		expect(isCustomSupportiveAdult(notCustom as CustomSupportiveAdult)).toBe(false);
	});
});
