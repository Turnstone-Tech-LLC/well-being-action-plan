/**
 * Action Plan Service
 *
 * Provides methods for managing provider-created action plans
 */

import { createClient } from '@/lib/supabase/client';
import type { ActionPlan, CreateActionPlan, UpdateActionPlan } from '@/lib/types';

/**
 * Database row type for action_plans table
 */
interface ActionPlanRow {
  id: string;
  provider_id: string;
  name: string;
  age_range: string | null;
  notes: string | null;
  status: 'draft' | 'published' | 'archived';
  coping_strategy_ids: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Convert database row to ActionPlan type
 */
function rowToActionPlan(row: ActionPlanRow): ActionPlan {
  return {
    id: row.id,
    providerId: row.provider_id,
    name: row.name,
    ageRange: row.age_range as ActionPlan['ageRange'],
    notes: row.notes || undefined,
    status: row.status,
    copingStrategyIds: row.coping_strategy_ids,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert ActionPlan to database row format
 */
function actionPlanToRow(plan: CreateActionPlan | UpdateActionPlan): Partial<ActionPlanRow> {
  return {
    ...(('id' in plan && plan.id) ? { id: plan.id } : {}),
    ...('providerId' in plan ? { provider_id: plan.providerId } : {}),
    ...(plan.name ? { name: plan.name } : {}),
    ...(plan.ageRange !== undefined ? { age_range: plan.ageRange || null } : {}),
    ...(plan.notes !== undefined ? { notes: plan.notes || null } : {}),
    ...(plan.status ? { status: plan.status } : {}),
    ...(plan.copingStrategyIds ? { coping_strategy_ids: plan.copingStrategyIds } : {}),
  };
}

/**
 * Create a new action plan
 */
async function createActionPlan(plan: CreateActionPlan): Promise<ActionPlan> {
  const supabase = createClient();

  const row = actionPlanToRow({
    ...plan,
    status: plan.status || 'draft',
    copingStrategyIds: plan.copingStrategyIds || [],
  });

  const { data, error } = await supabase
    .from('action_plans')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create action plan: ${error.message}`);
  }

  return rowToActionPlan(data as ActionPlanRow);
}

/**
 * Get an action plan by ID
 */
async function getActionPlan(id: string): Promise<ActionPlan | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get action plan: ${error.message}`);
  }

  return rowToActionPlan(data as ActionPlanRow);
}

/**
 * Get all action plans for a provider
 */
async function getProviderActionPlans(
  providerId: string,
  options?: {
    status?: 'draft' | 'published' | 'archived';
    limit?: number;
    offset?: number;
  }
): Promise<ActionPlan[]> {
  const supabase = createClient();

  let query = supabase
    .from('action_plans')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get provider action plans: ${error.message}`);
  }

  return (data as ActionPlanRow[]).map(rowToActionPlan);
}

/**
 * Update an existing action plan
 */
async function updateActionPlan(plan: UpdateActionPlan): Promise<ActionPlan> {
  const supabase = createClient();

  const row = actionPlanToRow(plan);

  const { data, error } = await supabase
    .from('action_plans')
    .update(row)
    .eq('id', plan.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update action plan: ${error.message}`);
  }

  return rowToActionPlan(data as ActionPlanRow);
}

/**
 * Delete an action plan
 */
async function deleteActionPlan(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('action_plans')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete action plan: ${error.message}`);
  }
}

/**
 * Get action plan statistics for a provider
 */
async function getActionPlanStats(providerId: string): Promise<{
  total: number;
  draft: number;
  published: number;
  archived: number;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('action_plans')
    .select('status')
    .eq('provider_id', providerId);

  if (error) {
    throw new Error(`Failed to get action plan stats: ${error.message}`);
  }

  const stats = {
    total: data.length,
    draft: 0,
    published: 0,
    archived: 0,
  };

  data.forEach((row) => {
    if (row.status === 'draft') stats.draft++;
    else if (row.status === 'published') stats.published++;
    else if (row.status === 'archived') stats.archived++;
  });

  return stats;
}

export const actionPlanService = {
  createActionPlan,
  getActionPlan,
  getProviderActionPlans,
  updateActionPlan,
  deleteActionPlan,
  getActionPlanStats,
};
