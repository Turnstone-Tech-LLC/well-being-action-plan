/**
 * Auth validation utilities.
 * These are pure functions that can be easily unit tested.
 */

/**
 * Validate email format using a standard regex pattern.
 * @param email - The email string to validate
 * @returns true if the email format is valid
 */
export function isValidEmail(email: string): boolean {
	if (!email || typeof email !== 'string') {
		return false;
	}
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
}

/**
 * Convert Supabase error codes to user-friendly messages.
 * @param error - The error code from Supabase
 * @param description - Optional error description
 * @returns A user-friendly error message
 */
export function getAuthErrorMessage(error: string, description?: string | null): string {
	switch (error) {
		case 'access_denied':
			return description ?? 'Access denied';
		case 'expired_token':
		case 'otp_expired':
			return 'Link expired. Please request a new one.';
		case 'invalid_request':
			return 'Invalid link. Please request a new one.';
		case 'rate_limit':
			return 'Too many requests. Please wait a moment before trying again.';
		default:
			return description ?? 'An error occurred. Please try again.';
	}
}

/**
 * Check if an error indicates a rate limit.
 * @param message - The error message to check
 * @param status - Optional HTTP status code
 * @returns true if the error is a rate limit error
 */
export function isRateLimitError(message: string, status?: number): boolean {
	return status === 429 || message.toLowerCase().includes('rate');
}

/**
 * Check if an error indicates an expired or invalid token.
 * @param message - The error message to check
 * @param code - Optional error code
 * @returns true if the token is expired or invalid
 */
export function isExpiredTokenError(message: string, code?: string): boolean {
	const lowerMessage = message.toLowerCase();
	return (
		code === 'otp_expired' || lowerMessage.includes('expired') || lowerMessage.includes('invalid')
	);
}
