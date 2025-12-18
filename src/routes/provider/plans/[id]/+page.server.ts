import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { PlanPayload } from '$lib/db';
import type { InstallToken, ActionPlanRevision } from '$lib/server/types';

export interface PlanDetailData {
	id: string;
	status: 'draft' | 'active' | 'archived';
	created_at: string;
	updated_at: string;
	archived_at: string | null;
	latestRevision: ActionPlanRevision | null;
	planPayload: PlanPayload | null;
	activeToken: InstallToken | null;
}

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	const { provider } = await parent();

	if (!provider?.organization_id) {
		error(403, 'You must be associated with an organization to view action plans');
	}

	// Fetch the action plan with revisions
	const { data: actionPlan, error: fetchError } = await locals.supabase
		.from('action_plans')
		.select(
			`
			id,
			organization_id,
			status,
			created_at,
			updated_at,
			archived_at,
			action_plan_revisions (
				id,
				action_plan_id,
				version,
				plan_payload,
				created_at
			)
		`
		)
		.eq('id', params.id)
		.single();

	if (fetchError || !actionPlan) {
		error(404, 'Action plan not found');
	}

	// Verify the plan belongs to the provider's organization
	if (actionPlan.organization_id !== provider.organization_id) {
		error(403, 'You can only view action plans from your organization');
	}

	// Get the latest revision
	const revisions = actionPlan.action_plan_revisions || [];
	const latestRevision = revisions.sort((a, b) => b.version - a.version)[0] || null;
	const planPayload = (latestRevision?.plan_payload as PlanPayload) || null;

	// Fetch active token (not expired, not used, not revoked)
	const { data: activeToken } = await locals.supabase
		.from('action_plan_install_tokens')
		.select('*')
		.eq('action_plan_id', params.id)
		.is('used_at', null)
		.is('revoked_at', null)
		.gt('expires_at', new Date().toISOString())
		.order('created_at', { ascending: false })
		.limit(1)
		.single();

	const planDetail: PlanDetailData = {
		id: actionPlan.id,
		status: actionPlan.archived_at ? 'archived' : 'active',
		created_at: actionPlan.created_at,
		updated_at: actionPlan.updated_at,
		archived_at: actionPlan.archived_at,
		latestRevision: latestRevision
			? {
					id: latestRevision.id,
					action_plan_id: latestRevision.action_plan_id,
					version: latestRevision.version,
					plan_payload: latestRevision.plan_payload as PlanPayload,
					created_at: latestRevision.created_at
				}
			: null,
		planPayload,
		activeToken: (activeToken as InstallToken) || null
	};

	return {
		plan: planDetail
	};
};

export const actions: Actions = {
	archive: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		// Get provider profile
		const { data: provider } = await locals.supabase
			.from('provider_profiles')
			.select('id, organization_id')
			.eq('id', locals.user.id)
			.single();

		if (!provider?.organization_id) {
			return fail(403, { error: 'You must be associated with an organization' });
		}

		// Verify ownership
		const { data: plan } = await locals.supabase
			.from('action_plans')
			.select('organization_id')
			.eq('id', params.id)
			.single();

		if (!plan || plan.organization_id !== provider.organization_id) {
			return fail(403, { error: 'You can only archive plans from your organization' });
		}

		// Archive the plan
		const { error: updateError } = await locals.supabase
			.from('action_plans')
			.update({ archived_at: new Date().toISOString() })
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { error: 'Failed to archive action plan' });
		}

		redirect(303, '/provider?archived=true');
	},

	generateToken: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		// Get provider profile
		const { data: provider } = await locals.supabase
			.from('provider_profiles')
			.select('id, organization_id')
			.eq('id', locals.user.id)
			.single();

		if (!provider?.organization_id) {
			return fail(403, { error: 'You must be associated with an organization' });
		}

		// Fetch the plan with latest revision
		const { data: plan } = await locals.supabase
			.from('action_plans')
			.select(
				`
				id,
				organization_id,
				action_plan_revisions (
					id,
					version
				)
			`
			)
			.eq('id', params.id)
			.single();

		if (!plan || plan.organization_id !== provider.organization_id) {
			return fail(403, { error: 'You can only generate tokens for plans from your organization' });
		}

		const revisions = plan.action_plan_revisions || [];
		const latestRevision = revisions.sort(
			(a: { version: number }, b: { version: number }) => b.version - a.version
		)[0];

		if (!latestRevision) {
			return fail(400, { error: 'No revision found for this plan' });
		}

		// Revoke existing active tokens
		await locals.supabase
			.from('action_plan_install_tokens')
			.update({ revoked_at: new Date().toISOString() })
			.eq('action_plan_id', params.id)
			.is('used_at', null)
			.is('revoked_at', null);

		// Generate new token using nanoid
		const { nanoid } = await import('nanoid');
		const token = nanoid(10);

		// Token expires in 7 days
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		// Create new token
		const { error: tokenError } = await locals.supabase.from('action_plan_install_tokens').insert({
			action_plan_id: params.id,
			revision_id: latestRevision.id,
			token,
			purpose: 'install',
			expires_at: expiresAt.toISOString()
		});

		if (tokenError) {
			console.error('Error creating token:', tokenError);
			return fail(500, { error: 'Failed to generate new token' });
		}

		return { success: true, message: 'New access link generated successfully' };
	}
};
