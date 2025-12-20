import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

interface OrganizationSettings {
	includeNationalCrisisLines?: boolean;
	allowCustomResources?: boolean;
}

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { provider, organization } = await parent();

	// Fetch full organization data with settings
	const { data: orgData, error: orgError } = await locals.supabase
		.from('organizations')
		.select('id, name, slug, settings')
		.eq('id', provider.organization_id)
		.single();

	if (orgError || !orgData) {
		console.error('Error loading organization:', orgError);
		return {
			organization: {
				...organization,
				settings: {
					includeNationalCrisisLines: true,
					allowCustomResources: true
				}
			}
		};
	}

	return {
		organization: {
			...orgData,
			settings: (orgData.settings as OrganizationSettings) || {
				includeNationalCrisisLines: true,
				allowCustomResources: true
			}
		}
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// Check authentication
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		// Fetch provider to verify admin role and get organization_id
		const { data: provider, error: providerError } = await locals.supabase
			.from('provider_profiles')
			.select('id, role, organization_id')
			.eq('id', locals.user.id)
			.single();

		if (providerError || !provider) {
			return fail(401, { error: 'Provider profile not found' });
		}

		// Verify admin role
		if (provider.role !== 'admin') {
			return fail(403, { error: 'Admin access required' });
		}

		// Parse form data
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const includeNationalCrisisLines = formData.get('includeNationalCrisisLines') === 'on';
		const allowCustomResources = formData.get('allowCustomResources') === 'on';

		// Server-side validation
		const fieldErrors: Record<string, string> = {};

		if (!name?.trim()) {
			fieldErrors.name = 'Organization name is required';
		} else if (name.trim().length < 2) {
			fieldErrors.name = 'Name must be at least 2 characters';
		} else if (name.trim().length > 100) {
			fieldErrors.name = 'Name must be 100 characters or less';
		}

		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, {
				fieldErrors,
				values: { name, includeNationalCrisisLines, allowCustomResources }
			});
		}

		// Build settings object
		const settings: OrganizationSettings = {
			includeNationalCrisisLines,
			allowCustomResources
		};

		// Update organization
		const { error: updateError } = await locals.supabase
			.from('organizations')
			.update({
				name: name.trim(),
				settings
			})
			.eq('id', provider.organization_id);

		if (updateError) {
			console.error('Error updating organization:', updateError);
			return fail(500, {
				error: 'Failed to save changes. Please try again.',
				values: { name, includeNationalCrisisLines, allowCustomResources }
			});
		}

		return { success: true };
	}
};
