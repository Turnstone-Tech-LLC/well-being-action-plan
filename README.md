# Well-Being Action Plan (WBAP)

This repository contains the source code for the Well-Being Action Plan (WBAP) application.

WBAP is a privacy-first web application that supports the Well-Being Action Plan as a **shared protocol** between providers and patients. It is designed to encourage collaboration, reflection, and trust — without continuous monitoring or centralized storage of patient check-in data.

This repository is currently private while the application and protocol are under active development.

---

## Project intent

WBAP is built around a small set of guiding principles:

- **Shared protocol, not surveillance**
  Plans are created together during a visit. Daily check-ins remain private to the patient and are not automatically shared.

- **Patient-owned data**
  Patient check-ins are stored locally on the patient's device. Providers only see insights when the patient chooses to share them during follow-up sessions.

- **Intentional feedback loops**
  The primary opportunity for feedback and adjustment occurs during scheduled provider–patient check-ins, not continuously.

- **Privacy by design**
  Temporary setup links, encrypted backups, and clear data boundaries are foundational to the system.

---

## High-level overview

At a high level, WBAP works as follows:

1. A provider and patient create a Well-Being Action Plan together during a visit.
2. The patient installs the application using a temporary link or QR code provided during onboarding.
3. The patient uses the app privately between visits to check in and reflect.
4. During follow-up visits, the patient can choose to share a summary of insights.
5. The provider updates the plan based on what is working and what is not.

Patient check-ins are never automatically transmitted to the backend.

---

## Application structure

The application is delivered via a single URL and supports two distinct modes:

### Patient mode

- Accessed via temporary install or update links
- No account creation
- Local-only storage for check-ins (IndexedDB)
- Encrypted backups for patient-controlled recovery

### Provider mode

- Invite-only access
- Email-based authentication
- Scoped to an organization
- Used to create, revise, and distribute action plans

Provider-side data includes plan definitions, revisions, install events, and in-session feedback metadata. It does not include patient check-in logs.

---

## Data boundaries

WBAP intentionally enforces strict data separation:

- **Provider backend**
  - Action plans and revisions
  - Distribution tokens
  - Install tracking
  - Provider session notes

- **Patient device**
  - Daily check-ins
  - Reflections and outcomes
  - Local plan snapshots
  - Encrypted backups

No background synchronization of patient check-ins occurs.

---

## Status

WBAP is under active development and experimentation.

- The data model, flows, and UX are still evolving.
- APIs, schemas, and behaviors may change without notice.
- This repository is not yet intended for external use or contribution.

---

## Development

This project is built with [SvelteKit](https://kit.svelte.dev/), powered by [`sv`](https://github.com/sveltejs/cli).

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) (required for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Local Supabase Setup

The project uses Supabase for authentication and database. For local development, run Supabase locally via Docker:

```sh
# Start local Supabase (runs PostgreSQL, Auth, Storage, etc.)
supabase start

# Stop Supabase when done
supabase stop
```

After starting, Supabase outputs connection details. Update your `.env` file with local values:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key from supabase start>
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
```

#### Database Migrations

```sh
# Apply all migrations and seed data
supabase db reset

# Check current migration status
supabase db status
```

### Email Testing with Inbucket

Local Supabase includes [Inbucket](https://inbucket.org/), an email testing tool that captures all outgoing emails (magic links, invitations, etc.).

**Access the Inbucket dashboard:** http://127.0.0.1:54324

When testing authentication:

1. Enter an email on the login page
2. Open Inbucket dashboard to view the captured email
3. Click the magic link in the email to complete sign-in

> **Note:** Magic links in Inbucket redirect to `http://localhost:5173/auth/callback`. Ensure the dev server is running on port 5173.

### Developing

Install dependencies and start the development server:

```sh
pnpm install
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

### Building

To create a production version of your app:

```sh
pnpm run build
```

You can preview the production build with `pnpm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

### Database Seeding

The project includes seed data matching the WBAP 2.0 physical card. Running `supabase db reset` automatically applies migrations and seeds the database.

#### What Gets Seeded

**Automatically created (local development):**

- **Admin User**: `admin@wbap.local` (use Inbucket to receive magic link)
- **Organization**: UVM Children's Hospital

**Resources:**

- **Skills** (21 total across 4 categories):
  - Physical: Move my body, Go outside, Get sleep, Eat well, Shower/bath, Take a break
  - Creative: Read, Write/journal, Draw/paint, Craft/create, Listen/play music
  - Social: Play games, Play with pets, Help others, Family time, Friend time, Talk to adult
  - Mindfulness: Pray/meditate, Laugh, Focus positive, Deep breaths
- **Supportive Adult Types** (7): Parent/guardian, Sibling, Grandparent, Therapist, Coach, Teacher, Other
- **Help Methods** (4): Emotion help, More coping skills, Better use skills, Professional help
- **Crisis Resources** (2): Crisis Text Line (741741), 988 Suicide Prevention Line

#### Manual Admin Creation

If you need to create an additional admin provider via SQL:

```sql
SELECT seed_admin_provider('provider@example.com');
```

---

## License

No license is currently applied while the project remains private and under active development.

Licensing decisions will be revisited as the project matures.

---

## Contact

For questions related to this repository or the WBAP project, please contact the repository owner directly.
