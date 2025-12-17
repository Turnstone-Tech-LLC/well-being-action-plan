import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { SkillCategory, SkillInsert } from '$lib/types/database';

export const load: PageServerLoad = async ({ parent }) => {
	// Ensure user is authenticated (from parent layout)
	await parent();

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
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
				error: 'You must be associated with an organization to create skills'
			});
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

		// Get the max display_order for the org's skills
		const { data: existingSkills } = await locals.supabase
			.from('skills')
			.select('display_order')
			.eq('organization_id', provider.organization_id)
			.order('display_order', { ascending: false })
			.limit(1);

		const maxDisplayOrder = existingSkills?.[0]?.display_order ?? 0;

		// Create the skill
		const skillData: SkillInsert = {
			title: title.trim(),
			category,
			has_fill_in: hasFillIn,
			fill_in_prompt: hasFillIn ? fillInPrompt?.trim() || null : null,
			organization_id: provider.organization_id,
			display_order: maxDisplayOrder + 1,
			is_active: true
		};

		const { error } = await locals.supabase.from('skills').insert(skillData);

		if (error) {
			console.error('Error creating skill:', error);
			return fail(500, {
				error: 'Failed to create skill. Please try again.',
				values: { title, category, hasFillIn, fillInPrompt }
			});
		}

		// Redirect to skills list with success message
		redirect(303, '/provider/resources/skills?created=true');
	}
};
