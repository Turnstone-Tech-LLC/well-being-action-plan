/**
 * Error types that can occur during restore operations.
 */
export type RestoreErrorType = 'wrong_passphrase' | 'corrupt_file' | 'wrong_format' | 'unknown';

/**
 * Detects the specific type of restore error based on the error thrown.
 *
 * Error detection is based on error message patterns:
 * - wrong_passphrase: Decryption failed due to incorrect passphrase (AES-GCM auth tag mismatch)
 * - corrupt_file: File is truncated or has invalid data (JSON parsing, base64 decoding failures)
 * - wrong_format: File is not a valid backup format (missing required fields, invalid structure)
 * - unknown: Catch-all for unexpected errors
 */
export function detectRestoreErrorType(error: unknown): RestoreErrorType {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		// Auth tag failure indicates wrong passphrase (Web Crypto AES-GCM error)
		// The Web Crypto API throws "OperationError" with various messages for decryption failures
		if (
			message.includes('decryption failed') ||
			message.includes('check your passphrase') ||
			message.includes('operation failed') ||
			message.includes('operationerror')
		) {
			return 'wrong_passphrase';
		}

		// Invalid backup file format - missing fields or invalid structure
		if (
			message.includes('invalid backup file') ||
			message.includes('valid .wbap') ||
			message.includes('newer version')
		) {
			return 'wrong_format';
		}

		// JSON parsing or base64 decoding errors indicate corrupt file
		if (
			message.includes('unexpected end') ||
			message.includes('unexpected token') ||
			message.includes('json') ||
			message.includes('invalid character') ||
			message.includes('base64')
		) {
			return 'corrupt_file';
		}
	}

	return 'unknown';
}

/**
 * User-friendly inline error message for first passphrase failure.
 */
export const INLINE_PASSPHRASE_ERROR = "Passphrase didn't match, try again";
