import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	// Ensure user is authenticated via parent layout
	await parent();
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const title = (formData.get('title') as string)?.trim();
		const description = (formData.get('description') as string)?.trim() || null;

		// Validation
		if (!title) {
			return fail(400, { error: 'Title is required', title: '', description });
		}

		// Get the current user
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) {
			redirect(303, '/auth');
		}

		// Get provider profile to get organization_id
		const { data: providerProfile } = await locals.supabase
			.from('provider_profiles')
			.select('organization_id')
			.eq('id', user.id)
			.single();

		if (!providerProfile?.organization_id) {
			return fail(403, {
				error: 'You must belong to an organization to create help methods',
				title,
				description
			});
		}

		// Get the max display_order for help methods in this org
		const { data: maxOrderData } = await locals.supabase
			.from('help_methods')
			.select('display_order')
			.or(`organization_id.is.null,organization_id.eq.${providerProfile.organization_id}`)
			.order('display_order', { ascending: false })
			.limit(1)
			.single();

		const nextDisplayOrder = (maxOrderData?.display_order ?? 0) + 1;

		// Create the help method
		const { error } = await locals.supabase.from('help_methods').insert({
			organization_id: providerProfile.organization_id,
			title,
			description,
			display_order: nextDisplayOrder,
			is_active: true
		});

		if (error) {
			console.error('Error creating help method:', error);
			return fail(500, {
				error: 'Failed to create help method. Please try again.',
				title,
				description
			});
		}

		redirect(303, '/provider/resources/help-methods');
	}
};
