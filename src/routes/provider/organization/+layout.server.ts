import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export interface OrganizationWithSettings {
	id: string;
	name: string;
	slug: string;
	settings: {
		includeNationalCrisisLines?: boolean;
		allowCustomResources?: boolean;
	};
}

export const load: LayoutServerLoad = async ({ parent }) => {
	const { provider, organization } = await parent();

	// Only admins can access organization settings
	if (provider.role !== 'admin') {
		redirect(303, '/provider');
	}

	// Fetch full organization data with settings
	return {
		provider,
		organization: organization as OrganizationWithSettings
	};
};
