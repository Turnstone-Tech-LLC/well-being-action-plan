/**
 * Roles within the well-being action plan system
 */
export enum UserRole {
  Patient = 'patient',
  Supporter = 'supporter',
  Professional = 'professional',
}

/**
 * Contact information for emergency or support purposes
 */
export interface ContactInfo {
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

/**
 * Represents a user of the well-being action plan system.
 * This can be a patient (primary user), a supporter, or a mental health professional.
 *
 * @interface User
 * @property {string} id - Unique identifier for the user
 * @property {string} [email] - Email address (optional for offline-first use)
 * @property {string} name - Display name of the user
 * @property {UserRole} role - Role of the user in the system
 * @property {Date} createdAt - When the user account was created
 * @property {Date} [updatedAt] - When the user account was last updated
 * @property {string} [profilePictureUrl] - URL to the user's profile picture
 * @property {Date} [dateOfBirth] - User's date of birth (for patients)
 * @property {ContactInfo[]} [emergencyContacts] - List of emergency contacts
 * @property {string} [timezone] - User's timezone (e.g., "America/New_York")
 */
export interface User {
  id: string;
  email?: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt?: Date;
  profilePictureUrl?: string;
  dateOfBirth?: Date;
  emergencyContacts?: ContactInfo[];
  timezone?: string;
}

/**
 * Type alias for User when used in the context of a patient
 * (the primary user of a well-being action plan)
 */
export type Patient = User & {
  role: UserRole.Patient;
};

/**
 * Type for creating a new user (without generated fields)
 */
export type CreateUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for updating an existing user (all fields optional except id)
 */
export type UpdateUser = Partial<Omit<User, 'id'>> & {
  id: string;
};
