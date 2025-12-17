import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	// Just verify authentication via parent layout
	await parent();
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
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
		const label = (formData.get('label') as string)?.trim();
		const hasFillIn = formData.get('has_fill_in') === 'on';

		// Validate required fields
		if (!label) {
			return fail(400, { error: 'Label is required', label: '' });
		}

		// Get max display_order for this org's types
		const { data: existingTypes } = await locals.supabase
			.from('supportive_adult_types')
			.select('display_order')
			.eq('organization_id', providerProfile.organization_id)
			.order('display_order', { ascending: false })
			.limit(1);

		const maxOrder = existingTypes?.[0]?.display_order ?? 0;

		// Create the new supportive adult type
		const { error: insertError } = await locals.supabase.from('supportive_adult_types').insert({
			organization_id: providerProfile.organization_id,
			label,
			has_fill_in: hasFillIn,
			display_order: maxOrder + 1,
			is_active: true
		});

		if (insertError) {
			console.error('Error creating supportive adult type:', insertError);
			return fail(500, { error: 'Failed to create supportive adult type', label });
		}

		redirect(303, '/provider/resources/supportive-adults');
	}
};
