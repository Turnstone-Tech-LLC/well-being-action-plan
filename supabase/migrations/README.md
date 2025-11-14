# Supabase Database Migrations

This directory contains SQL migration files for the Well-Being Action Plan provider portal database.

## Migrations

### 001_initial_schema.sql

Initial database schema for provider authentication and link management.

**Creates:**

- `provider_profiles` table - Stores provider account information
- `provider_links` table - Tracks generated patient onboarding links
- Row Level Security (RLS) policies for both tables
- Automatic profile creation trigger on user signup
- Performance indexes
- Updated timestamp triggers

**Tables:**

#### provider_profiles

Extends Supabase auth.users with provider-specific information.

- Automatically created when a user signs up
- Contains name, organization, contact info, and settings
- Protected by RLS - users can only access their own profile

#### provider_links

Stores information about generated provider links for tracking and analytics.

- One-to-many relationship with provider_profiles
- Contains link configuration, encoded URL, QR code URL
- Tracks active status, expiration, and metadata (patient count, etc.)
- Protected by RLS - providers can only access their own links

### 006_onboarding_completions.sql

Adds privacy-first onboarding completion tracking.

**Creates:**

- `onboarding_completions` table - Minimal table tracking when patients complete onboarding
- RLS policies allowing unauthenticated INSERT (patients) and authenticated SELECT (providers)
- Indexes for efficient completion counting

**Tables:**

#### onboarding_completions

Tracks anonymous completion events (timestamp only, no PHI).

- Foreign key to provider_links with CASCADE delete
- Write-only for patients (unauthenticated INSERT allowed)
- Providers can only view completions for their own links
- Privacy-first: only stores timestamp and link reference

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy and paste the migration file contents
5. Click **Run**

### Option 2: Supabase CLI

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Rollback

To rollback the migration, you can manually drop the tables and related objects:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_provider_profiles_updated_at ON provider_profiles;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop tables (will cascade and remove policies)
DROP TABLE IF EXISTS provider_links;
DROP TABLE IF EXISTS provider_profiles;
```

**Warning:** This will permanently delete all provider profiles and links!

## Security

All tables have Row Level Security (RLS) enabled. Policies ensure:

- Providers can only view and modify their own data
- No cross-provider data access
- Automatic enforcement at the database level

## Future Migrations

When adding new migrations:

1. Name them sequentially: `002_description.sql`, `003_description.sql`, etc.
2. Always include both upgrade and rollback instructions
3. Test thoroughly in a development environment first
4. Update this README with migration details
