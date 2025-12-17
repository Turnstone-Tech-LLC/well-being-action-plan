import type { PlanPayload } from '$lib/db';

/**
 * Token status types returned from validation.
 */
export type TokenStatus = 'valid' | 'expired' | 'used' | 'revoked' | 'update_expired' | 'not_found';

/**
 * Database row for action_plan_install_tokens table.
 */
export interface InstallToken {
	id: string;
	action_plan_id: string;
	revision_id: string;
	token: string;
	expires_at: string;
	used_at: string | null;
	revoked_at: string | null;
	created_at: string;
}

/**
 * Database row for action_plan_revisions table.
 */
export interface ActionPlanRevision {
	id: string;
	action_plan_id: string;
	version: number;
	plan_payload: PlanPayload;
	created_at: string;
}

/**
 * Result from token validation.
 */
export interface TokenValidationResult {
	status: TokenStatus;
	token?: InstallToken;
	revision?: ActionPlanRevision;
}

/**
 * Data passed from server to client for the access page.
 */
export interface AccessPageData {
	tokenStatus: TokenStatus;
	planPayload?: PlanPayload;
	actionPlanId?: string;
	revisionId?: string;
	revisionVersion?: number;
	accessCode?: string;
}
