import type { PlanPayload } from '$lib/db';

/**
 * Token status types returned from validation.
 */
export type TokenStatus = 'valid' | 'expired' | 'used' | 'revoked' | 'update_expired' | 'not_found';

/**
 * Type of revision indicating how/why it was created.
 */
export type RevisionType = 'initial' | 'edit' | 'revision';

/**
 * Summary of check-in data imported from patient PDF export during revision.
 */
export interface CheckInSummary {
	/** Date range covered by the imported check-ins */
	dateRange: { start: string; end: string };
	/** Total number of check-ins in the period */
	totalCheckIns: number;
	/** Distribution of check-ins by zone */
	zoneDistribution: { green: number; yellow: number; red: number };
	/** Most used coping skills with usage count */
	topCopingSkills: Array<{ id: string; title: string; count: number }>;
	/** Feeling notes from Yellow/Red zone check-ins */
	feelingNotes: Array<{ zone: string; date: string; note: string }>;
	/** Supportive adults contacted with contact count */
	adultsContacted: Array<{ name: string; count: number }>;
	/** When the PDF was imported */
	importedAt: string;
}

/**
 * Token purpose type.
 */
export type TokenPurpose = 'install' | 'update';

/**
 * Database row for action_plan_install_tokens table.
 */
export interface InstallToken {
	id: string;
	action_plan_id: string;
	revision_id: string;
	token: string;
	purpose: TokenPurpose;
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
	/** Type of revision: initial, edit, or revision (follow-up visit) */
	revision_type: RevisionType;
	/** Summary of what changed in this revision */
	revision_notes: string | null;
	/** Notes from revision conversation: what worked well */
	what_worked_notes: string | null;
	/** Notes from revision conversation: what should change */
	what_didnt_work_notes: string | null;
	/** Check-in summary imported from patient PDF export */
	check_in_summary: CheckInSummary | null;
	created_by: string | null;
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
