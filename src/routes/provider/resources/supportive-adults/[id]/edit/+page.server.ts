import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { SupportiveAdultType } from '$lib/types/database';

export interface EditPageData {
	type: SupportiveAdultType;
}

export const load: PageServerLoad = async ({ params, locals, parent }): Promise<EditPageData> => {
	// Get provider from parent layout (already authenticated)
	const { provider } = await parent();

	if (!provider) {
		error(401, 'Unauthorized');
	}

	const providerProfile = provider;

	// Fetch the supportive adult type
	const { data: type, error: fetchError } = await locals.supabase
		.from('supportive_adult_types')
		.select('*')
		.eq('id', params.id)
		.single();

	if (fetchError || !type) {
		error(404, 'Supportive adult type not found');
	}

	// Verify the type belongs to this org (can only edit custom types from same org)
	if (type.organization_id === null || type.organization_id !== providerProfile.organization_id) {
		error(403, 'Cannot edit standard types or types from other organizations');
	}

	return { type };
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
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

		// Verify the type exists and belongs to this org
		const { data: existingType } = await locals.supabase
			.from('supportive_adult_types')
			.select('*')
			.eq('id', params.id)
			.single();

		if (!existingType) {
			return fail(404, { error: 'Type not found' });
		}

		if (
			existingType.organization_id === null ||
			existingType.organization_id !== providerProfile.organization_id
		) {
			return fail(403, { error: 'Cannot edit standard types or types from other organizations' });
		}

		const formData = await request.formData();
		const label = (formData.get('label') as string)?.trim();
		const hasFillIn = formData.get('has_fill_in') === 'on';

		// Validate required fields
		if (!label) {
			return fail(400, { error: 'Label is required', label: '' });
		}

		// Update the supportive adult type
		const { error: updateError } = await locals.supabase
			.from('supportive_adult_types')
			.update({
				label,
				has_fill_in: hasFillIn
			})
			.eq('id', params.id);

		if (updateError) {
			console.error('Error updating supportive adult type:', updateError);
			return fail(500, { error: 'Failed to update supportive adult type', label });
		}

		redirect(303, '/provider/resources/supportive-adults');
	}
};
