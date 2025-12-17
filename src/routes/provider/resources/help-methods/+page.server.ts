import type { PageServerLoad, Actions } from './$types';
import type { HelpMethod, ProviderProfile } from '$lib/types/database';
import { fail, redirect } from '@sveltejs/kit';

export interface HelpMethodsPageData {
	helpMethods: HelpMethod[];
	providerProfile: ProviderProfile | null;
}

export const load: PageServerLoad = async ({ locals }): Promise<HelpMethodsPageData> => {
	// User is guaranteed by parent layout auth guard
	const userId = locals.user!.id;

	// Fetch provider profile to get organization_id
	const { data: providerProfile } = await locals.supabase
		.from('provider_profiles')
		.select('*')
		.eq('id', userId)
		.single();

	const orgId = providerProfile?.organization_id;

	// Fetch help methods: global (org_id is null) OR org-specific
	let query = locals.supabase
		.from('help_methods')
		.select('*')
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	// Filter by organization - show global help methods and org-specific ones
	if (orgId) {
		query = query.or(`organization_id.is.null,organization_id.eq.${orgId}`);
	} else {
		// If no org, show only global help methods
		query = query.is('organization_id', null);
	}

	const { data: helpMethods, error } = await query;

	if (error) {
		console.error('Error fetching help methods:', error);
	}

	return {
		helpMethods: helpMethods || [],
		providerProfile
	};
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'Help method ID is required' });
		}

		// Get the current user
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) {
			redirect(303, '/auth');
		}

		// Get provider profile to check organization
		const { data: providerProfile } = await locals.supabase
			.from('provider_profiles')
			.select('organization_id')
			.eq('id', user.id)
			.single();

		if (!providerProfile?.organization_id) {
			return fail(403, { error: 'You must belong to an organization to delete help methods' });
		}

		// Verify the help method belongs to the provider's organization
		const { data: helpMethod } = await locals.supabase
			.from('help_methods')
			.select('organization_id')
			.eq('id', id)
			.single();

		if (!helpMethod) {
			return fail(404, { error: 'Help method not found' });
		}

		if (helpMethod.organization_id !== providerProfile.organization_id) {
			return fail(403, { error: 'You can only delete help methods from your organization' });
		}

		// Check if help method is in use by any action plans
		const { count: usageCount } = await locals.supabase
			.from('action_plan_help_methods')
			.select('*', { count: 'exact', head: true })
			.eq('help_method_id', id);

		if (usageCount && usageCount > 0) {
			return fail(400, {
				error: `Cannot delete: This help method is used by ${usageCount} action plan${usageCount === 1 ? '' : 's'}`
			});
		}

		// Soft delete by setting is_active to false
		const { error } = await locals.supabase
			.from('help_methods')
			.update({ is_active: false })
			.eq('id', id);

		if (error) {
			console.error('Error deleting help method:', error);
			return fail(500, { error: 'Failed to delete help method' });
		}

		return { success: true };
	}
};
