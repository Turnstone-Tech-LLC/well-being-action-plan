import type { PageServerLoad, Actions } from './$types';
import type { CrisisResource, CrisisContactType } from '$lib/types/database';
import { fail, redirect, error } from '@sveltejs/kit';

export interface EditCrisisResourcePageData {
	resource: CrisisResource;
}

export const load: PageServerLoad = async ({
	params,
	locals
}): Promise<EditCrisisResourcePageData> => {
	// User is guaranteed by parent layout auth guard
	const userId = locals.user!.id;

	// Fetch provider profile to check role
	const { data: providerProfile } = await locals.supabase
		.from('provider_profiles')
		.select('organization_id, role')
		.eq('id', userId)
		.single();

	// Only admins can edit crisis resources
	if (providerProfile?.role !== 'admin') {
		error(403, 'Only organization administrators can edit crisis resources');
	}

	// Fetch the crisis resource
	const { data: resource, error: fetchError } = await locals.supabase
		.from('crisis_resources')
		.select('*')
		.eq('id', params.id)
		.single();

	if (fetchError || !resource) {
		error(404, 'Crisis resource not found');
	}

	// If resource is org-specific, verify it belongs to the admin's org
	if (
		resource.organization_id !== null &&
		resource.organization_id !== providerProfile?.organization_id
	) {
		error(403, 'You can only edit crisis resources from your organization');
	}

	return { resource };
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const contact = (formData.get('contact') as string)?.trim();
		const contactType = formData.get('contact_type') as CrisisContactType | null;
		const description = (formData.get('description') as string)?.trim() || null;

		// Validation
		if (!name) {
			return fail(400, { error: 'Name is required', name: '', contact, contactType, description });
		}

		if (!contact) {
			return fail(400, {
				error: 'Contact is required',
				name,
				contact: '',
				contactType,
				description
			});
		}

		if (!contactType || !['phone', 'text', 'website'].includes(contactType)) {
			return fail(400, {
				error: 'Contact type is required',
				name,
				contact,
				contactType: null,
				description
			});
		}

		// Get the current user
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		if (!user) {
			redirect(303, '/auth');
		}

		// Get provider profile to verify admin role
		const { data: providerProfile } = await locals.supabase
			.from('provider_profiles')
			.select('organization_id, role')
			.eq('id', user.id)
			.single();

		// Only admins can update crisis resources
		if (providerProfile?.role !== 'admin') {
			return fail(403, {
				error: 'Only organization administrators can edit crisis resources',
				name,
				contact,
				contactType,
				description
			});
		}

		// Fetch the crisis resource to verify it exists and check ownership
		const { data: existingResource } = await locals.supabase
			.from('crisis_resources')
			.select('organization_id')
			.eq('id', params.id)
			.single();

		if (!existingResource) {
			return fail(404, {
				error: 'Crisis resource not found',
				name,
				contact,
				contactType,
				description
			});
		}

		// If resource is org-specific, verify it belongs to the admin's org
		if (
			existingResource.organization_id !== null &&
			existingResource.organization_id !== providerProfile.organization_id
		) {
			return fail(403, {
				error: 'You can only edit crisis resources from your organization',
				name,
				contact,
				contactType,
				description
			});
		}

		// Update the crisis resource
		const { error: updateError } = await locals.supabase
			.from('crisis_resources')
			.update({
				name,
				contact,
				contact_type: contactType,
				description
			})
			.eq('id', params.id);

		if (updateError) {
			console.error('Error updating crisis resource:', updateError);
			return fail(500, {
				error: 'Failed to update crisis resource. Please try again.',
				name,
				contact,
				contactType,
				description
			});
		}

		redirect(303, '/provider/resources/crisis');
	}
};
