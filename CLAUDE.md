# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Well-Being Action Plan (WBAP) is a privacy-first Progressive Web App for youth mental health support. It uses a **local-first architecture** where all patient data is stored in IndexedDB on the user's device—**never transmitted to servers**. The provider portal uses Supabase Auth, but patient well-being plans remain local-only.

**Critical Privacy Principle**: Patient mental health data must NEVER be logged, transmitted, or stored in cloud services.

## GitHub Workflow

- **Main branch**: `main`
- **All changes** require Pull Requests
- **PR target**: Always create PRs against `main`
- **Pre-commit hooks**: Husky automatically runs ESLint and Prettier on staged files
- **CI**: Type checking, linting, and tests must pass before merge

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Dexie.js (IndexedDB wrapper) for local storage
- **PWA**: @ducanh2912/next-pwa for offline functionality
- **Auth**: Supabase Auth (provider portal only)
- **Package Manager**: pnpm (required)

## Common Commands

### Development

```bash
pnpm dev                    # Start dev server (localhost:3000)
pnpm build                  # Production build
pnpm start                  # Start production server
```

### Testing

```bash
pnpm test                   # Run unit tests (Vitest)
pnpm test:ui                # Run tests with Vitest UI
pnpm test:run               # Run tests once (no watch)
pnpm test:coverage          # Generate coverage report

pnpm test:e2e               # Run E2E tests (Playwright)
pnpm test:e2e:ui            # Run E2E tests with Playwright UI
pnpm test:e2e:headed        # Run E2E tests in headed mode
```

### Code Quality

```bash
pnpm lint                   # Run ESLint (fails on warnings)
pnpm lint:fix               # Auto-fix ESLint issues
pnpm type-check             # Run TypeScript compiler (no emit)
pnpm format                 # Format code with Prettier
pnpm format:check           # Check formatting without changes
```

**Note**: Husky pre-commit hooks automatically run ESLint and Prettier on staged files.

## Architecture Principles

### 1. Local-First Data Storage

All patient data lives in IndexedDB via Dexie.js. The database is defined in `src/lib/db/index.ts` with three main tables:

- **checkIns**: Emotional state tracking with zone, triggers, and coping strategies
- **copingStrategies**: User's coping strategy library with categories and favorites
- **userConfig**: User preferences and app settings

**Database operations**: Always use the exported CRUD functions from `src/lib/db/index.ts` (e.g., `createCheckIn`, `getCheckInsByUser`) rather than direct Dexie queries.

**Schema migrations**: When updating the schema, increment `db.version()` and add migration logic in `.upgrade()` hooks. See extensive comments in `src/lib/db/index.ts` for examples.

### 2. URL-Based Sharing System

WBAP has two distinct URL encoding systems (see `src/lib/utils/urlConfig.ts`):

1. **Plan Sharing** (`?plan=...`):
   - Shares well-being plans between users
   - Uses gzip compression via pako
   - Validates with Zod schemas
   - Target: <2000 chars for browser compatibility

2. **Provider Links** (`?config=...`):
   - Provider-generated onboarding links for patients
   - Contains provider info and preferences
   - Also uses gzip compression for QR code compatibility

**Important**: Base64 encoding is NOT encryption—it's for URL safety only.

### 3. Dual Authentication System

The application implements **two separate authentication systems** to maintain privacy while enabling provider functionality:

#### Provider Authentication (Server-Side)

- **Routes**: `/provider/*` (except `/provider/auth/*`)
- **Method**: Supabase Auth with HTTP-only cookies
- **Middleware**: `src/lib/supabase/middleware.ts` validates sessions
- **Redirect**: Unauthenticated users → `/provider/auth/login`
- **Purpose**: Secure provider portal access, link generation, profile management

#### Patient Authentication (Client-Side)

- **Routes**: `/dashboard`, `/check-in/*`, `/history`, `/settings`
- **Method**: IndexedDB validation via `usePatientAuth` hook
- **Validation**: Checks onboarding completion status
- **Redirect**: Incomplete onboarding → `/onboarding`
- **Purpose**: Ensure patients complete setup before accessing features

**Why Two Systems?**

- **Privacy**: Patient data must stay local (IndexedDB), cannot be validated server-side
- **Edge Middleware Limitation**: Next.js edge middleware cannot access browser APIs like IndexedDB
- **Security**: Provider data requires server-side session validation
- **Separation of Concerns**: Provider and patient data flows are completely independent

**Onboarding Validation Requirements**:

1. Preferred name is set (`preferredName` in userConfig)
2. Onboarding completed flag is true (`onboardingCompleted = true`)
3. At least one coping strategy exists in the database

**Public Routes** (no authentication required):

- `/` - Home page
- `/onboarding/*` - Patient onboarding workflow
- `/provider/auth/*` - Provider authentication pages

### 4. Zone System

The app organizes emotional states into three zones:

- **Green Zone**: Feeling good, baseline strategies
- **Yellow Zone**: Warning signs, early intervention
- **Red Zone**: Crisis state, immediate support needed

Zone types are defined in `src/lib/types/zone.ts` and used throughout check-ins, strategies, and triggers.

## Key File Locations

### Core Data Layer

- `src/lib/db/index.ts` - Dexie database config and all CRUD operations
- `src/lib/types/` - TypeScript type definitions (zone, check-in, coping-strategy, well-being-plan, etc.)
- `src/lib/types/index.ts` - Central export for all types

### Services

- `src/lib/services/actionPlanService.ts` - Action plan business logic
- `src/lib/services/notificationService.ts` - Daily check-in notifications
- `src/lib/services/providerService.ts` - Provider operations

