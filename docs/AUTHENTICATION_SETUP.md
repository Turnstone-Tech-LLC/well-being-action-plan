# Authentication Setup Guide

This guide explains the dual authentication system used in the Well-Being Action Plan application.

## Overview

The application implements **two separate authentication systems** to maintain privacy while enabling provider functionality:

1. **Provider Authentication**: Server-side Supabase Auth for provider portal access
2. **Patient Authentication**: Client-side IndexedDB validation for patient route protection

## Architecture

### Dual Authentication System

```
┌─────────────────────────────────────────────────────────────────┐
│                    WELL-BEING ACTION PLAN                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PROVIDER ROUTES (/provider/*)                                 │
│  ├─ Authentication: Supabase Auth (Server-Side)                │
│  ├─ Session: HTTP-only cookies                                 │
│  ├─ Middleware: src/lib/supabase/middleware.ts                 │
│  └─ Redirect: /provider/auth/login if not authenticated        │
│                                                                 │
│  PATIENT ROUTES (/dashboard, /check-in, /history, /settings)   │
│  ├─ Authentication: IndexedDB validation (Client-Side)         │
│  ├─ Validation: usePatientAuth hook                            │
│  ├─ Check: Onboarding completion status                        │
│  └─ Redirect: /onboarding if not complete                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Provider Authentication Flow

1. Provider signs up/signs in via Supabase Auth
2. Profile automatically created in provider_profiles table (via trigger)
3. Provider can create/manage patient onboarding links
4. Links and metadata stored in provider_links table
5. All operations protected by Row Level Security (RLS)
6. Middleware validates session on every request

### Patient Authentication Flow

1. Patient receives provider-generated onboarding link
2. Patient completes 3-step onboarding workflow
3. Onboarding data stored in local IndexedDB:
   - Preferred name
   - Selected coping strategies
   - Notification preferences
   - Onboarding completion flag
4. Protected routes check IndexedDB for completion status
5. Redirect to onboarding if validation fails

### Privacy-First Design

**Patient Data**:

- ✅ Stored locally in IndexedDB only
- ✅ Never transmitted to servers
- ✅ No authentication tokens or sessions
- ✅ Validated client-side only

**Provider Data**:

- ✅ Stored in Supabase database
- ✅ Protected by Row Level Security
- ✅ Session-based authentication
- ✅ No access to patient mental health data

## Prerequisites

- Node.js >= 22.0.0
- pnpm >= 9.0.0
- A Supabase account (free tier works fine)

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the project details:
   - **Name**: well-being-action-plan (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose the region closest to your users
5. Wait for the project to be provisioned (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")

## Step 3: Configure Environment Variables

1. Open `.env.local` in the project root
2. Replace the placeholder values with your actual Supabase credentials:

```bash
# Provider Portal (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here

# App Configuration
NEXT_PUBLIC_APP_NAME="Well-Being Action Plan"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Run Database Migrations

### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click **Run** to execute the migration

The migration will create:

- `provider_profiles` table
- `provider_links` table
- Row Level Security (RLS) policies
- Automatic profile creation trigger
- Indexes for performance

### Option B: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed:

```bash
# Initialize Supabase in your project
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Step 5: Verify Database Setup

1. In Supabase dashboard, go to **Database** → **Tables**
2. You should see two tables:
   - `provider_profiles`
   - `provider_links`
3. Click on each table and verify the **Policies** tab shows RLS policies

## Step 6: Configure Authentication Settings (Optional)

1. Go to **Authentication** → **Settings**
2. Configure email settings:
   - **Enable Email Confirmations**: Recommended for production
   - **Email Templates**: Customize signup/login emails
3. Configure password requirements:
   - Minimum length: 8 characters (default)
   - Require special characters (optional)

## Step 7: Test the Authentication Flow

1. Start the development server:

```bash
pnpm dev
```

2. Navigate to `http://localhost:3000/provider/auth/signup`

3. Create a test provider account:
   - Fill in your name, email, organization
   - Create a password (min 8 characters)
   - Click "Create account"

4. You should be redirected to the login page

5. Sign in with your credentials

6. You should see the provider dashboard with your name displayed

7. Try creating a patient link in the Link Generator

## Patient Route Protection

### Implementation

Patient routes are protected using a client-side authentication hook that validates onboarding completion.

**Protected Routes**:

- `/dashboard` - Main patient dashboard
- `/check-in/*` - Emotional check-in flows (green, yellow, red)
- `/history` - Check-in history calendar
- `/settings` - User settings and preferences

**Public Routes**:

- `/` - Home page
- `/onboarding/*` - Onboarding workflow (steps 1-3)
- `/provider/auth/*` - Provider authentication pages

### Validation Requirements

For a patient to access protected routes, the following must be present in IndexedDB:

1. **Preferred Name**: User's chosen display name
2. **Onboarding Completed Flag**: `onboardingCompleted = true`
3. **At Least One Coping Strategy**: User has selected/created strategies

### Using the usePatientAuth Hook

```typescript
import { usePatientAuth } from '@/hooks/usePatientAuth';

export default function ProtectedPage() {
  const { loading: authLoading, isOnboardingComplete } = usePatientAuth();

  // Show loading state while checking authentication
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // Hook will automatically redirect if onboarding is not complete
  if (!isOnboardingComplete) {
    return null;
  }

  // Render protected content
  return <div>Protected content here</div>;
}
```

### Manual Validation

You can also manually check onboarding status:

