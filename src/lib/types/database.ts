/**
 * Database types for Supabase tables.
 * These types match the database schema defined in supabase/migrations/.
 */

/**
 * Organization settings stored as JSONB.
 */
export interface OrganizationSettings {
	[key: string]: unknown;
}

/**
 * Database row for organizations table.
 */
export interface Organization {
	id: string;
	name: string;
	slug: string;
	settings: OrganizationSettings;
	created_at: string;
	updated_at: string;
}

/**
 * Provider role types.
 */
export type ProviderRole = 'admin' | 'provider';

/**
 * Provider settings stored as JSONB.
 */
export interface ProviderSettings {
	[key: string]: unknown;
}

/**
 * Database row for provider_profiles table.
 */
export interface ProviderProfile {
	id: string;
	organization_id: string;
	email: string;
	name: string | null;
	role: ProviderRole;
	settings: ProviderSettings;
	created_at: string;
	updated_at: string;
}

/**
 * Skill categories for Green Zone coping strategies.
 */
export type SkillCategory = 'physical' | 'creative' | 'social' | 'mindfulness' | string;

/**
 * Database row for skills table (Green Zone).
 */
export interface Skill {
	id: string;
	organization_id: string | null;
	title: string;
	category: SkillCategory | null;
	has_fill_in: boolean;
	fill_in_prompt: string | null;
	display_order: number;
	is_active: boolean;
	created_at: string;
}

/**
 * Database row for supportive_adult_types table.
 */
export interface SupportiveAdultType {
	id: string;
	organization_id: string | null;
	label: string;
	has_fill_in: boolean;
	display_order: number;
	is_active: boolean;
	created_at: string;
}

/**
 * Database row for help_methods table (Yellow Zone).
 */
export interface HelpMethod {
	id: string;
	organization_id: string | null;
	title: string;
	description: string | null;
	display_order: number;
	is_active: boolean;
	created_at: string;
}

/**
 * Contact type for crisis resources.
 */
export type CrisisContactType = 'phone' | 'text' | 'website';

/**
 * Database row for crisis_resources table (Red Zone).
 */
export interface CrisisResource {
	id: string;
	organization_id: string | null;
	name: string;
	contact: string;
	contact_type: CrisisContactType | null;
	description: string | null;
	display_order: number;
	is_active: boolean;
	created_at: string;
}

/**
 * Insert types (for creating new records).
 * These omit auto-generated fields.
 */

export type OrganizationInsert = Omit<Organization, 'id' | 'created_at' | 'updated_at'> & {
	id?: string;
	created_at?: string;
	updated_at?: string;
};

export type ProviderProfileInsert = Omit<ProviderProfile, 'created_at' | 'updated_at'> & {
	name?: string | null;
	role?: ProviderRole;
	settings?: ProviderSettings;
	created_at?: string;
	updated_at?: string;
};

export type SkillInsert = Omit<Skill, 'id' | 'created_at'> & {
	id?: string;
	organization_id?: string | null;
	category?: SkillCategory | null;
	has_fill_in?: boolean;
	fill_in_prompt?: string | null;
	display_order?: number;
	is_active?: boolean;
	created_at?: string;
};

export type SupportiveAdultTypeInsert = Omit<SupportiveAdultType, 'id' | 'created_at'> & {
	id?: string;
	organization_id?: string | null;
	has_fill_in?: boolean;
	display_order?: number;
	is_active?: boolean;
	created_at?: string;
};

export type HelpMethodInsert = Omit<HelpMethod, 'id' | 'created_at'> & {
	id?: string;
	organization_id?: string | null;
	description?: string | null;
	display_order?: number;
	is_active?: boolean;
	created_at?: string;
};

export type CrisisResourceInsert = Omit<CrisisResource, 'id' | 'created_at'> & {
	id?: string;
	organization_id?: string | null;
	contact_type?: CrisisContactType | null;
	description?: string | null;
	display_order?: number;
	is_active?: boolean;
	created_at?: string;
};

/**
 * Update types (for updating existing records).
 * All fields are optional.
 */

export type OrganizationUpdate = Partial<Omit<Organization, 'id' | 'created_at'>>;

export type ProviderProfileUpdate = Partial<Omit<ProviderProfile, 'id' | 'created_at'>>;

export type SkillUpdate = Partial<Omit<Skill, 'id' | 'created_at'>>;

export type SupportiveAdultTypeUpdate = Partial<Omit<SupportiveAdultType, 'id' | 'created_at'>>;

export type HelpMethodUpdate = Partial<Omit<HelpMethod, 'id' | 'created_at'>>;

export type CrisisResourceUpdate = Partial<Omit<CrisisResource, 'id' | 'created_at'>>;
