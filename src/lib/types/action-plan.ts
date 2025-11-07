/**
 * Action Plan types for provider-created well-being action plans
 */

/**
 * Status of an action plan
 */
export type ActionPlanStatus = 'draft' | 'published' | 'archived';

/**
 * Age ranges for action plans
 */
export const AGE_RANGES = [
  'Children (5-12)',
  'Adolescents (13-17)',
  'Young Adults (18-25)',
  'Adults (26-64)',
  'Seniors (65+)',
  'All Ages',
] as const;

export type AgeRange = (typeof AGE_RANGES)[number];

/**
 * Represents an action plan created by a provider
 *
 * @interface ActionPlan
 * @property {string} id - Unique identifier for the action plan
 * @property {string} providerId - ID of the provider who created this plan
 * @property {string} name - Name/title of the action plan
 * @property {AgeRange} [ageRange] - Target age range for this plan
 * @property {string} [notes] - Optional notes or description
 * @property {ActionPlanStatus} status - Current status of the plan
 * @property {string[]} copingStrategyIds - Array of coping strategy IDs included in this plan
 * @property {Date} createdAt - When the plan was created
 * @property {Date} updatedAt - When the plan was last updated
 */
export interface ActionPlan {
  id: string;
  providerId: string;
  name: string;
  ageRange?: AgeRange;
  notes?: string;
  status: ActionPlanStatus;
  copingStrategyIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type for creating a new action plan (without generated fields)
 */
export type CreateActionPlan = Omit<ActionPlan, 'id' | 'createdAt' | 'updatedAt'> & {
  status?: ActionPlanStatus;
  copingStrategyIds?: string[];
};

/**
 * Type for updating an existing action plan (all fields optional except id)
 */
export type UpdateActionPlan = Partial<Omit<ActionPlan, 'id' | 'providerId'>> & {
  id: string;
};

/**
 * Basic info form data for the first step of plan creation
 */
export interface ActionPlanBasicInfo {
  name: string;
  ageRange?: AgeRange;
  notes?: string;
}
