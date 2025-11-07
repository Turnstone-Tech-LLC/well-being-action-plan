/**
 * Core type definitions for the Well-Being Action Plan application.
 *
 * This module exports all domain types used throughout the application.
 * Types are organized by domain entity and follow strict TypeScript conventions.
 *
 * @module types
 */

// Zone types and enums
export { ZoneType, isZoneType } from './zone';

// Coping Strategy types
export {
  CopingStrategyCategory,
  type CopingStrategy,
  type CreateCopingStrategy,
  type UpdateCopingStrategy,
} from './coping-strategy';

// Check-in types
export { type CheckIn, type CreateCheckIn, type UpdateCheckIn } from './check-in';

// User types
export {
  UserRole,
  type ContactInfo,
  type User,
  type Patient,
  type CreateUser,
  type UpdateUser,
} from './user';

// Well-Being Plan types
export {
  type Trigger,
  type ZoneStrategies,
  type WellBeingPlanConfig,
  type WellBeingPlan,
  type CreateWellBeingPlan,
  type UpdateWellBeingPlan,
  DEFAULT_PLAN_CONFIG,
} from './well-being-plan';

// Provider types
export {
  type ProviderInfo,
  type ProviderLinkConfig,
  type ProviderLinkParseResult,
} from './provider';

// Action Plan types
export {
  type ActionPlan,
  type ActionPlanStatus,
  type AgeRange,
  type CreateActionPlan,
  type UpdateActionPlan,
  type ActionPlanBasicInfo,
  AGE_RANGES,
} from './action-plan';
