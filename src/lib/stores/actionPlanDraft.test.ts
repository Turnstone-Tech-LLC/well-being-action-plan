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
	isCustomHelpMethod,
	type SelectedSupportiveAdult,
	type CustomSupportiveAdult,
	type SelectedHelpMethod,
	type CustomHelpMethod
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

describe('actionPlanDraft store - Help Methods', () => {
	beforeEach(() => {
		mockSessionStorage.clear();
		actionPlanDraft.reset();
	});

	afterEach(() => {
		mockSessionStorage.clear();
	});

	describe('toggleHelpMethod', () => {
		it('adds a help method when not selected', () => {
			actionPlanDraft.toggleHelpMethod('method-1');

			const draft = get(actionPlanDraft);
			expect(draft.selectedHelpMethods).toHaveLength(1);
			expect(draft.selectedHelpMethods[0]).toEqual({
				helpMethodId: 'method-1'
			});
		});

		it('removes a help method when already selected', () => {
			actionPlanDraft.toggleHelpMethod('method-1');
			actionPlanDraft.toggleHelpMethod('method-1');

			const draft = get(actionPlanDraft);
			expect(draft.selectedHelpMethods).toHaveLength(0);
		});

		it('can select multiple help methods', () => {
			actionPlanDraft.toggleHelpMethod('method-1');
			actionPlanDraft.toggleHelpMethod('method-2');

			const draft = get(actionPlanDraft);
			expect(draft.selectedHelpMethods).toHaveLength(2);
		});
	});

	describe('setHelpMethodAdditionalInfo', () => {
		it('sets additional info for a selected help method', () => {
			actionPlanDraft.toggleHelpMethod('method-1');
			actionPlanDraft.setHelpMethodAdditionalInfo('method-1', 'Need extra support');

			const draft = get(actionPlanDraft);
			expect(draft.selectedHelpMethods[0].additionalInfo).toBe('Need extra support');
		});

		it('does not affect other help methods', () => {
			actionPlanDraft.toggleHelpMethod('method-1');
			actionPlanDraft.toggleHelpMethod('method-2');
			actionPlanDraft.setHelpMethodAdditionalInfo('method-1', 'Info for method 1');

			const draft = get(actionPlanDraft);
			expect(
				draft.selectedHelpMethods.find((h) => h.helpMethodId === 'method-2')?.additionalInfo
			).toBeUndefined();
		});
	});

	describe('addCustomHelpMethod', () => {
		it('adds a custom help method', () => {
			const id = actionPlanDraft.addCustomHelpMethod('Help with school work');

			const draft = get(actionPlanDraft);
			expect(draft.customHelpMethods).toHaveLength(1);
			expect(draft.customHelpMethods[0]).toMatchObject({
				id,
				title: 'Help with school work'
			});
		});

		it('adds a custom help method with additional info', () => {
			const id = actionPlanDraft.addCustomHelpMethod(
				'Help with school work',
				'Especially math homework'
			);

			const draft = get(actionPlanDraft);
			expect(draft.customHelpMethods[0]).toMatchObject({
				id,
				title: 'Help with school work',
				additionalInfo: 'Especially math homework'
			});
		});

		it('generates unique IDs for custom help methods', () => {
			const id1 = actionPlanDraft.addCustomHelpMethod('Method 1');
			const id2 = actionPlanDraft.addCustomHelpMethod('Method 2');

			expect(id1).not.toBe(id2);
			expect(id1).toMatch(/^custom-help-/);
			expect(id2).toMatch(/^custom-help-/);
		});
	});

	describe('updateCustomHelpMethod', () => {
		it('updates the title of a custom help method', () => {
			const id = actionPlanDraft.addCustomHelpMethod('Original title');
			actionPlanDraft.updateCustomHelpMethod(id, { title: 'Updated title' });

			const draft = get(actionPlanDraft);
			expect(draft.customHelpMethods[0].title).toBe('Updated title');
		});

		it('updates the additional info of a custom help method', () => {
			const id = actionPlanDraft.addCustomHelpMethod('Help with something');
			actionPlanDraft.updateCustomHelpMethod(id, { additionalInfo: 'More details here' });

			const draft = get(actionPlanDraft);
			expect(draft.customHelpMethods[0].additionalInfo).toBe('More details here');
		});

		it('updates multiple fields at once', () => {
			const id = actionPlanDraft.addCustomHelpMethod('Original');
			actionPlanDraft.updateCustomHelpMethod(id, {
				title: 'Updated title',
				additionalInfo: 'Updated info'
			});

			const draft = get(actionPlanDraft);
			expect(draft.customHelpMethods[0]).toMatchObject({
				title: 'Updated title',
				additionalInfo: 'Updated info'
			});
		});
	});

	describe('removeCustomHelpMethod', () => {
		it('removes a custom help method', () => {
			const id = actionPlanDraft.addCustomHelpMethod('To be removed');
			actionPlanDraft.removeCustomHelpMethod(id);

			const draft = get(actionPlanDraft);
			expect(draft.customHelpMethods).toHaveLength(0);
		});

		it('only removes the specified custom help method', () => {
			const id1 = actionPlanDraft.addCustomHelpMethod('Method 1');
			const id2 = actionPlanDraft.addCustomHelpMethod('Method 2');
			actionPlanDraft.removeCustomHelpMethod(id1);

			const draft = get(actionPlanDraft);
			expect(draft.customHelpMethods).toHaveLength(1);
			expect(draft.customHelpMethods[0].id).toBe(id2);
		});
	});
});

describe('isCustomHelpMethod', () => {
	it('returns true for custom help methods', () => {
		const customMethod: CustomHelpMethod = {
			id: 'custom-help-123',
			title: 'Custom help'
		};

		expect(isCustomHelpMethod(customMethod)).toBe(true);
	});

	it('returns false for selected help methods', () => {
		const selectedMethod: SelectedHelpMethod = {
			helpMethodId: 'method-1'
		};

		expect(isCustomHelpMethod(selectedMethod)).toBe(false);
	});

	it('returns false for objects with non-custom IDs', () => {
		const notCustom = {
			id: 'regular-id-123',
			title: 'Not custom'
		};

		expect(isCustomHelpMethod(notCustom as CustomHelpMethod)).toBe(false);
	});
});
