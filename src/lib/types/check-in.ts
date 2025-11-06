import { ZoneType } from './zone';

/**
 * Represents a check-in entry where a user records their current emotional state.
 *
 * @interface CheckIn
 * @property {string} id - Unique identifier for the check-in
 * @property {string} userId - ID of the user who created this check-in
 * @property {Date} timestamp - When the check-in was recorded
 * @property {ZoneType} zone - The emotional zone the user is currently in
 * @property {string} [notes] - Optional notes about how the user is feeling
 * @property {string[]} [triggerIds] - Optional IDs of triggers that may have contributed to this state
 * @property {string[]} [copingStrategyIds] - Optional IDs of coping strategies used or planned
 * @property {number} [moodRating] - Optional numeric mood rating (e.g., 1-10 scale)
 */
export interface CheckIn {
  id: string;
  userId: string;
  timestamp: Date;
  zone: ZoneType;
  notes?: string;
  triggerIds?: string[];
  copingStrategyIds?: string[];
  moodRating?: number;
}

/**
 * Type for creating a new check-in (without generated fields)
 */
export type CreateCheckIn = Omit<CheckIn, 'id' | 'timestamp'> & {
  timestamp?: Date;
};

/**
 * Type for updating an existing check-in (all fields optional except id)
 */
export type UpdateCheckIn = Partial<Omit<CheckIn, 'id'>> & {
  id: string;
};
