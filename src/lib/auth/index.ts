/**
 * Auth utilities barrel export.
 */
export {
	isValidEmail,
	getAuthErrorMessage,
	isRateLimitError,
	isExpiredTokenError
} from './validation';

export { initAuthSync } from './sync';
