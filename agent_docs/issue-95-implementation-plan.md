# Implementation Plan: Issue #95 - Provider Mode

**Issue**: [#95 - Provider Mode: Query Param Activation, LocalStorage Flag, Protected Routes, and Provider Logout/Revoke](https://github.com/Turnstone-Tech-LLC/well-being-action-plan/issues/95)

**Created**: 2025-11-13  
**Status**: Planning

---

## Overview

Introduce a lightweight **Provider Mode** that can be activated via a secure query parameter and persisted locally. Providers gain access to provider-only routes, while patients remain restricted to the patient experience. This adds a clear separation between patient and provider workflows without requiring a full authentication system yet.

## Goals

1. **Activate Provider Mode via Query Param**: Support `/?provider_key=<value>` URL pattern
2. **Validate Against ENV Secret**: Check key against `NEXT_PUBLIC_PROVIDER_KEY` environment variable
3. **Persist Provider Mode**: Store flag in localStorage (not IndexedDB)
4. **Protect Provider Routes**: All `/provider/*` routes check for provider mode flag
5. **Dual Logout Actions**:
   - **Logout**: Ends Supabase session only (stays in provider view)
   - **Revoke Provider Mode**: Removes localStorage flag and returns to patient root
6. **Future-Proof**: Structure supports migration to real provider accounts later

## Architecture Decisions

### localStorage vs IndexedDB

- **Decision**: Use localStorage for provider mode flag
- **Rationale**: Simpler, synchronous access, doesn't mix with patient data in IndexedDB

### Middleware Limitation

- **Challenge**: Next.js edge middleware cannot access localStorage
- **Solution**: Hybrid approach
  - Keep Supabase auth check in middleware (server-side)
  - Add client-side provider mode check in provider layout/pages
  - Defense-in-depth security model

### Two-Action Logout System

- **Logout**: Calls existing `signOut()` from AuthContext (Supabase only)
- **Revoke Provider Mode**: New function that clears localStorage and redirects to `/`

### Security Model

- Provider key stored in environment variable (build-time secret)
- localStorage flag is client-side only (acceptable for this use case)
- Supabase auth remains as additional security layer
- No patient data exposure risk (patient data stays in IndexedDB)

---

## Task Breakdown

### ✅ Task 1: Environment Variable Setup

**Priority**: High  
**Dependencies**: None

- [ ] Add `NEXT_PUBLIC_PROVIDER_KEY` to `.env.example`
- [ ] Document provider key setup in README
- [ ] Add validation helper for provider key

**Files**:

- `.env.example`
- `README.md`

**Estimated Complexity**: Low

---

### ✅ Task 2: Provider Mode Utilities

**Priority**: High  
**Dependencies**: Task 1

Create core utilities for provider mode management.

- [ ] Create `src/lib/utils/providerMode.ts`
- [ ] Implement `validateProviderKey(key: string): boolean`
- [ ] Implement `enableProviderMode(): void`
- [ ] Implement `revokeProviderMode(): void`
- [ ] Implement `isProviderModeEnabled(): boolean`
- [ ] Implement `getProviderKey(): string | null`
- [ ] Add unit tests for all utilities

**Files**:

- `src/lib/utils/providerMode.ts` (new)
- `src/lib/utils/__tests__/providerMode.test.ts` (new)

**Estimated Complexity**: Medium

**Implementation Notes**:

```typescript
// localStorage key constant
const PROVIDER_MODE_KEY = 'provider_mode';

// Functions to implement:
// - validateProviderKey(key): Compare against NEXT_PUBLIC_PROVIDER_KEY
// - enableProviderMode(): Set localStorage flag
// - revokeProviderMode(): Remove localStorage flag
// - isProviderModeEnabled(): Check if flag exists
```

---

### ✅ Task 3: Provider Mode Hook

**Priority**: High  
**Dependencies**: Task 2

Create React hook for provider mode checking (similar to `usePatientAuth`).

- [ ] Create `src/hooks/useProviderMode.ts`
- [ ] Implement hook with loading state
- [ ] Add redirect logic for unauthorized access
- [ ] Export TypeScript types

**Files**:

- `src/hooks/useProviderMode.ts` (new)

**Estimated Complexity**: Medium

**Implementation Notes**:

```typescript
// Hook signature:
export function useProviderMode(options?: {
  redirectIfDisabled?: boolean;
  redirectPath?: string;
}): {
  loading: boolean;
  isProviderMode: boolean;
  revokeProviderMode: () => void;
};
```

---

### ✅ Task 4: Root Page Query Parameter Detection

**Priority**: High  
**Dependencies**: Task 2

Update root page to detect and validate provider key parameter.

- [ ] Add `?provider_key=` parameter detection in `src/app/page.tsx`
- [ ] Validate key using `validateProviderKey()`
- [ ] Enable provider mode and redirect to `/provider` on success
- [ ] Show error message for invalid keys
- [ ] Clear query parameter after processing
- [ ] Update app boot logic to check provider mode flag
- [ ] Route to provider portal if flag present
- [ ] Route to patient experience if flag absent

**Files**:

- `src/app/page.tsx`

**Estimated Complexity**: Medium

**Implementation Notes**:

- Check for `provider_key` param on mount
- If valid: `enableProviderMode()` → redirect to `/provider`
- If invalid: show error, stay on home page
- If no param: check `isProviderModeEnabled()` → route accordingly

---

### ✅ Task 5: Provider Layout Updates

**Priority**: High
**Dependencies**: Task 2, Task 3

Add "Revoke Provider Mode" functionality to provider layout.

- [ ] Add "Revoke Provider Mode" button to user menu in `src/app/provider/layout.tsx`
- [ ] Update "Sign Out" to only call Supabase `signOut()` (no localStorage clear)
- [ ] Implement revoke handler that calls `revokeProviderMode()` and redirects to `/`
- [ ] Add confirmation dialog for revoke action
- [ ] Update UI to clearly distinguish between logout and revoke

**Files**:

- `src/app/provider/layout.tsx`

**Estimated Complexity**: Medium

**Implementation Notes**:

```typescript
// User menu should have two separate actions:
// 1. "Sign Out" - calls signOut() only
// 2. "Revoke Provider Mode" - calls revokeProviderMode() + redirect
```

---

### ✅ Task 6: Provider Route Protection (Client-Side)

**Priority**: High
**Dependencies**: Task 3

Add client-side provider mode checks to provider pages.

- [ ] Update provider layout to use `useProviderMode()` hook
- [ ] Add loading state while checking provider mode
- [ ] Redirect to `/` if provider mode not enabled
- [ ] Update all provider pages to inherit protection from layout

**Files**:

- `src/app/provider/layout.tsx`
- `src/app/provider/page.tsx` (verify protection)
- `src/app/provider/link-generator/page.tsx` (verify protection)
- `src/app/provider/settings/page.tsx` (verify protection)

**Estimated Complexity**: Low

**Implementation Notes**:

- Add hook to `ProviderLayoutInner` component
- Show loading spinner while checking
- Redirect happens automatically via hook

---

### ✅ Task 7: Middleware Documentation Update

**Priority**: Medium
**Dependencies**: Task 2

Update middleware documentation to reflect new provider mode system.

- [ ] Update comments in `src/middleware.ts` to explain provider mode
- [ ] Update comments in `src/lib/supabase/middleware.ts`
- [ ] Document that provider mode check happens client-side
- [ ] Explain dual-layer security (provider mode + Supabase auth)

**Files**:

- `src/middleware.ts`
- `src/lib/supabase/middleware.ts`

**Estimated Complexity**: Low

---

### ✅ Task 8: Documentation Updates

**Priority**: Medium
**Dependencies**: All previous tasks

Update project documentation with provider mode information.

- [ ] Update `CLAUDE.md` with provider mode architecture section
- [ ] Update `docs/AUTHENTICATION_SETUP.md` with provider mode setup
- [ ] Add provider mode section to main `README.md`
- [ ] Document environment variable setup
- [ ] Add troubleshooting section for provider mode issues
- [ ] Update architecture diagrams if applicable

**Files**:

- `CLAUDE.md`
- `docs/AUTHENTICATION_SETUP.md`
- `README.md`

**Estimated Complexity**: Medium

**Content to Add**:

- How provider mode works
- How to set up provider key
- How to activate provider mode
- Difference between logout and revoke
- Migration path to full authentication

---

### ✅ Task 9: Testing

**Priority**: High
**Dependencies**: All implementation tasks

Add comprehensive tests for provider mode functionality.

- [ ] Unit tests for `providerMode.ts` utilities
- [ ] Unit tests for `useProviderMode` hook
- [ ] E2E test: Activate provider mode with valid key
- [ ] E2E test: Reject invalid provider key
- [ ] E2E test: Provider route protection
- [ ] E2E test: Logout vs Revoke behavior
- [ ] E2E test: App boot routing based on provider mode

**Files**:

- `src/lib/utils/__tests__/providerMode.test.ts` (new)
- `src/hooks/__tests__/useProviderMode.test.ts` (new)
- `e2e/provider-mode.spec.ts` (new)

**Estimated Complexity**: High

---

## Acceptance Criteria Checklist

From the original issue:

- [ ] `/?provider_key=` query param is supported
- [ ] Key is validated against a build-time secret (`NEXT_PUBLIC_PROVIDER_KEY`)
- [ ] Valid key sets `localStorage.provider_mode = "enabled"`
- [ ] App boots into provider view when the flag is present
- [ ] Provider routes redirect to `/` when provider mode is not enabled
- [ ] **Logout** only ends the Supabase session
- [ ] **Revoke Provider Mode** removes the localStorage flag and returns to patient root
- [ ] Provider mode does _not_ sync to IndexedDB
- [ ] Patients have no path to a provider-only route without the key

---

## Implementation Order

1. **Phase 1: Core Infrastructure** (Tasks 1-3)
   - Environment setup
   - Provider mode utilities
   - Provider mode hook

2. **Phase 2: Integration** (Tasks 4-6)
   - Root page detection
   - Provider layout updates
   - Route protection

3. **Phase 3: Documentation & Testing** (Tasks 7-9)
   - Middleware docs
   - Project documentation
   - Comprehensive testing

---

## Technical Considerations

### Security

- Provider key is **not** encryption - it's access control
- localStorage is client-side only (not secure storage)
- Supabase auth provides additional security layer
- No patient PHI exposure risk (data stays in IndexedDB)

### Future Migration Path

When migrating to real provider accounts:

1. Replace provider key validation with login check
2. Replace localStorage flag with auth state
3. Keep routing and mode code largely unchanged
4. Supabase auth becomes primary authentication

### Edge Cases

- **Bookmarked provider key URL**: Key in URL could be shared/bookmarked
  - Mitigation: Clear query param after activation
- **localStorage cleared**: Provider loses access, must re-enter key
  - Expected behavior: Redirect to home, re-enter key
- **Invalid key attempts**: Multiple failed attempts
  - Current: Show error, no rate limiting (acceptable for MVP)
- **Key rotation**: Changing env var invalidates all sessions
  - Expected behavior: All providers must re-enter new key

### Browser Compatibility

- localStorage is supported in all modern browsers
- PWA offline mode: localStorage persists offline
- Private/Incognito mode: localStorage cleared on session end (expected)

---

## Questions for Clarification

1. **Provider Key Format**: Simple passphrase or complex token?
   - **Recommendation**: Simple passphrase (e.g., `my-secret-key-2024`)

2. **Multiple Provider Keys**: Support multiple keys for different providers?
   - **Recommendation**: Single key for MVP, extend later if needed

3. **Key Rotation Strategy**: How to handle provider key changes?
   - **Recommendation**: Changing env var invalidates all sessions (acceptable)

4. **Supabase Auth Interaction**: Provider mode bypass or work alongside?
   - **Recommendation**: Work alongside - mode grants route access, auth required for data

5. **Error Handling**: What if no provider mode AND no Supabase auth?
   - **Recommendation**: Redirect to `/` with error message

---

## Success Metrics

- [ ] Provider can activate provider mode with valid key
- [ ] Invalid keys are rejected with clear error message
- [ ] Provider routes are inaccessible without provider mode
- [ ] Logout preserves provider mode
- [ ] Revoke returns user to patient experience
- [ ] App boots into correct view based on provider mode flag
- [ ] All tests pass
- [ ] Documentation is complete and accurate

---

## Notes

- This implementation maintains the existing Supabase authentication system
- Provider mode is an **additional layer** on top of Supabase auth
- Patient data privacy is maintained (no changes to IndexedDB)
- Future migration to full provider accounts is straightforward
