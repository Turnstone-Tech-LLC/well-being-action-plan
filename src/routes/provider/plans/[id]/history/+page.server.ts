import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { PlanPayload } from '$lib/db';
import type { RevisionType, CheckInSummary } from '$lib/server/types';

export interface RevisionHistoryItem {
	id: string;
	version: number;
	revision_type: RevisionType;
	revision_notes: string | null;
	what_worked_notes: string | null;
	what_didnt_work_notes: string | null;
	check_in_summary: CheckInSummary | null;
	plan_payload: PlanPayload;
	created_by: string | null;
	created_by_name: string | null;
	created_at: string;
}

export interface HistoryPageData {
	planId: string;
	patientNickname: string;
	revisions: RevisionHistoryItem[];
}

export const load: PageServerLoad = async ({
	params,
	locals,
	parent
}): Promise<HistoryPageData> => {
	const { provider } = await parent();

	if (!provider?.organization_id) {
		error(403, 'You must be associated with an organization to view action plan history');
	}

	// Fetch the action plan with all revisions
	const { data: actionPlan, error: planError } = await locals.supabase
		.from('action_plans')
		.select(
			`
			id,
			organization_id,
			patient_nickname,
			action_plan_revisions (
				id,
				version,
				plan_payload,
				revision_type,
				revision_notes,
				what_worked_notes,
				what_didnt_work_notes,
				check_in_summary,
				created_by,
				created_at
			)
		`
		)
		.eq('id', params.id)
		.single();

	if (planError || !actionPlan) {
		error(404, 'Action plan not found');
	}

	// Verify the plan belongs to the provider's organization
	if (actionPlan.organization_id !== provider.organization_id) {
		error(403, 'You can only view action plans from your organization');
	}

	const revisions = actionPlan.action_plan_revisions || [];

	// Get creator names for all revisions
	const creatorIds = [...new Set(revisions.map((r) => r.created_by).filter(Boolean))] as string[];

	let creatorMap: Map<string, string> = new Map();
	if (creatorIds.length > 0) {
		const { data: creators } = await locals.supabase
			.from('provider_profiles')
			.select('id, name, email')
			.in('id', creatorIds);

		if (creators) {
			for (const creator of creators) {
				creatorMap.set(creator.id, creator.name || creator.email);
			}
		}
	}

	// Sort revisions by version descending (newest first)
	const sortedRevisions = revisions
		.sort((a, b) => b.version - a.version)
		.map((revision) => ({
			id: revision.id,
			version: revision.version,
			revision_type: (revision.revision_type || 'edit') as RevisionType,
			revision_notes: revision.revision_notes || null,
			what_worked_notes: revision.what_worked_notes || null,
			what_didnt_work_notes: revision.what_didnt_work_notes || null,
			check_in_summary: (revision.check_in_summary as CheckInSummary) || null,
			plan_payload: revision.plan_payload as PlanPayload,
			created_by: revision.created_by || null,
			created_by_name: revision.created_by ? (creatorMap.get(revision.created_by) ?? null) : null,
			created_at: revision.created_at
		}));

	return {
		planId: actionPlan.id,
		patientNickname: actionPlan.patient_nickname || 'Unnamed Plan',
		revisions: sortedRevisions
	};
};