### URL Configuration

- `src/lib/utils/urlConfig.ts` - Plan sharing and provider link encoding/decoding

### Authentication

**Provider Authentication (Server-Side)**:

- `src/lib/supabase/client.ts` - Client-side Supabase
- `src/lib/supabase/server.ts` - Server-side Supabase
- `src/lib/supabase/middleware.ts` - Session management
- `src/middleware.ts` - Next.js middleware for protected routes

**Patient Authentication (Client-Side)**:

- `src/hooks/usePatientAuth.ts` - React hook for route protection
- `src/lib/utils/patientAuth.ts` - Onboarding validation utilities

### UI Components

- `src/components/ui/` - shadcn/ui components (button, card, dialog, etc.)
- `src/components/zone-card.tsx` - Zone-specific UI components

### App Routes

- `src/app/page.tsx` - Home page
- `src/app/dashboard/page.tsx` - User dashboard
- `src/app/check-in/` - Emotional check-in flows (green, yellow, red)
- `src/app/history/page.tsx` - Check-in history
- `src/app/onboarding/` - User onboarding flow
- `src/app/provider/` - Provider portal (auth required)
- `src/app/settings/page.tsx` - User settings

## Development Guidelines

### TypeScript

- **Strict mode** is enabled (`noUncheckedIndexedAccess: true`)
- Always define explicit types for function parameters and returns
- Avoid `any` types—ESLint will warn
- Use the centralized types from `src/lib/types/index.ts`
- Prefix unused parameters with `_` to avoid linting warnings

### React Patterns

- Use functional components with hooks
- Custom hooks for data operations (not currently in `src/hooks/` but use this pattern)
- Components are generally colocated with routes in `src/app/`
- shadcn/ui components should be used for consistent UI

### Styling

- Tailwind CSS utility classes (mobile-first approach)
- Prettier automatically sorts Tailwind classes
- Use `src/lib/utils/index.ts` for `cn()` utility to merge classes
- WCAG 2.1 AA accessibility compliance required

### Accessibility (CRITICAL)

This is a **mental health application** supporting youth—accessibility is non-negotiable:

- Always provide alt text for images
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Maintain proper heading hierarchy (h1 → h2 → h3)
- Include ARIA labels where needed
- Test keyboard navigation
- Ensure sufficient color contrast
- Associate labels with form inputs

ESLint has `eslint-plugin-jsx-a11y` configured to enforce these rules.

### Privacy & Security

**Before adding any feature, ask**: Does this transmit patient data? (Answer must be NO)

- Patient data stays in IndexedDB—never transmitted
- Provider authentication data is the ONLY thing sent to Supabase
- No analytics tracking on patient data
- Crisis resources (988, 741741) must always be accessible

### Crisis Resources

The app prominently displays:

- **988 Suicide & Crisis Lifeline**
- **Crisis Text Line (741741)**
- **Emergency Services (911)**

These must remain accessible in all app states, especially offline.

## Testing

### Unit Tests (Vitest)

- Located alongside source files (e.g., `__tests__/` subdirectories)
- Uses `jsdom` environment for DOM testing
- Setup file: `src/lib/db/__tests__/setup.ts` (uses fake-indexeddb)
- Path alias `@/` configured for imports

### E2E Tests (Playwright)

- Test directory: `e2e/`
- Runs on Chromium in CI
- Automatically starts dev server on `localhost:3000`
- Base URL configured: `http://localhost:3000`

## PWA Configuration

- Service worker generated by `@ducanh2912/next-pwa`
- Disabled in development, enabled in production
- Caching strategies:
  - Static assets: Cache-first
  - Patient data: Local IndexedDB (no network)
- Config in `next.config.mjs`

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
# Required for provider portal (optional for patient features)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App configuration
NEXT_PUBLIC_APP_NAME="Well-Being Action Plan"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Patient-facing features work without Supabase credentials.

## Common Patterns

### Adding a New Database Table

1. Define types in `src/lib/types/`
2. Update `WellBeingDB` class in `src/lib/db/index.ts`:
   - Add `EntityTable` property
   - Increment version number
   - Add to `stores()` with indexes
   - Write `.upgrade()` migration if needed
3. Add CRUD functions below the schema
4. Export from `src/lib/db/index.ts`
5. Add tests in `src/lib/db/__tests__/`

### Creating Shareable URLs

```typescript
import { encodePlanConfig, generateShareableUrl } from '@/lib/utils/urlConfig';

const shareableConfig = {
  title: "My Plan",
  zoneStrategies: [...],
  config: { enableNotifications: true, ... }
};

const url = generateShareableUrl(shareableConfig, 'https://myapp.com');
// Returns: https://myapp.com?plan=eJy...
```

### Accessing IndexedDB

```typescript
import { createCheckIn, getCheckInsByUser } from '@/lib/db';

// Create a check-in
await createCheckIn({
  userId: 'user-123',
  zone: ZoneType.GREEN,
  notes: 'Feeling good today',
  copingStrategyIds: ['strategy-1'],
  triggerIds: [],
});

// Query check-ins
const checkIns = await getCheckInsByUser('user-123', {
  limit: 10,
  zone: ZoneType.GREEN,
});
```

## Deployment

- Deploys to Vercel (zero-config Next.js deployment)
- Production checklist in `docs/ARCHITECTURE.md`
- PWA manifest at `public/manifest.json`
- Icons in `public/icons/`

## Additional Documentation

- Architecture deep-dive: `docs/ARCHITECTURE.md`
- Contributing guidelines: `CONTRIBUTING.md`
- Main README: `README.md`
