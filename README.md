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

### Creating a project

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

### Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

---

## License

No license is currently applied while the project remains private and under active development.

Licensing decisions will be revisited as the project matures.

---

## Contact

For questions related to this repository or the WBAP project, please contact the repository owner directly.
