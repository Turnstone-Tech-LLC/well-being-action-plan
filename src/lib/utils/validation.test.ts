import { describe, it, expect } from 'vitest';
import {
	validateRequired,
	validateMaxLength,
	validateMinLength,
	validateOneOf,
	combineValidations,
	validateForm,
	createRequiredStringValidator,
	createOptionalStringValidator,
	createEnumValidator,
	createConditionalValidator,
	extractFormData,
	truncateString,
	capitalizeFirst
} from './validation';

describe('validateRequired', () => {
	it('returns valid for non-empty string', () => {
		const result = validateRequired('hello');
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it('returns valid for string with whitespace around content', () => {
		const result = validateRequired('  hello  ');
		expect(result.valid).toBe(true);
	});

	it('returns invalid for empty string', () => {
		const result = validateRequired('');
		expect(result.valid).toBe(false);
		expect(result.error).toBe('This field is required');
	});

	it('returns invalid for whitespace-only string', () => {
		const result = validateRequired('   ');
		expect(result.valid).toBe(false);
	});

	it('returns invalid for null', () => {
		const result = validateRequired(null);
		expect(result.valid).toBe(false);
	});

	it('returns invalid for undefined', () => {
		const result = validateRequired(undefined);
		expect(result.valid).toBe(false);
	});

	it('uses custom field name in error message', () => {
		const result = validateRequired('', 'Title');
		expect(result.error).toBe('Title is required');
	});
});

describe('validateMaxLength', () => {
	it('returns valid for string within limit', () => {
		const result = validateMaxLength('hello', 10);
		expect(result.valid).toBe(true);
	});

	it('returns valid for string at exact limit', () => {
		const result = validateMaxLength('hello', 5);
		expect(result.valid).toBe(true);
	});

	it('returns invalid for string exceeding limit', () => {
		const result = validateMaxLength('hello world', 5);
		expect(result.valid).toBe(false);
		expect(result.error).toBe('This field must be 5 characters or less');
	});

	it('returns valid for null or undefined', () => {
		expect(validateMaxLength(null, 10).valid).toBe(true);
		expect(validateMaxLength(undefined, 10).valid).toBe(true);
	});

	it('uses custom field name', () => {
		const result = validateMaxLength('hello world', 5, 'Title');
		expect(result.error).toBe('Title must be 5 characters or less');
	});
});

describe('validateMinLength', () => {
	it('returns valid for string meeting minimum', () => {
		const result = validateMinLength('hello', 3);
		expect(result.valid).toBe(true);
	});

	it('returns valid for string at exact minimum', () => {
		const result = validateMinLength('hello', 5);
		expect(result.valid).toBe(true);
	});

	it('returns invalid for string below minimum', () => {
		const result = validateMinLength('hi', 3);
		expect(result.valid).toBe(false);
		expect(result.error).toBe('This field must be at least 3 characters');
	});

	it('uses custom field name', () => {
		const result = validateMinLength('hi', 3, 'Password');
		expect(result.error).toBe('Password must be at least 3 characters');
	});
});

describe('validateOneOf', () => {
	it('returns valid for allowed value', () => {
		const result = validateOneOf('red', ['red', 'green', 'blue']);
		expect(result.valid).toBe(true);
	});

	it('returns invalid for disallowed value', () => {
		const result = validateOneOf('yellow', ['red', 'green', 'blue']);
		expect(result.valid).toBe(false);
		expect(result.error).toBe('This field must be one of: red, green, blue');
	});

	it('works with numbers', () => {
		const result = validateOneOf(1, [1, 2, 3]);
		expect(result.valid).toBe(true);
	});

	it('uses custom field name', () => {
		const result = validateOneOf('yellow', ['red', 'green', 'blue'], 'Color');
		expect(result.error).toBe('Color must be one of: red, green, blue');
	});
});

describe('combineValidations', () => {
	it('returns valid when all validations pass', () => {
		const result = combineValidations({ valid: true }, { valid: true }, { valid: true });
		expect(result.valid).toBe(true);
	});

	it('returns first error when validation fails', () => {
		const result = combineValidations(
			{ valid: true },
			{ valid: false, error: 'First error' },
			{ valid: false, error: 'Second error' }
		);
		expect(result.valid).toBe(false);
		expect(result.error).toBe('First error');
	});

	it('returns valid for empty array', () => {
		const result = combineValidations();
		expect(result.valid).toBe(true);
	});
});

describe('validateForm', () => {
	it('validates all fields and collects errors', () => {
		const data = {
			title: '',
			description: 'Valid description'
		};

		const validators = {
			title: (value: unknown) => validateRequired(value as string, 'Title'),
			description: (value: unknown) => validateRequired(value as string, 'Description')
		};

		const result = validateForm(data, validators);
		expect(result.valid).toBe(false);
		expect(result.errors.title).toBe('Title is required');
		expect(result.errors.description).toBeUndefined();
	});

	it('returns valid true when all fields pass', () => {
		const data = {
			title: 'Valid title',
			description: 'Valid description'
		};

		const validators = {
			title: (value: unknown) => validateRequired(value as string, 'Title'),
			description: (value: unknown) => validateRequired(value as string, 'Description')
		};

		const result = validateForm(data, validators);
		expect(result.valid).toBe(true);
		expect(Object.keys(result.errors)).toHaveLength(0);
	});
});

describe('createRequiredStringValidator', () => {
	it('validates required string', () => {
		const validator = createRequiredStringValidator('Title');
		expect(validator('hello').valid).toBe(true);
		expect(validator('').valid).toBe(false);
		expect(validator('').error).toBe('Title is required');
	});

	it('validates max length when specified', () => {
		const validator = createRequiredStringValidator('Title', 5);
		expect(validator('hello').valid).toBe(true);
		expect(validator('hello world').valid).toBe(false);
		expect(validator('hello world').error).toBe('Title must be 5 characters or less');
	});
});

describe('createOptionalStringValidator', () => {
	it('allows empty values', () => {
		const validator = createOptionalStringValidator('Description');
		expect(validator('').valid).toBe(true);
		expect(validator(null).valid).toBe(true);
		expect(validator(undefined).valid).toBe(true);
	});

	it('validates max length for non-empty values', () => {
		const validator = createOptionalStringValidator('Description', 10);
		expect(validator('short').valid).toBe(true);
		expect(validator('this is a very long description').valid).toBe(false);
	});
});

describe('createEnumValidator', () => {
	it('validates enum values', () => {
		const validator = createEnumValidator('Category', ['physical', 'creative', 'social']);
		expect(validator('physical').valid).toBe(true);
		expect(validator('invalid').valid).toBe(false);
	});

	it('requires a value', () => {
		const validator = createEnumValidator('Category', ['physical', 'creative']);
		expect(validator('').valid).toBe(false);
		expect(validator('').error).toBe('Category is required');
		expect(validator(null).valid).toBe(false);
	});
});

describe('createConditionalValidator', () => {
	it('validates when condition is true', () => {
		const shouldValidate = true;
		const validator = createConditionalValidator(
			() => shouldValidate,
			(value: unknown) => validateRequired(value as string, 'Field')
		);

		expect(validator('').valid).toBe(false);
		expect(validator('value').valid).toBe(true);
	});

	it('skips validation when condition is false', () => {
		const shouldValidate = false;
		const validator = createConditionalValidator(
			() => shouldValidate,
			(value: unknown) => validateRequired(value as string, 'Field')
		);

		expect(validator('').valid).toBe(true);
	});
});

describe('extractFormData', () => {
	it('extracts specified fields from FormData', () => {
		const formData = new FormData();
		formData.set('title', 'Test Title');
		formData.set('description', 'Test Description');
		formData.set('extra', 'Not extracted');

		const result = extractFormData(formData, ['title', 'description']);
		expect(result).toEqual({
			title: 'Test Title',
			description: 'Test Description'
		});
	});

	it('returns null for missing fields', () => {
		const formData = new FormData();
		formData.set('title', 'Test Title');

		const result = extractFormData(formData, ['title', 'description']);
		expect(result).toEqual({
			title: 'Test Title',
			description: null
		});
	});
});

describe('truncateString', () => {
	it('returns original string if within limit', () => {
		expect(truncateString('hello', 10)).toBe('hello');
	});

	it('truncates with ellipsis when exceeding limit', () => {
		expect(truncateString('hello world', 8)).toBe('hello...');
	});

	it('returns null for null input', () => {
		expect(truncateString(null, 10)).toBe(null);
	});

	it('returns null for undefined input', () => {
		expect(truncateString(undefined, 10)).toBe(null);
	});

	it('handles string at exact limit', () => {
		expect(truncateString('hello', 5)).toBe('hello');
	});
});

describe('capitalizeFirst', () => {
	it('capitalizes first letter of string', () => {
		expect(capitalizeFirst('hello')).toBe('Hello');
	});

	it('handles already capitalized string', () => {
		expect(capitalizeFirst('Hello')).toBe('Hello');
	});

	it('handles single character', () => {
		expect(capitalizeFirst('h')).toBe('H');
	});

	it('returns empty string for null', () => {
		expect(capitalizeFirst(null)).toBe('');
	});

	it('returns empty string for undefined', () => {
		expect(capitalizeFirst(undefined)).toBe('');
	});

	it('returns empty string for empty string', () => {
		expect(capitalizeFirst('')).toBe('');
	});
});
