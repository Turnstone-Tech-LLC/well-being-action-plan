import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';
import type {
	TokenStatus,
	InstallToken,
	ActionPlanRevision,
	AccessPageData
} from '$lib/server/types';

/**
 * Validates an install token and returns its status with associated data.
 */
async function validateToken(token: string): Promise<{
	status: TokenStatus;
	tokenRow?: InstallToken;
	revision?: ActionPlanRevision;
}> {
	// Query the token from the database
	const { data: tokenRow, error } = await supabase
		.from('action_plan_install_tokens')
		.select('*')
		.eq('token', token)
		.single();

	if (error || !tokenRow) {
		return { status: 'not_found' };
	}

	const now = new Date();

	// Check if token has been revoked
	if (tokenRow.revoked_at) {
		return { status: 'revoked', tokenRow };
	}

	// Check if token has already been used
	if (tokenRow.used_at) {
		return { status: 'used', tokenRow };
	}

	// Check if token has expired
	if (new Date(tokenRow.expires_at) < now) {
		return { status: 'expired', tokenRow };
	}

	// Token is valid - fetch the revision payload
	const { data: revision, error: revisionError } = await supabase
		.from('action_plan_revisions')
		.select('*')
		.eq('id', tokenRow.revision_id)
		.single();

	if (revisionError || !revision) {
		// Token exists but revision is missing - treat as expired/invalid
		return { status: 'not_found', tokenRow };
	}

	return { status: 'valid', tokenRow, revision };
}

export const load: PageServerLoad = async ({ params }): Promise<AccessPageData> => {
	const { token } = params;

	const { status, tokenRow, revision } = await validateToken(token);

	// For non-valid statuses, return minimal data
	if (status !== 'valid' || !tokenRow || !revision) {
		return { tokenStatus: status };
	}

	// Return full data for valid tokens
	return {
		tokenStatus: 'valid',
		planPayload: revision.plan_payload,
		actionPlanId: tokenRow.action_plan_id,
		revisionId: tokenRow.revision_id,
		revisionVersion: revision.version,
		accessCode: token
	};
};
