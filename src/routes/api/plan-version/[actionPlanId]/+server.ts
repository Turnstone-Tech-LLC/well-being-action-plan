import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PlanPayload } from '$lib/db';

export interface PlanVersionResponse {
	latestVersion: number;
	updatedAt: string;
	revisionNotes: string | null;
}

/**
 * GET /api/plan-version/[actionPlanId]?token=xxx
 *
 * Returns the latest version info for an action plan.
 * Requires a valid access token for authentication.
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { actionPlanId } = params;
	const token = url.searchParams.get('token');

	if (!token) {
		error(400, 'Missing token parameter');
	}

	// Validate the token
	const { data: tokenData, error: tokenError } = await locals.supabase
		.from('action_plan_install_tokens')
		.select('action_plan_id, revoked_at, expires_at')
		.eq('token', token)
		.single();

	if (tokenError || !tokenData) {
		error(403, 'Invalid token');
	}

	// Check if token is for the correct action plan
	if (tokenData.action_plan_id !== actionPlanId) {
		error(403, 'Token does not match action plan');
	}

	// Check if token is revoked (we still allow checking version even if token is revoked)
	// This is because the patient may have the plan installed with an old token
	// but we still want them to be able to detect updates

	// Get the latest revision for this action plan
	const { data: latestRevision, error: revisionError } = await locals.supabase
		.from('action_plan_revisions')
		.select('version, revision_notes, created_at')
		.eq('action_plan_id', actionPlanId)
		.order('version', { ascending: false })
		.limit(1)
		.single();

	if (revisionError || !latestRevision) {
		error(404, 'No revisions found for this action plan');
	}

	const response: PlanVersionResponse = {
		latestVersion: latestRevision.version,
		updatedAt: latestRevision.created_at,
		revisionNotes: latestRevision.revision_notes
	};

	return json(response);
};

export interface PlanUpdateResponse {
	success: boolean;
	planPayload: PlanPayload;
	revisionId: string;
	revisionVersion: number;
	revisionNotes: string | null;
}

/**
 * POST /api/plan-version/[actionPlanId]
 *
 * Fetches the latest plan data for updating.
 * Body: { token: string }
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { actionPlanId } = params;

	let body: { token: string };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid request body');
	}

	const { token } = body;

	if (!token) {
		error(400, 'Missing token');
	}

	// Validate the token
	const { data: tokenData, error: tokenError } = await locals.supabase
		.from('action_plan_install_tokens')
		.select('action_plan_id, revoked_at, expires_at')
		.eq('token', token)
		.single();

	if (tokenError || !tokenData) {
		error(403, 'Invalid token');
	}

	if (tokenData.action_plan_id !== actionPlanId) {
		error(403, 'Token does not match action plan');
	}

	// Get the latest revision with full payload
	const { data: latestRevision, error: revisionError } = await locals.supabase
		.from('action_plan_revisions')
		.select('id, version, plan_payload, revision_notes')
		.eq('action_plan_id', actionPlanId)
		.order('version', { ascending: false })
		.limit(1)
		.single();

	if (revisionError || !latestRevision) {
		error(404, 'No revisions found for this action plan');
	}

	const response: PlanUpdateResponse = {
		success: true,
		planPayload: latestRevision.plan_payload as PlanPayload,
		revisionId: latestRevision.id,
		revisionVersion: latestRevision.version,
		revisionNotes: latestRevision.revision_notes
	};

	return json(response);
};
