import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

interface ProviderSettings {
	defaultView?: 'action_plans' | 'resources';
	emailNotifications?: boolean;
}

export const load: PageServerLoad = async ({ parent }) => {
	// Get provider and organization from parent layout
	const { provider, organization } = await parent();

	return {
		provider,
		organization
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// Check authentication
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		// Parse form data
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const defaultView = formData.get('defaultView') as string;
		const emailNotifications = formData.get('emailNotifications') === 'on';

		// Server-side validation
		const fieldErrors: Record<string, string> = {};

		if (!name?.trim()) {
			fieldErrors.name = 'Display name is required';
		} else if (name.trim().length < 2) {
			fieldErrors.name = 'Name must be at least 2 characters';
		} else if (name.trim().length > 100) {
			fieldErrors.name = 'Name must be 100 characters or less';
		}

		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, {
				fieldErrors,
				values: { name, defaultView, emailNotifications }
			});
		}

		// Build settings object
		const settings: ProviderSettings = {
			defaultView: defaultView as 'action_plans' | 'resources',
			emailNotifications
		};

		// Update provider profile
		const { error: updateError } = await locals.supabase
			.from('provider_profiles')
			.update({
				name: name.trim(),
				settings
			})
			.eq('id', locals.user.id);

		if (updateError) {
			console.error('Error updating provider profile:', updateError);
			return fail(500, {
				error: 'Failed to save changes. Please try again.',
				values: { name, defaultView, emailNotifications }
			});
		}

		return { success: true };
	}
};
