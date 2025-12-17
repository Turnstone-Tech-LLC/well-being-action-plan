import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { SupportiveAdultType, ProviderProfile } from '$lib/types/database';

export interface SupportiveAdultsPageData {
	types: SupportiveAdultType[];
	providerProfile: ProviderProfile | null;
}

export const load: PageServerLoad = async ({
	locals,
	parent
}): Promise<SupportiveAdultsPageData> => {
	// Get provider from parent layout (which is already authenticated)
	const { provider } = await parent();

	const orgId = provider?.organization_id;

	// Map provider from layout to ProviderProfile type
	const providerProfile: ProviderProfile | null = provider
		? {
				id: provider.id,
				organization_id: provider.organization_id,
				email: provider.email,
				name: provider.name,
				role: provider.role,
				settings: {},
				created_at: '',
				updated_at: ''
			}
		: null;

	// Fetch supportive adult types: global (org_id is null) OR org-specific
	let query = locals.supabase
		.from('supportive_adult_types')
		.select('*')
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	// Filter by organization - show global types and org-specific types
	if (orgId) {
		query = query.or(`organization_id.is.null,organization_id.eq.${orgId}`);
	} else {
		// If no org, show only global types
		query = query.is('organization_id', null);
	}

	const { data: types, error } = await query;

	if (error) {
		console.error('Error fetching supportive adult types:', error);
	}

	return {
		types: types || [],
		providerProfile
	};
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		// Check authentication
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Get provider profile
		const { data: providerProfile } = await locals.supabase
			.from('provider_profiles')
			.select('*')
			.eq('id', locals.user.id)
			.single();

		if (!providerProfile) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const typeId = formData.get('id') as string;

		if (!typeId) {
			return fail(400, { error: 'Type ID is required' });
		}

		// Verify the type exists and belongs to this org
		const { data: existingType } = await locals.supabase
			.from('supportive_adult_types')
			.select('*')
			.eq('id', typeId)
			.single();

		if (!existingType) {
			return fail(404, { error: 'Type not found' });
		}

		// Can only delete custom (org-specific) types from the same org
		if (
			existingType.organization_id === null ||
			existingType.organization_id !== providerProfile.organization_id
		) {
			return fail(403, { error: 'Cannot delete standard types or types from other organizations' });
		}

		// Check if type is in use by any action plans
		// Look for this type in action_plan_revisions plan_payload
		const { data: usageCheck } = await locals.supabase
			.from('action_plan_revisions')
			.select('id')
			.contains('plan_payload', { supportiveAdultTypeId: typeId })
			.limit(1);

		if (usageCheck && usageCheck.length > 0) {
			return fail(400, {
				error: 'Cannot delete this type because it is being used in action plans',
				isInUse: true
			});
		}

		// Soft delete by setting is_active to false
		const { error: deleteError } = await locals.supabase
			.from('supportive_adult_types')
			.update({ is_active: false })
			.eq('id', typeId);

		if (deleteError) {
			console.error('Error deleting supportive adult type:', deleteError);
			return fail(500, { error: 'Failed to delete type' });
		}

		return { success: true };
	}
};
