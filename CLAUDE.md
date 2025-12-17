# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Well-Being Action Plan - A SvelteKit application for youth well-being support, built in partnership with Golisano Children's Hospital at the University of Vermont Medical Center.

## Tech Stack

- **Framework:** SvelteKit 2 with Svelte 5
- **Styling:** CSS with custom properties (design tokens in `src/routes/layout.css`)
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Testing:** Vitest (unit/component), Playwright (e2e), axe-core (accessibility)

## Common Commands

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run check` - Run svelte-check for type checking
- `pnpm run lint` - Run ESLint and Prettier checks
- `pnpm run format` - Format code with Prettier
- `pnpm run test:unit` - Run Vitest unit tests
- `pnpm run test:e2e` - Run Playwright e2e tests
- `pnpm run test` - Run all tests (unit + e2e)

## Development Workflow

Before committing, ensure code passes all checks:

1. `pnpm run format` - Auto-fix formatting issues
2. `pnpm run lint` - Verify Prettier and ESLint pass
3. `pnpm run check` - Verify TypeScript/Svelte types
4. `pnpm run test:unit -- --run` - Run unit tests

## Testing Requirements

**All feature work must include appropriate tests following the test pyramid:**

1. **Unit Tests** (`src/**/*.test.ts`) - Test utilities, helpers, and pure functions
   - Place test files next to the code they test (e.g., `foo.ts` → `foo.test.ts`)
   - Use `@vitest-environment jsdom` for DOM-dependent tests
   - Run with: `pnpm run test:unit -- --run`

2. **Component Tests** (`src/**/*.svelte.test.ts`) - Test Svelte component behavior
   - Uses Vitest browser mode with Playwright
   - Test component rendering, interactions, and accessibility

3. **E2E Tests** (`e2e/*.test.ts`) - Test full user flows
   - Use for critical user journeys that span multiple pages
   - Includes accessibility testing with axe-core

**Test guidelines:**

- Prefer unit tests over e2e tests when possible (faster, more reliable)
- New components should have accessibility tests
- Run `pnpm run test` before creating PRs

## Accessibility Standards

This application follows WCAG 2.1 AA standards:

- **Semantic HTML:** Use proper heading hierarchy (h1 → h2 → h3), landmarks, and ARIA attributes
- **Keyboard Navigation:** All interactive elements must be keyboard accessible
- **Focus Management:** Focus trap in modals, visible focus indicators
- **Screen Readers:** Use aria-live regions for dynamic content, aria-describedby for help text
- **Motion:** Respect `prefers-reduced-motion` preference
- **Touch Targets:** Minimum 44x44px on touch devices

Accessibility utilities are in `src/lib/a11y/`:

- `createFocusTrap()` - Focus trap for modals
- `announce()` - Screen reader announcements
- `prefersReducedMotion()` - Check motion preference

## Git Conventions

- **Branch naming:** `jordpo/<ticket>` (e.g., `jordpo/TUR-7`)
- **Linear integration:** Issues are tracked in Linear with identifiers like `TUR-7`

## Architecture Notes

- Components live in `src/lib/components/` organized by feature (e.g., `landing/`, `layout/`, `modals/`)
- Routes follow SvelteKit file-based routing in `src/routes/`
- Accessibility utilities live in `src/lib/a11y/`
- UVM brand colors: Catamount Green (`#00594C`), UVM Gold (`#FFC72C`)
- User state is managed at the layout level and passed to components via props
