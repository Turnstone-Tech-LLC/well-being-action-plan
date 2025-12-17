import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { SkillCategory, SkillUpdate } from '$lib/types/database';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	// Get provider info from parent
	const { provider } = await parent();

	if (!provider?.organization_id) {
		error(403, 'You must be associated with an organization to edit skills');
	}

	// Fetch the skill
	const { data: skill, error: fetchError } = await locals.supabase
		.from('skills')
		.select('*')
		.eq('id', params.id)
		.single();

	if (fetchError || !skill) {
		error(404, 'Skill not found');
	}

	// Check if this is an org-specific skill that the user can edit
	if (skill.organization_id === null) {
		error(403, 'Cannot edit global seed skills');
	}

	if (skill.organization_id !== provider.organization_id) {
		error(403, 'You can only edit skills belonging to your organization');
	}

	return {
		skill
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
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
				error: 'You must be associated with an organization to edit skills'
			});
		}

		// Fetch the skill to verify ownership
		const { data: existingSkill, error: fetchError } = await locals.supabase
			.from('skills')
			.select('*')
			.eq('id', params.id)
			.single();

		if (fetchError || !existingSkill) {
			return fail(404, { error: 'Skill not found' });
		}

		if (existingSkill.organization_id === null) {
			return fail(403, { error: 'Cannot edit global seed skills' });
		}

		if (existingSkill.organization_id !== provider.organization_id) {
			return fail(403, { error: 'You can only edit skills belonging to your organization' });
		}

		const formData = await request.formData();

		const title = formData.get('title') as string;
		const category = formData.get('category') as SkillCategory;
		const hasFillIn = formData.get('has_fill_in') === 'on';
		const fillInPrompt = formData.get('fill_in_prompt') as string | null;

		// Server-side validation
		const fieldErrors: Record<string, string> = {};

		if (!title?.trim()) {
			fieldErrors.title = 'Title is required';
		} else if (title.length > 100) {
			fieldErrors.title = 'Title must be 100 characters or less';
		}

		if (!category) {
			fieldErrors.category = 'Category is required';
		} else if (!['physical', 'creative', 'social', 'mindfulness'].includes(category)) {
			fieldErrors.category = 'Invalid category selected';
		}

		if (hasFillIn && !fillInPrompt?.trim()) {
			fieldErrors.fillInPrompt = 'Fill-in prompt is required when "Has fill-in field" is checked';
		}

		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, {
				fieldErrors,
				values: { title, category, hasFillIn, fillInPrompt }
			});
		}

		// Update the skill
		const skillUpdate: SkillUpdate = {
			title: title.trim(),
			category,
			has_fill_in: hasFillIn,
			fill_in_prompt: hasFillIn ? fillInPrompt?.trim() || null : null
		};

		const { error: updateError } = await locals.supabase
			.from('skills')
			.update(skillUpdate)
			.eq('id', params.id);

		if (updateError) {
			console.error('Error updating skill:', updateError);
			return fail(500, {
				error: 'Failed to update skill. Please try again.',
				values: { title, category, hasFillIn, fillInPrompt }
			});
		}

		// Redirect to skills list with success message
		redirect(303, '/provider/resources/skills?updated=true');
	}
};
