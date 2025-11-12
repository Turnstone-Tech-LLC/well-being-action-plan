# AI Agent Instructions for Well-Being Action Plan (WBAP)

**For comprehensive technical documentation, architecture details, and development guidelines, see [CLAUDE.md](./CLAUDE.md).**

## Quick Reference

This is a privacy-first mental health PWA for youth. Traffic light system (Green/Yellow/Red zones) helps patients recognize emotional states and access coping strategies.

### Critical Constraints

1. **Privacy-First**: Patient data NEVER leaves the device (IndexedDB only)
2. **Offline-Capable**: Must function without internet (PWA)
3. **Accessibility**: WCAG 2.1 AA compliance required
4. **No Patient PHI** in logs, analytics, or error tracking

### Key Architecture Points

- **Provider Portal**: Supabase auth, generates patient onboarding links
- **Patient App**: Completely local, no authentication, IndexedDB storage
- **Crisis Resources**: 988 Lifeline always accessible

### Tech Stack

- Next.js 14+ (React, TypeScript strict mode)
- Tailwind CSS + shadcn/ui
- Supabase (provider auth only)
- IndexedDB/Dexie.js (patient data - local only)

**→ For detailed information, see [CLAUDE.md](./CLAUDE.md)**
