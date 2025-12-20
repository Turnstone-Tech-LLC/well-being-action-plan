import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export interface ProviderProfile {
	id: string;
	email: string;
	name: string | null;
	role: 'admin' | 'provider';
	organization_id: string;
	settings: Record<string, unknown>;
}

export interface Organization {
	id: string;
	name: string;
	slug: string;
}

export interface ActionPlanSummary {
	id: string;
	patient_nickname: string | null;
	status: 'draft' | 'active' | 'archived';
	created_at: string;
	updated_at: string;
	latest_version: number;
}

export const load: LayoutServerLoad = async ({ locals }) => {
	// Require authentication for all /provider/* routes
	if (!locals.session || !locals.user) {
		redirect(303, '/auth');
	}

	const userId = locals.user.id;

	// Load provider profile
	const { data: profile, error: profileError } = await locals.supabase
		.from('provider_profiles')
		.select('id, email, name, role, organization_id, settings')
		.eq('id', userId)
		.single();

	if (profileError || !profile) {
		// Provider profile doesn't exist - redirect to auth
		console.error('Provider profile not found:', profileError);
		redirect(303, '/auth');
	}

	// Load organization info
	const { data: organization, error: orgError } = await locals.supabase
		.from('organizations')
		.select('id, name, slug')
		.eq('id', profile.organization_id)
		.single();

	if (orgError || !organization) {
		console.error('Organization not found:', orgError);
		redirect(303, '/auth');
	}

	// Load action plans with latest revision info
	const { data: actionPlans, error: plansError } = await locals.supabase
		.from('action_plans')
		.select(
			`
			id,
			created_at,
			updated_at,
			archived_at,
			action_plan_revisions (
				id,
				version,
				plan_payload,
				created_at
			)
		`
		)
		.eq('organization_id', profile.organization_id)
		.is('archived_at', null)
		.order('updated_at', { ascending: false });

	if (plansError) {
		console.error('Error loading action plans:', plansError);
	}

	// Transform action plans to include summary info
	const plans: ActionPlanSummary[] = (actionPlans || []).map((plan) => {
		const revisions = plan.action_plan_revisions || [];
		const latestRevision = revisions.sort((a, b) => b.version - a.version)[0];
		const payload = latestRevision?.plan_payload as { patientNickname?: string } | undefined;

		return {
			id: plan.id,
			patient_nickname: payload?.patientNickname || null,
			status: plan.archived_at ? 'archived' : 'active',
			created_at: plan.created_at,
			updated_at: plan.updated_at,
			latest_version: latestRevision?.version || 0
		};
	});

	return {
		provider: profile as ProviderProfile,
		organization: organization as Organization,
		actionPlans: plans
	};
};