```typescript
import { checkPatientOnboarding, isPatientOnboardingComplete } from '@/lib/utils/patientAuth';

// Get detailed status
const status = await checkPatientOnboarding('patient');
console.log(status.isComplete); // boolean
console.log(status.missingSteps); // array of missing requirements

// Simple boolean check
const isComplete = await isPatientOnboardingComplete('patient');
```

## Database Schema

### provider_profiles

| Column       | Type      | Description                           |
| ------------ | --------- | ------------------------------------- |
| id           | UUID      | Primary key, references auth.users.id |
| email        | TEXT      | Provider's email address              |
| name         | TEXT      | Provider's full name                  |
| organization | TEXT      | Optional organization name            |
| logo_url     | TEXT      | Optional logo/profile picture URL     |
| contact_info | JSONB     | Phone, email, website                 |
| settings     | JSONB     | Provider preferences and defaults     |
| created_at   | TIMESTAMP | Account creation timestamp            |
| updated_at   | TIMESTAMP | Last update timestamp                 |

### provider_links

| Column      | Type      | Description                          |
| ----------- | --------- | ------------------------------------ |
| id          | UUID      | Primary key                          |
| provider_id | UUID      | Foreign key to provider_profiles.id  |
| link_config | JSONB     | Complete provider link configuration |
| slug        | TEXT      | Vermont-inspired friendly URL slug   |
| qr_code_url | TEXT      | Optional QR code image URL           |
| created_at  | TIMESTAMP | Link creation timestamp              |
| expires_at  | TIMESTAMP | Optional expiration date             |
| is_active   | BOOLEAN   | Whether link is currently active     |
| metadata    | JSONB     | Patient count, last accessed, notes  |

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled. Providers can only:

- View their own profile
- Update their own profile
- View their own links
- Create/update/delete their own links

### Authentication Middleware

The middleware (`src/middleware.ts`) automatically:

- Refreshes auth sessions
- Protects `/provider/*` routes (requires authentication)
- Redirects unauthenticated users to login
- Redirects authenticated users away from auth pages

### Automatic Profile Creation

When a user signs up, a database trigger automatically creates their profile in `provider_profiles` using metadata from the signup form.

## Authentication Context API

The `AuthContext` provides the following:

```typescript
const {
  user, // Current Supabase user object
  profile, // Provider profile from database
  loading, // Loading state
  signIn, // Function to sign in
  signUp, // Function to sign up
  signOut, // Function to sign out
  updateProfile, // Function to update profile
} = useAuth();
```

## Provider Service API

The `providerService` provides methods for managing provider data:

```typescript
// Profile management
await providerService.upsertProfile(profile);
await providerService.getProfile(providerId);
await providerService.updateSettings(providerId, settings);

// Link management
await providerService.createLink(providerId, linkConfig, { expiresAt, slug });
await providerService.getActiveLinks(providerId);
await providerService.updateLinkStatus(linkId, isActive);
await providerService.deleteLink(linkId);

// Statistics
await providerService.getLinkStats(providerId);
```

## File Structure

```
src/
├── app/
│   └── provider/
│       ├── auth/
│       │   ├── login/page.tsx        # Login page
│       │   └── signup/page.tsx       # Signup page
│       ├── layout.tsx                # Provider layout with auth
│       └── page.tsx                  # Dashboard with stats
├── lib/
│   ├── contexts/
│   │   └── AuthContext.tsx           # Auth context provider
│   ├── services/
│   │   └── providerService.ts        # Database operations
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   └── middleware.ts             # Auth middleware
│   └── types/
│       └── provider.ts               # TypeScript types
├── middleware.ts                     # Next.js middleware
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql    # Database schema

```

## Troubleshooting

### "Invalid API key" error

- Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Make sure you copied the **anon/public** key, not the service role key
- Restart the dev server after changing environment variables

### "Row not found" error when loading profile

- Make sure the database migration ran successfully
- Check if the trigger `on_auth_user_created` exists in your database
- Manually insert a profile row if needed

### User can't sign up

- Check Authentication settings in Supabase dashboard
- Look for error messages in browser console
- Verify email confirmation settings

### Protected routes not working

- Check that `src/middleware.ts` exists
- Verify the middleware config matcher is correct
- Clear cookies and try again

### Stats not loading on dashboard

- Check browser console for errors
- Verify RLS policies are set up correctly
- Make sure the provider_links table exists

## Production Deployment

### Environment Variables

Set these in your production environment (Vercel, Netlify, etc.):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Supabase Configuration

1. **Email Templates**: Customize for your branding
2. **Email Confirmations**: Enable for security
3. **Rate Limiting**: Configure based on expected traffic
4. **Custom Domain**: Optional, for branded auth emails

### Security Checklist

- [ ] Environment variables are set correctly
- [ ] RLS policies are enabled and tested
- [ ] Email confirmation is enabled
- [ ] Strong password requirements configured
- [ ] Database backups configured
- [ ] Auth rate limiting enabled
- [ ] Custom domain configured (optional)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the [GitHub Issues](https://github.com/Turnstone-Tech-LLC/well-being-action-plan/issues)
3. Join our community discussions
4. Contact support at your organization

## Next Steps

After setting up authentication:

1. Customize provider profile settings
2. Create patient onboarding links
3. Share links with your patients
4. Monitor usage statistics on the dashboard
5. Configure email templates in Supabase

---

**Remember**: Patient data stays on their devices. This authentication system only manages provider accounts and link tracking.
