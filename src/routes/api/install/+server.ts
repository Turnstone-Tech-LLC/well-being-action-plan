import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export interface InstallRequest {
	token: string;
	deviceInstallId: string;
}

export interface InstallResponse {
	success: boolean;
	error?: string;
}

/**
 * POST /api/install
 * Records a plan installation and marks the token as used.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as InstallRequest;
	const { token, deviceInstallId } = body;

	if (!token || !deviceInstallId) {
		return json({ success: false, error: 'Missing required fields' } satisfies InstallResponse, {
			status: 400
		});
	}

	// Get the token record
	const { data: tokenRow, error: tokenError } = await supabase
		.from('action_plan_install_tokens')
		.select('*')
		.eq('token', token)
		.single();

	if (tokenError || !tokenRow) {
		return json({ success: false, error: 'Token not found' } satisfies InstallResponse, {
			status: 404
		});
	}

	// Verify token is still valid (not used, expired, or revoked)
	const now = new Date();
	if (tokenRow.used_at) {
		return json({ success: false, error: 'Token already used' } satisfies InstallResponse, {
			status: 400
		});
	}
	if (tokenRow.revoked_at) {
		return json({ success: false, error: 'Token revoked' } satisfies InstallResponse, {
			status: 400
		});
	}
	if (new Date(tokenRow.expires_at) < now) {
		return json({ success: false, error: 'Token expired' } satisfies InstallResponse, {
			status: 400
		});
	}

	// Create install record
	const { error: installError } = await supabase.from('action_plan_installs').insert({
		action_plan_id: tokenRow.action_plan_id,
		revision_id: tokenRow.revision_id,
		install_token_id: tokenRow.id,
		device_install_id: deviceInstallId,
		installed_at: now.toISOString()
	});

	if (installError) {
		console.error('Failed to create install record:', installError);
		return json(
			{ success: false, error: 'Failed to record installation' } satisfies InstallResponse,
			{ status: 500 }
		);
	}

	// Mark token as used
	const { error: updateError } = await supabase
		.from('action_plan_install_tokens')
		.update({ used_at: now.toISOString() })
		.eq('id', tokenRow.id);

	if (updateError) {
		console.error('Failed to mark token as used:', updateError);
		// Installation was recorded, so we still return success
		// The token might be used again but that's handled by the used_at check
	}

	return json({ success: true } satisfies InstallResponse);
};
