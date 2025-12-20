import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { randomUUID } from 'crypto';

export interface TeamMember {
	id: string;
	email: string;
	name: string | null;
	role: 'admin' | 'provider';
	created_at: string;
}

// Helper to fetch current admin provider
async function getAdminProvider(locals: App.Locals) {
	if (!locals.user) {
		return { error: 'Authentication required', provider: null };
	}

	const { data: provider, error: providerError } = await locals.supabase
		.from('provider_profiles')
		.select('id, role, organization_id')
		.eq('id', locals.user.id)
		.single();

	if (providerError || !provider) {
		return { error: 'Provider profile not found', provider: null };
	}

	if (provider.role !== 'admin') {
		return { error: 'Admin access required', provider: null };
	}

	return { error: null, provider };
}

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { provider } = await parent();

	// Fetch all team members in the organization
	const { data: members, error: membersError } = await locals.supabase
		.from('provider_profiles')
		.select('id, email, name, role, created_at')
		.eq('organization_id', provider.organization_id)
		.order('created_at', { ascending: true });

	if (membersError) {
		console.error('Error loading team members:', membersError);
		return {
			members: [],
			currentUserId: provider.id
		};
	}

	return {
		members: members as TeamMember[],
		currentUserId: provider.id
	};
};

export const actions: Actions = {
	invite: async ({ request, locals }) => {
		const { error: authError, provider } = await getAdminProvider(locals);
		if (authError || !provider) {
			return fail(403, { action: 'invite', error: authError || 'Access denied' });
		}

		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const name = (formData.get('name') as string)?.trim() || null;
		const role = (formData.get('role') as string) || 'provider';

		// Validation
		const fieldErrors: Record<string, string> = {};

		if (!email) {
			fieldErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			fieldErrors.email = 'Please enter a valid email address';
		}

		if (role !== 'admin' && role !== 'provider') {
			fieldErrors.role = 'Invalid role selected';
		}

		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, { action: 'invite', fieldErrors, values: { email, name, role } });
		}

		// Check if user already exists in this organization
		const { data: existingMember } = await locals.supabase
			.from('provider_profiles')
			.select('id')
			.eq('email', email)
			.eq('organization_id', provider.organization_id)
			.single();

		if (existingMember) {
			return fail(400, {
				action: 'invite',
				error: 'A provider with this email already exists in your organization',
				values: { email, name, role }
			});
		}

		// Create a pending provider profile directly
		// The provider can claim their account later by signing up with this email
		const { error: createError } = await locals.supabase.from('provider_profiles').insert({
			id: randomUUID(),
			email,
			name,
			role: role as 'admin' | 'provider',
			organization_id: provider.organization_id,
			settings: {}
		});

		if (createError) {
			console.error('Error creating provider profile:', createError);
			return fail(500, {
				action: 'invite',
				error: 'Failed to add provider. Please try again.',
				values: { email, name, role }
			});
		}

		return { success: true, action: 'invite', message: `Provider ${email} added successfully` };
	},

	update: async ({ request, locals }) => {
		const { error: authError, provider } = await getAdminProvider(locals);
		if (authError || !provider) {
			return fail(403, { action: 'update', error: authError || 'Access denied' });
		}

		const formData = await request.formData();
		const memberId = formData.get('memberId') as string;
		const name = (formData.get('name') as string)?.trim() || null;
		const role = formData.get('role') as string;

		// Cannot edit yourself
		if (memberId === provider.id) {
			return fail(400, {
				action: 'update',
				error: 'You cannot edit your own role here. Use the Settings page.'
			});
		}

		// Validation
		if (role !== 'admin' && role !== 'provider') {
			return fail(400, { action: 'update', error: 'Invalid role selected' });
		}

		// If demoting from admin, ensure there's at least one other admin
		if (role === 'provider') {
			const { data: admins } = await locals.supabase
				.from('provider_profiles')
				.select('id')
				.eq('organization_id', provider.organization_id)
				.eq('role', 'admin');

			const adminCount = admins?.length || 0;
			const memberIsAdmin = admins?.some((a) => a.id === memberId);

			if (memberIsAdmin && adminCount <= 1) {
				return fail(400, {
					action: 'update',
					error: 'Cannot demote the only administrator. Promote another provider first.'
				});
			}
		}

		// Update the provider
		const { error: updateError } = await locals.supabase
			.from('provider_profiles')
			.update({ name, role })
			.eq('id', memberId)
			.eq('organization_id', provider.organization_id);

		if (updateError) {
			console.error('Error updating provider:', updateError);
			return fail(500, { action: 'update', error: 'Failed to update provider. Please try again.' });
		}

		return { success: true, action: 'update', message: 'Provider updated successfully' };
	},

	remove: async ({ request, locals }) => {
		const { error: authError, provider } = await getAdminProvider(locals);
		if (authError || !provider) {
			return fail(403, { action: 'remove', error: authError || 'Access denied' });
		}

		const formData = await request.formData();
		const memberId = formData.get('memberId') as string;

		// Cannot remove yourself
		if (memberId === provider.id) {
			return fail(400, {
				action: 'remove',
				error: 'You cannot remove yourself from the organization'
			});
		}

		// Check if removing last admin
		const { data: member } = await locals.supabase
			.from('provider_profiles')
			.select('role')
			.eq('id', memberId)
			.single();

		if (member?.role === 'admin') {
			const { data: admins } = await locals.supabase
				.from('provider_profiles')
				.select('id')
				.eq('organization_id', provider.organization_id)
				.eq('role', 'admin');

			if ((admins?.length || 0) <= 1) {
				return fail(400, {
					action: 'remove',
					error: 'Cannot remove the only administrator. Promote another provider first.'
				});
			}
		}

		// Remove the provider profile
		const { error: deleteError } = await locals.supabase
			.from('provider_profiles')
			.delete()
			.eq('id', memberId)
			.eq('organization_id', provider.organization_id);

		if (deleteError) {
			console.error('Error removing provider:', deleteError);
			return fail(500, { action: 'remove', error: 'Failed to remove provider. Please try again.' });
		}

		return { success: true, action: 'remove', message: 'Provider removed from organization' };
	}
};
