/**
 * Categories for organizing coping strategies
 */
export enum CopingStrategyCategory {
  Breathing = 'breathing',
  Physical = 'physical',
  Social = 'social',
  Emotional = 'emotional',
  Cognitive = 'cognitive',
  Sensory = 'sensory',
  Creative = 'creative',
  Spiritual = 'spiritual',
  Other = 'other',
}

/**
 * Represents a coping strategy that can help a user manage their well-being.
 *
 * @interface CopingStrategy
 * @property {string} id - Unique identifier for the coping strategy
 * @property {string} title - Short title of the coping strategy (e.g., "Deep breathing")
 * @property {string} description - Detailed description of how to perform this strategy
 * @property {CopingStrategyCategory} category - Category classification for the strategy
 * @property {Date} [createdAt] - Timestamp when the strategy was created
 * @property {Date} [updatedAt] - Timestamp when the strategy was last updated
 * @property {boolean} [isFavorite] - Whether this strategy is marked as a favorite by the user
 */
export interface CopingStrategy {
  id: string;
  title: string;
  description: string;
  category: CopingStrategyCategory;
  createdAt?: Date;
  updatedAt?: Date;
  isFavorite?: boolean;
}

/**
 * Type for creating a new coping strategy (without generated fields)
 */
export type CreateCopingStrategy = Omit<CopingStrategy, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for updating an existing coping strategy (all fields optional except id)
 */
export type UpdateCopingStrategy = Partial<Omit<CopingStrategy, 'id'>> & {
  id: string;
};
