import { ZoneType } from './zone';

/**
 * Represents a trigger or warning sign that may affect well-being
 */
export interface Trigger {
  id: string;
  title: string;
  description?: string;
  zone: ZoneType;
  createdAt?: Date;
}

/**
 * Strategies specific to a particular zone
 */
export interface ZoneStrategies {
  zone: ZoneType;
  copingStrategyIds: string[];
  triggers: Trigger[];
  notes?: string;
}

/**
 * Configuration options for the well-being plan
 *
 * @interface WellBeingPlanConfig
 * @property {boolean} enableNotifications - Whether to enable push notifications
 * @property {boolean} enableCheckInReminders - Whether to send check-in reminders
 * @property {number} [checkInFrequencyHours] - How often to remind user to check in (in hours)
 * @property {string[]} [reminderTimes] - Specific times for reminders (e.g., ["09:00", "17:00"])
 * @property {boolean} shareWithSupporters - Whether to share plan data with supporters
 * @property {string[]} [sharedUserIds] - IDs of users who have access to this plan
 * @property {boolean} enableDataSync - Whether to sync data with cloud storage
 * @property {string} [theme] - UI theme preference (e.g., "light", "dark", "auto")
 */
export interface WellBeingPlanConfig {
  enableNotifications: boolean;
  enableCheckInReminders: boolean;
  checkInFrequencyHours?: number;
  reminderTimes?: string[];
  shareWithSupporters: boolean;
  sharedUserIds?: string[];
  enableDataSync: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Represents a complete well-being action plan for a user.
 * This is the main document that ties together all strategies, check-ins, and configurations.
 *
 * @interface WellBeingPlan
 * @property {string} id - Unique identifier for the plan
 * @property {string} userId - ID of the user (patient) who owns this plan
 * @property {string} title - Title or name for this plan
 * @property {string} [description] - Optional description of the plan's purpose or goals
 * @property {Date} createdAt - When the plan was created
 * @property {Date} [updatedAt] - When the plan was last updated
 * @property {Date} [lastReviewedAt] - When the plan was last reviewed with a professional
 * @property {ZoneStrategies[]} zoneStrategies - Strategies organized by zone
 * @property {WellBeingPlanConfig} config - Configuration settings for the plan
 * @property {boolean} isActive - Whether this plan is currently active
 * @property {string[]} [goalIds] - Optional IDs of personal goals associated with this plan
 */
export interface WellBeingPlan {
  id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
  lastReviewedAt?: Date;
  zoneStrategies: ZoneStrategies[];
  config: WellBeingPlanConfig;
  isActive: boolean;
  goalIds?: string[];
}

/**
 * Default configuration for a new well-being plan
 */
export const DEFAULT_PLAN_CONFIG: WellBeingPlanConfig = {
  enableNotifications: true,
  enableCheckInReminders: true,
  checkInFrequencyHours: 24,
  shareWithSupporters: false,
  enableDataSync: false,
  theme: 'auto',
};

/**
 * Type for creating a new well-being plan (without generated fields)
 */
export type CreateWellBeingPlan = Omit<WellBeingPlan, 'id' | 'createdAt' | 'updatedAt'> & {
  config?: Partial<WellBeingPlanConfig>;
};

/**
 * Type for updating an existing well-being plan (all fields optional except id)
 */
export type UpdateWellBeingPlan = Partial<Omit<WellBeingPlan, 'id'>> & {
  id: string;
};
