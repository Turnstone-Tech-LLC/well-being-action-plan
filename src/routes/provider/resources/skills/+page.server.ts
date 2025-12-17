import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Skill, ProviderProfile } from '$lib/types/database';

export interface SkillsPageData {
	skills: Skill[];
	providerProfile: ProviderProfile | null;
	categories: string[];
}

export const load: PageServerLoad = async ({ locals, parent }): Promise<SkillsPageData> => {
	// Get provider from parent layout
	const { provider } = await parent();

	// Fetch full provider profile to get all fields
	const { data: providerProfile } = await locals.supabase
		.from('provider_profiles')
		.select('*')
		.eq('id', provider.id)
		.single();

	const orgId = providerProfile?.organization_id;

	// Fetch skills: global (org_id is null) OR org-specific
	let query = locals.supabase
		.from('skills')
		.select('*')
		.eq('is_active', true)
		.order('display_order', { ascending: true });

	// Filter by organization - show global skills and org-specific skills
	if (orgId) {
		query = query.or(`organization_id.is.null,organization_id.eq.${orgId}`);
	} else {
		// If no org, show only global skills
		query = query.is('organization_id', null);
	}

	const { data: skills, error } = await query;

	if (error) {
		console.error('Error fetching skills:', error);
	}

	// Extract unique categories from skills
	const categories = [
		...new Set((skills || []).map((s) => s.category).filter((c): c is string => c !== null))
	].sort();

	return {
		skills: skills || [],
		providerProfile,
		categories
	};
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		// Require authentication
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		// Get provider profile
		const { data: provider } = await locals.supabase
			.from('provider_profiles')
			.select('id, organization_id')
			.eq('id', locals.user.id)
			.single();

		if (!provider?.organization_id) {
			return fail(403, {
				error: 'You must be associated with an organization to delete skills'
			});
		}

		const formData = await request.formData();
		const skillId = formData.get('skillId') as string;

		if (!skillId) {
			return fail(400, { error: 'Skill ID is required' });
		}

		// Fetch the skill to verify ownership
		const { data: skill, error: fetchError } = await locals.supabase
			.from('skills')
			.select('*')
			.eq('id', skillId)
			.single();

		if (fetchError || !skill) {
			return fail(404, { error: 'Skill not found' });
		}

		// Cannot delete global seed skills
		if (skill.organization_id === null) {
			return fail(403, { error: 'Cannot delete global seed skills' });
		}

		// Can only delete skills belonging to your organization
		if (skill.organization_id !== provider.organization_id) {
			return fail(403, { error: 'You can only delete skills belonging to your organization' });
		}

		// Check if the skill is in use by any action plans
		// Action plans store skills in the plan_payload JSON column
		// We need to check if this skill ID appears in any action plan revisions
		const { data: actionPlanRevisions } = await locals.supabase
			.from('action_plan_revisions')
			.select('id, plan_payload')
			.eq('plan_payload->skills', skillId);

		// Also do a text search in case the skill ID is stored differently
		const { data: revisionsWithSkill } = await locals.supabase
			.from('action_plan_revisions')
			.select('id')
			.filter('plan_payload', 'cs', `"${skillId}"`);

		const isInUse =
			(actionPlanRevisions && actionPlanRevisions.length > 0) ||
			(revisionsWithSkill && revisionsWithSkill.length > 0);

		if (isInUse) {
			// Soft delete - set is_active to false
			const { error: updateError } = await locals.supabase
				.from('skills')
				.update({ is_active: false })
				.eq('id', skillId);

			if (updateError) {
				console.error('Error soft-deleting skill:', updateError);
				return fail(500, { error: 'Failed to delete skill. Please try again.' });
			}

			return { success: true, softDeleted: true };
		} else {
			// Hard delete - remove from database
			const { error: deleteError } = await locals.supabase
				.from('skills')
				.delete()
				.eq('id', skillId);

			if (deleteError) {
				console.error('Error deleting skill:', deleteError);
				return fail(500, { error: 'Failed to delete skill. Please try again.' });
			}

			return { success: true, softDeleted: false };
		}
	}
};
