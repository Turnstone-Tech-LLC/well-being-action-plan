# 🏗️ Well-Being Action Plan - Refactor & Architecture Plan

## Executive Summary

This document outlines a comprehensive refactor plan based on a thorough audit of the Well-Being Action Plan codebase. The audit identified critical security issues, performance bottlenecks, accessibility gaps, and significant code duplication that need immediate attention.

**Overall Assessment**: **B+ architecture, C+ implementation** - Strong privacy-first foundation with critical execution gaps.

---

## 🚨 Critical Issues (Immediate Action Required)

### 1. **Broken User Isolation** [SEVERITY: CRITICAL]

**Problem**: All users share `'default-user'` ID, violating privacy promises.
**Files Affected**:

- [check-in/green/page.tsx:46](src/app/check-in/green/page.tsx#L46)
- [check-in/yellow/page.tsx:89](src/app/check-in/yellow/page.tsx#L89)
- [check-in/red/page.tsx:52](src/app/check-in/red/page.tsx#L52)
- [dashboard/page.tsx:126,154](src/app/dashboard/page.tsx#L126-L154)

**Solution**: Implemented `userIdentityService.ts` with unique user identification.

### 2. **Missing CSRF Protection** [SEVERITY: HIGH]

**Problem**: API endpoints accept unauthenticated requests without validation.
**File**: [api/onboarding/complete/route.ts](src/app/api/onboarding/complete/route.ts)

**Solution**: Implemented `apiSecurity.ts` with rate limiting and origin validation.

### 3. **Race Conditions** [SEVERITY: HIGH]

**Problem**: Multiple async operations without proper cleanup causing state corruption.
**Files**:

- [hooks/usePatientAuth.ts:96-138](src/hooks/usePatientAuth.ts#L96-L138)
- [provider/page.tsx:86-110](src/app/provider/page.tsx#L86-L110)

**Solution**: Implemented cleanup patterns in `useAsyncData.ts` hook.

---

## 📁 New Architecture Components

### 1. **User Identity Service** (`/src/lib/services/userIdentityService.ts`)

- Generates unique user IDs using browser fingerprinting
- Maintains session consistency
- Privacy-preserving (all data stays local)
- No backward compatibility needed (clean implementation)

### 2. **API Security Middleware** (`/src/lib/middleware/apiSecurity.ts`)

- Rate limiting (10 requests/minute default)
- CSRF protection via origin validation
- Request body validation
- Security headers injection

### 3. **Unified Data Access Layer** (`/src/lib/services/dataAccessLayer.ts`)

- `PatientDataAccess` class for IndexedDB operations
- `ProviderDataAccess` class for Supabase operations
- Consistent error handling
- User identity integration

### 4. **Custom Hooks Library** (`/src/hooks/useAsyncData.ts`)

- `useAsyncData` - Generic data fetching with cleanup
- `usePaginatedData` - Pagination support
- `useAsyncMutation` - Mutation operations
- Automatic retry logic and error handling

### 5. **Zone Utilities** (`/src/lib/utils/zoneUtils.ts`)

- Centralized zone colors and styling
- Zone transition logic
- Crisis resource management
- Eliminates duplication across 10+ files

### 6. **Authentication Utilities** (`/src/lib/auth/authUtils.ts`)

- Unified auth checking for both modes
- Route configuration management
- Consistent redirect handling
- Sign-out utilities

### 7. **Error Handling System** (`/src/lib/errors/errorHandling.ts`)

- `AppError` class with severity levels
- Error factories for common scenarios
- Retry logic for transient failures
- User-friendly error messages

---

## 🔄 Refactor Implementation Guide

### Phase 1: Security & Privacy (Week 1)

#### Step 1.1: Replace hardcoded user IDs

```typescript
// OLD: src/app/dashboard/page.tsx
const checkIns = await getCheckInsByUser('default-user');

// NEW: Using userIdentityService
import { getUserIdentity } from '@/lib/services/userIdentityService';

const { userId } = await getUserIdentity();
const checkIns = await getCheckInsByUser(userId);
```

#### Step 1.2: Add API security

```typescript
// OLD: src/app/api/onboarding/complete/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  // No validation
}

// NEW: With security middleware
import { withApiSecurity } from '@/lib/middleware/apiSecurity';

export async function POST(request: NextRequest) {
  return withApiSecurity(request, async (req) => {
    // Rate limited & CSRF protected
    const body = await req.json();
  });
}
```

### Phase 2: Performance (Week 1-2)

#### Step 2.1: Replace data fetching patterns

```typescript
// OLD: Repetitive pattern in 10+ components
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      const result = await fetchData();
      setData(result);
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);

// NEW: Using useAsyncData hook
import { useAsyncData } from '@/hooks/useAsyncData';

const { data, loading, error, refetch } = useAsyncData(() => fetchData(), {
  dependencies: [userId],
});
```

#### Step 2.2: Fix useEffect cleanup

```typescript
// OLD: Memory leak potential
useEffect(() => {
  const loadStats = async () => {
    const stats = await getStats();
    setStats(stats); // Could run after unmount
  };
  loadStats();
}, []);

// NEW: With proper cleanup
useEffect(() => {
  let cancelled = false;

  const loadStats = async () => {
    const stats = await getStats();
    if (!cancelled) setStats(stats);
  };

  loadStats();
  return () => {
    cancelled = true;
  };
}, []);
```

### Phase 3: Code Deduplication (Week 2)

#### Step 3.1: Centralize zone styling

```typescript
// OLD: Duplicated in every component
const getZoneColor = (zone) => {
  switch (zone) {
    case 'green':
      return 'bg-green-100 text-green-900';
    // ... repeated everywhere
  }
};

// NEW: Using zone utilities
import { getZoneColors, getZoneCardStyles } from '@/lib/utils/zoneUtils';

const cardStyles = getZoneCardStyles(zone, interactive);
```

#### Step 3.2: Unify authentication checks

```typescript
// OLD: Different auth patterns everywhere
// Provider auth in middleware.ts
// Patient auth in usePatientAuth.ts
// Mixed patterns in components

// NEW: Using unified auth utilities
import { checkRouteAccess, AuthMode } from '@/lib/auth/authUtils';

const { allowed, redirectTo } = await checkRouteAccess(pathname);
if (!allowed) router.push(redirectTo);
```

### Phase 4: Accessibility (Week 2-3)

#### Step 4.1: Fix keyboard navigation

```typescript
// OLD: onClick on non-interactive elements
<Card onClick={handleClick} className="cursor-pointer">

// NEW: Proper button semantics
<Card asChild>
  <button onClick={handleClick} className="w-full text-left">
    {/* Card content */}
  </button>
</Card>
```

#### Step 4.2: Add ARIA live regions

```typescript
// OLD: Silent updates
{saved && <div>Saved!</div>}

// NEW: Announced to screen readers
{saved && (
  <div role="status" aria-live="polite">
    Check-in saved successfully
  </div>
)}
```

---

## 📊 Migration Checklist

### Components to Update

- [ ] **Check-in Pages** (3 files)
  - Replace 'default-user' with getUserIdentity()
  - Add error boundaries
  - Fix keyboard navigation

- [ ] **Dashboard** (1 file)
  - Use useAsyncData hook
  - Replace zone color logic with utilities
  - Add proper cleanup to effects

- [ ] **Provider Portal** (5 files)
  - Fix memory leaks in data loading
  - Add proper error handling
  - Implement loading states

- [ ] **Onboarding Flow** (4 files)
  - Remove localStorage usage in render
  - Add form validation
  - Improve error messages

- [ ] **API Routes** (3 files)
  - Add security middleware
  - Implement rate limiting
  - Add request validation

### Global Changes

- [ ] Replace all `console.log` with error logger
- [ ] Add TypeScript types (remove all `any`)
- [ ] Implement error boundaries at route level
- [ ] Add skip links for keyboard navigation
- [ ] Audit and fix color contrast issues

---

## 🎯 Success Metrics

### Security

- ✅ No shared user data between patients
- ✅ All API endpoints protected
- ✅ No sensitive data in logs

### Performance

- ✅ No memory leaks
- ✅ < 100ms initial data load
- ✅ No unnecessary re-renders
- ✅ Code split provider portal

### Accessibility

- ✅ WCAG 2.1 AA compliance
- ✅ Full keyboard navigation
- ✅ Screen reader compatible
- ✅ 4.5:1 color contrast minimum

### Code Quality

- ✅ < 5% code duplication
- ✅ 100% TypeScript coverage
- ✅ Consistent error handling
- ✅ Clear module boundaries

---

## 🚀 Implementation Priority

### Sprint 1 (Critical Security)

1. Implement user isolation
2. Add API security
3. Fix race conditions
4. Add error boundaries

### Sprint 2 (Performance & Quality)

5. Centralize data fetching
6. Extract zone utilities
7. Unify authentication
8. Fix memory leaks

### Sprint 3 (Polish & Accessibility)

9. Keyboard navigation
10. ARIA improvements
11. Color contrast fixes
12. Error messaging

---

## 📚 Additional Resources

- [Security Best Practices](./SECURITY.md)
- [Performance Guidelines](./PERFORMANCE.md)
- [Accessibility Standards](./ACCESSIBILITY.md)
- [Architecture Overview](./ARCHITECTURE.md)

---

## 🤝 Team Guidelines

### Code Review Checklist

- [ ] No hardcoded user IDs
- [ ] Proper useEffect cleanup
- [ ] Error handling in place
- [ ] Accessibility attributes present
- [ ] No console.log statements
- [ ] TypeScript types defined

### Testing Requirements

- Unit tests for all utilities
- Integration tests for auth flows
- E2E tests for critical paths
- Accessibility audits with axe-core

### Documentation Standards

- JSDoc comments for utilities
- README for each module
- Inline comments for complex logic
- Migration guides for breaking changes

---

## 📈 Monitoring & Maintenance

### Error Tracking

- Implement Sentry for production
- Custom error boundaries
- User feedback collection

### Performance Monitoring

- Lighthouse CI in GitHub Actions
- Bundle size tracking
- Core Web Vitals monitoring

### Security Audits

- Monthly dependency updates
- Quarterly security reviews
- Automated vulnerability scanning

---

## ✅ Conclusion

This refactor plan addresses all critical issues identified in the audit while maintaining the strong privacy-first architecture. The modular approach allows for incremental implementation without disrupting the current functionality.

The new architecture provides:

- **Better security** through proper user isolation and API protection
- **Improved performance** via centralized data management and proper cleanup
- **Enhanced accessibility** with semantic HTML and ARIA support
- **Maintainable code** through shared utilities and consistent patterns

Following this plan will elevate the codebase from its current C+ implementation to an A-level production-ready application that truly delivers on its privacy and accessibility promises.
