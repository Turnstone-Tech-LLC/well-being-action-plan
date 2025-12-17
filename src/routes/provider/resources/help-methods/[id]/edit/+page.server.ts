import type { PageServerLoad, Actions } from './$types';
import type { HelpMethod } from '$lib/types/database';
import { fail, redirect, error } from '@sveltejs/kit';

export interface EditHelpMethodPageData {
	method: HelpMethod;
}

export const load: PageServerLoad = async ({ params, locals }): Promise<EditHelpMethodPageData> => {
	// User is guaranteed by parent layout auth guard
	const userId = locals.user!.id;

	// Fetch provider profile to get organization_id
	const { data: providerProfile } = await locals.supabase
		.from('provider_profiles')
		.select('organization_id')
		.eq('id', userId)
		.single();

	// Fetch the help method
	const { data: method, error: fetchError } = await locals.supabase
		.from('help_methods')
		.select('*')
		.eq('id', params.id)
		.single();

	if (fetchError || !method) {
		error(404, 'Help method not found');
	}

	// Verify the provider can edit this method (must be custom and belong to their org)
	if (method.organization_id === null) {
		error(403, 'Cannot edit standard help methods');
	}

	if (method.organization_id !== providerProfile?.organization_id) {
		error(403, 'You can only edit help methods from your organization');
	}

	return { method };
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
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

		// Get provider profile to verify organization
		const { data: providerProfile } = await locals.supabase
			.from('provider_profiles')
			.select('organization_id')
			.eq('id', user.id)
			.single();

		if (!providerProfile?.organization_id) {
			return fail(403, {
				error: 'You must belong to an organization to edit help methods',
				title,
				description
			});
		}

		// Fetch the help method to verify ownership
		const { data: existingMethod } = await locals.supabase
			.from('help_methods')
			.select('organization_id')
			.eq('id', params.id)
			.single();

		if (!existingMethod) {
			return fail(404, { error: 'Help method not found', title, description });
		}

		if (existingMethod.organization_id !== providerProfile.organization_id) {
			return fail(403, {
				error: 'You can only edit help methods from your organization',
				title,
				description
			});
		}

		// Update the help method
		const { error } = await locals.supabase
			.from('help_methods')
			.update({ title, description })
			.eq('id', params.id);

		if (error) {
			console.error('Error updating help method:', error);
			return fail(500, {
				error: 'Failed to update help method. Please try again.',
				title,
				description
			});
		}

		redirect(303, '/provider/resources/help-methods');
	}
};
