/**
 * Shared form validation utilities for CRUD operations.
 */

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

export interface FieldValidation {
	field: string;
	error: string;
}

/**
 * Validates that a required field is not empty.
 */
export function validateRequired(
	value: string | null | undefined,
	fieldName: string = 'This field'
): ValidationResult {
	const trimmed = value?.trim() ?? '';
	if (trimmed.length === 0) {
		return {
			valid: false,
			error: `${fieldName} is required`
		};
	}
	return { valid: true };
}

/**
 * Validates that a string does not exceed a maximum length.
 */
export function validateMaxLength(
	value: string | null | undefined,
	maxLength: number,
	fieldName: string = 'This field'
): ValidationResult {
	const str = value ?? '';
	if (str.length > maxLength) {
		return {
			valid: false,
			error: `${fieldName} must be ${maxLength} characters or less`
		};
	}
	return { valid: true };
}

/**
 * Validates that a string meets a minimum length requirement.
 */
export function validateMinLength(
	value: string | null | undefined,
	minLength: number,
	fieldName: string = 'This field'
): ValidationResult {
	const str = value ?? '';
	if (str.length < minLength) {
		return {
			valid: false,
			error: `${fieldName} must be at least ${minLength} characters`
		};
	}
	return { valid: true };
}

/**
 * Validates that a value is one of the allowed options.
 */
export function validateOneOf<T>(
	value: T,
	allowedValues: T[],
	fieldName: string = 'This field'
): ValidationResult {
	if (!allowedValues.includes(value)) {
		return {
			valid: false,
			error: `${fieldName} must be one of: ${allowedValues.join(', ')}`
		};
	}
	return { valid: true };
}

/**
 * Combines multiple validation results.
 * Returns the first error found, or valid if all pass.
 */
export function combineValidations(...validations: ValidationResult[]): ValidationResult {
	for (const validation of validations) {
		if (!validation.valid) {
			return validation;
		}
	}
	return { valid: true };
}

/**
 * Validates a form data object against a schema of validators.
 */
export function validateForm(
	data: Record<string, unknown>,
	validators: Record<string, (value: unknown) => ValidationResult>
): { valid: boolean; errors: Record<string, string> } {
	const errors: Record<string, string> = {};
	let valid = true;

	for (const [field, validator] of Object.entries(validators)) {
		const result = validator(data[field]);
		if (!result.valid && result.error) {
			errors[field] = result.error;
			valid = false;
		}
	}

	return { valid, errors };
}

/**
 * Creates a validator for a required string field with optional max length.
 */
export function createRequiredStringValidator(
	fieldName: string,
	maxLength?: number
): (value: unknown) => ValidationResult {
	return (value: unknown) => {
		const str = value as string | null | undefined;
		const requiredResult = validateRequired(str, fieldName);
		if (!requiredResult.valid) {
			return requiredResult;
		}

		if (maxLength !== undefined) {
			return validateMaxLength(str, maxLength, fieldName);
		}

		return { valid: true };
	};
}

/**
 * Creates a validator for an optional string field with max length.
 */
export function createOptionalStringValidator(
	fieldName: string,
	maxLength?: number
): (value: unknown) => ValidationResult {
	return (value: unknown) => {
		const str = value as string | null | undefined;

		// Empty values are valid for optional fields
		if (!str || str.trim() === '') {
			return { valid: true };
		}

		if (maxLength !== undefined) {
			return validateMaxLength(str, maxLength, fieldName);
		}

		return { valid: true };
	};
}

/**
 * Creates a validator for a required enum field.
 */
export function createEnumValidator<T>(
	fieldName: string,
	allowedValues: T[]
): (value: unknown) => ValidationResult {
	return (value: unknown) => {
		const val = value as T;

		if (val === null || val === undefined || val === '') {
			return {
				valid: false,
				error: `${fieldName} is required`
			};
		}

		return validateOneOf(val, allowedValues, fieldName);
	};
}

/**
 * Creates a conditional validator that only validates when a condition is met.
 */
export function createConditionalValidator(
	condition: () => boolean,
	validator: (value: unknown) => ValidationResult
): (value: unknown) => ValidationResult {
	return (value: unknown) => {
		if (!condition()) {
			return { valid: true };
		}
		return validator(value);
	};
}

/**
 * Extracts form data from FormData object and validates it.
 */
export function extractFormData(
	formData: FormData,
	fields: string[]
): Record<string, string | null> {
	const data: Record<string, string | null> = {};
	for (const field of fields) {
		const value = formData.get(field);
		data[field] = value ? String(value) : null;
	}
	return data;
}

/**
 * Truncates a string to a specified length with ellipsis.
 */
export function truncateString(str: string | null | undefined, maxLength: number): string | null {
	if (!str) return null;
	if (str.length <= maxLength) return str;
	return str.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalizeFirst(str: string | null | undefined): string {
	if (!str) return '';
	return str.charAt(0).toUpperCase() + str.slice(1);
}
