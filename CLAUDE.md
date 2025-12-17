# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Well-Being Action Plan - A SvelteKit application for youth well-being support, built in partnership with Golisano Children's Hospital at the University of Vermont Medical Center.

## Tech Stack

- **Framework:** SvelteKit 2 with Svelte 5
- **Styling:** CSS with custom properties (design tokens in `src/routes/layout.css`)
- **Language:** TypeScript
- **Package Manager:** pnpm

## Common Commands

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run check` - Run svelte-check for type checking
- `pnpm run lint` - Run ESLint and Prettier checks
- `pnpm run format` - Format code with Prettier
- `pnpm run test` - Run Vitest tests
- `pnpm run test:e2e` - Run Playwright e2e tests

## Development Workflow

Before committing, ensure code passes linting and type checks:

1. `pnpm run format` - Auto-fix formatting issues
2. `pnpm run lint` - Verify Prettier and ESLint pass
3. `pnpm run check` - Verify TypeScript/Svelte types

## Git Conventions

- **Branch naming:** `jordpo/<ticket>` (e.g., `jordpo/TUR-7`)
- **Linear integration:** Issues are tracked in Linear with identifiers like `TUR-7`

## Architecture Notes

- Components live in `src/lib/components/` organized by feature (e.g., `landing/`, `layout/`, `modals/`)
- Routes follow SvelteKit file-based routing in `src/routes/`
- UVM brand colors: Catamount Green (`#00594C`), UVM Gold (`#FFC72C`)
- User state is managed at the layout level and passed to components via props
