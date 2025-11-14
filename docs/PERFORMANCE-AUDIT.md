# Well-Being Action Plan - Comprehensive Performance Audit

## Executive Summary

The codebase demonstrates solid architectural practices with proper use of Next.js 14+, TypeScript strict mode, and local-first data storage. However, several optimization opportunities exist for reducing bundle size, improving code splitting, and optimizing data fetching patterns.

**Overall Assessment:** Medium priority optimizations needed, with some quick wins available.

---

## 1. IMAGE OPTIMIZATION ISSUES

### Status: EXCELLENT ✓

**Findings:**

- No problematic `<img>` tags found in the codebase
- All dynamic images are SVG-based (Lucide React icons, QR codes)
- Static assets properly served from `/public` with appropriate formats
- Apple splash screens and icons properly configured in metadata

**Assets Review:**

- Favicon images: 16x16, 32x32 (properly sized)
- Apple touch icon: 180x180 PNG (5.7KB)
- PWA icons: Multiple sizes (72px-512px) properly configured
- Apple splash screens: Responsive images for different device sizes

**Recommendation:**
No changes needed. The image handling is already optimized.

---

## 2. BUNDLE SIZE CONCERNS

### Status: MODERATE ⚠️

#### 2.1 Large Dependencies Analysis

**Current Major Dependencies:**

- `@ducanh2912/next-pwa` (10.2.9) - Essential for PWA functionality
- `dexie` (4.2.1) - IndexedDB wrapper, essential for local storage
- `lucide-react` (0.552.0) - Icon library (~99KB uncompressed)
- `zod` (4.1.12) - Validation library
- `qrcode.react` (4.2.0) - Only used in 2 files for provider-only features
- `pako` (2.1.0) - Compression, only used in 1 file
- `date-fns` (4.1.0) - Date utilities

**Opportunities:**

1. **QR Code Library** - Used only in provider portal (2 files)
   - `/home/user/well-being-action-plan/src/app/provider/links/page.tsx`
   - `/home/user/well-being-action-plan/src/app/provider/links/[id]/page.tsx`
   - **Recommendation:** Dynamically import qrcode.react to prevent loading in patient routes

   ```typescript
   // Instead of: import { QRCodeSVG } from 'qrcode.react';
   const QRCodeSVG = dynamic(() =>
     import('qrcode.react').then((mod) => ({ default: mod.QRCodeSVG }))
   );
   ```

2. **Pako Library** - Only used in one file:
   - `/home/user/well-being-action-plan/src/lib/utils/urlConfig.ts`
   - Currently imported on every page
   - **Recommendation:** Dynamically import when used

#### 2.2 Unused Dependencies

**Status:** All dependencies appear to be in use ✓

Verified:

- `@radix-ui/*` packages - Used in shadcn/ui components
- `@supabase/*` - Used in provider portal
- `lucide-react` - Used throughout for icons
- `react-hook-form` - Used in forms
- `class-variance-authority` - Used by shadcn/ui
- `clsx` - Used by shadcn/ui (redundant with tailwind-merge, but minimal)

**Minor Recommendation:** Consider consolidating `clsx` + `tailwind-merge` usage in `/home/user/well-being-action-plan/src/lib/utils/index.ts`

#### 2.3 Bundle Splitting Opportunity

**Current Setup:** Single bundle for all routes (patient + provider)

**Issue:** Patient users load provider libraries (Supabase, provider UI components)

**Recommendation:** Route-based code splitting is already handled by Next.js App Router, but explicit lazy loading of provider components would help.

---

## 3. CODE SPLITTING OPPORTUNITIES

### Status: NEEDS OPTIMIZATION ⚠️

#### 3.1 Large Route Segments

**Largest Components by Line Count:**

| File                              | Lines | Location        | Potential Split                        |
| --------------------------------- | ----- | --------------- | -------------------------------------- |
| provider/link-generator/page.tsx  | 610   | Provider portal | Extract strategy selector, form wizard |
| provider/plan/new/step-2/page.tsx | 553   | Provider portal | Extract trigger/strategy forms         |
| settings/page.tsx                 | 523   | Patient         | Extract export/import dialogs          |
| dashboard/page.tsx                | 504   | Patient         | Extract session message, provider card |
| history/page.tsx                  | 486   | Patient         | Extract calendar widget, detail modal  |

**Immediate Action Items:**

1. **Link Generator (610 lines)** - `/home/user/well-being-action-plan/src/app/provider/link-generator/page.tsx`
   - Extract strategy selection into separate component
   - Extract form sections into sub-components
   - Potential 30% reduction

2. **Settings (523 lines)** - `/home/user/well-being-action-plan/src/app/settings/page.tsx`
   - Import dialog (328 lines) takes significant space
   - Already separate component but could be lazy-loaded

   **Recommendation:**

   ```typescript
   // In settings/page.tsx
   const ImportDataDialog = dynamic(
     () => import('@/components/import-data-dialog'),
     { loading: () => <div>Loading...</div> }
   );
   ```

3. **Dashboard (504 lines)** - `/home/user/well-being-action-plan/src/app/dashboard/page.tsx`
   - SessionMessage component extracted but within Suspense
   - Extract provider card component
   - Extract streak display into reusable component

4. **History (486 lines)** - `/home/user/well-being-action-plan/src/app/history/page.tsx`
   - Entire calendar view could be extracted to separate component
   - Selected day details modal could be extracted

#### 3.2 Provider Portal Code Isolation

**Status:** Not isolated from patient bundle

**Files:**

- All provider pages: `/home/user/well-being-action-plan/src/app/provider/**/*`
- Provider service: `/home/user/well-being-action-plan/src/lib/services/providerService.ts`
- Provider context: `/home/user/well-being-action-plan/src/lib/contexts/AuthContext.ts` (shared)

**Recommendation:** Consider separate entry point or explicit lazy loading of provider portal.

#### 3.3 Heavy Third-Party Libraries

**QRCode Generation (Only for Provider):**

- File: `/home/user/well-being-action-plan/src/app/provider/links/page.tsx` (line 14)
- File: `/home/user/well-being-action-plan/src/app/provider/links/[id]/page.tsx` (line 14)

**Recommendation:** Dynamic import with loading state

```typescript
import dynamic from 'next/dynamic';

const QRCodeDisplay = dynamic(
  () => import('qrcode.react').then(mod => ({ default: mod.QRCodeSVG })),
  { loading: () => <div className="h-32 w-32 bg-muted animate-pulse rounded" /> }
);
```

#### 3.4 Compression Library Usage

**File:** `/home/user/well-being-action-plan/src/lib/utils/urlConfig.ts` (line 25)

- Only used for URL encoding/decoding of shareable plans
- Imported universally but only used when sharing plans

**Recommendation:** Lazy load within the function:

```typescript
// Current:
import pako from 'pako';

// Better:
export async function encodePlanConfig(config: any) {
  const { default: pako } = await import('pako');
  // ... rest of function
}
```

---

## 4. JAVASCRIPT/CSS OPTIMIZATION

### Status: GOOD ✓

#### 4.1 CSS-in-JS / Inline Styles

**Status:** Excellent - No inline styles or CSS-in-JS found ✓

All styling uses:

- Tailwind CSS utility classes
- CSS modules handled by Next.js
- Proper separation of concerns

**Configuration Verified:**

- `next.config.mjs` has `swcMinify: true` enabled for PWA
- Tailwind CSS properly configured with Prettier plugin for class sorting
- Darker colors properly configured for dark mode

#### 4.2 Component Duplication

**Minimal issues found:**

Color mapping repeated across files:

- `/home/user/well-being-action-plan/src/app/dashboard/page.tsx` (lines 195-206)
- `/home/user/well-being-action-plan/src/app/history/page.tsx` (lines 27-43)
- `/home/user/well-being-action-plan/src/components/zone-card.tsx` (lines 39-76)

**Recommendation:** Extract to shared utility file:

```typescript
// src/lib/config/zoneColorConfig.ts
export const zoneColors = {
  [ZoneType.Green]: {
    /* ... */
  },
  [ZoneType.Yellow]: {
    /* ... */
  },
  [ZoneType.Red]: {
    /* ... */
  },
};
```

#### 4.3 Memoization Patterns

**Current Status:** Minimal memoization (5 instances across codebase)

**Findings:**

- Limited use of `useCallback` (0 instances in major components)
- Limited use of `useMemo` (5 instances total)
- No React.memo() for component exports

**High-Impact Opportunities:**

1. **Calendar Generation** - `/home/user/well-being-action-plan/src/app/history/page.tsx`

   Lines 94-147: `generateCalendarDays()` function runs on every render

   **Recommendation:**

   ```typescript
   const calendarDays = useMemo(() => generateCalendarDays(), [currentMonth, checkIns]);
   ```

2. **Zone Color Functions** - `/home/user/well-being-action-plan/src/app/dashboard/page.tsx`

   Lines 195-219: `getZoneColor()` and `getZoneLabel()` redefined on every render

   **Recommendation:**

   ```typescript
   const getZoneColor = useCallback((zone: ZoneType) => {
     // implementation
   }, []);
   ```

3. **Dashboard Data Loading** - `/home/user/well-being-action-plan/src/app/dashboard/page.tsx`

   Lines 104-146: `loadDashboardData()` could be memoized

   **Recommendation:**

   ```typescript
   const loadDashboardData = useCallback(async () => {
     // implementation
   }, []);
   ```

#### 4.4 Server Components Optimization

**Status:** Partially optimized

**Findings:**

- Root layout (`/home/user/well-being-action-plan/src/app/layout.tsx`) is a Server Component ✓
- Two components marked with `force-dynamic`:
  - `/home/user/well-being-action-plan/src/app/provider/auth/login/page.tsx`
  - `/home/user/well-being-action-plan/src/app/provider/auth/signup/page.tsx`
  - (Appropriate for auth pages)

**Improvement Opportunities:**

- Most route pages are "use client" (necessary for interactivity)
- Consider extracting pure presentational parts to server components where possible

---

## 5. DATA FETCHING PATTERNS

### Status: MODERATE ⚠️

#### 5.1 Waterfalls & Sequential Loading

**Identified Watterfall Patterns:**

**Dashboard** - `/home/user/well-being-action-plan/src/app/dashboard/page.tsx` (lines 104-146)

```typescript
// Current: Sequential loads (waterfall)
const loadDashboardData = async () => {
  const nameConfig = await getUserConfig(...);  // 1. Waits for name
  const providerConfig = localStorage.getItem(...);
  const checkIns = await getCheckInsByUser(...);  // 2. Waits for check-ins
  const streak = await calculateStreak();  // 3. Waits for streak calculation
  const strategies = await getAllCopingStrategies(...);  // 4. Waits for strategies
  await initializeNotificationScheduling(...);  // 5. Waits for notifications
};
```

**Issue:** Operations 1-5 could partially run in parallel

**Recommendation:**

```typescript
const loadDashboardData = useCallback(async () => {
  try {
    // Load data in parallel where possible
    const [nameConfig, checkIns, strategies] = await Promise.all([
      getUserConfig('patient', 'preferredName'),
      getCheckInsByUser('default-user', { startDate: today, endDate: tomorrow }),
      getAllCopingStrategies({ limit: 6 }),
    ]);

    // Set individual states
    if (nameConfig) setPatientName(nameConfig.value as string);
    setTodayCheckIns(checkIns);
    setCopingStrategies(strategies);

    // Run independently
    const streak = await calculateStreak();
    setCheckInStreak(streak);

    // Initialize notifications without blocking UI
    initializeNotificationScheduling('patient').catch(console.error);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    setLoading(false);
  }
}, []);
```

**Provider Dashboard** - `/home/user/well-being-action-plan/src/app/provider/page.tsx` (lines 86-105)

```typescript
// Current: Sequential
const stats = await providerService.getLinkStats(user.id);
const links = await providerService.getActiveLinks(user.id);

// Potential: Parallel
const [stats, links] = await Promise.all([
  providerService.getLinkStats(user.id),
  providerService.getActiveLinks(user.id),
]);
```

#### 5.2 Missing Query Optimization

**Check-in Queries:**

File: `/home/user/well-being-action-plan/src/lib/db/index.ts` (lines 243-274)

Current implementation loads up to 1000 check-ins then filters in memory:

```typescript
// Current: Limited but could be more efficient
await query
  .reverse()
  .offset(options?.offset || 0)
  .limit(options?.limit || 1000)
  .sortBy('timestamp');
```

**Recommendation:** Add pre-filtering to Dexie queries:

```typescript
export async function getCheckInsByUser(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    zone?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<CheckIn[]> {
  let query = db.checkIns.where('userId').equals(userId);

  // Filter by zone first (more efficient)
  if (options?.zone) {
    query = query.and((checkIn) => checkIn.zone === options.zone);
  }

  // Apply date range (indexed)
  if (options?.startDate && options?.endDate) {
    query = db.checkIns.where('timestamp').between(options.startDate, options.endDate, true, true);
  }

  return await query
    .reverse()
    .offset(options?.offset || 0)
    .limit(options?.limit || 100) // Reduce default limit
    .sortBy('timestamp');
}
```

#### 5.3 Caching Patterns

**Status:** Good - PWA caching is well-configured ✓

**File:** `/home/user/well-being-action-plan/next.config.mjs`

Proper caching strategies:

- Pages: Network-first with 24h cache
- Static assets: Cache-first with 30d cache
- Images: Cache-first with 30d cache
- Google Fonts: Cache-first with 1y cache

#### 5.4 localStorage/sessionStorage Usage

**86 instances found across codebase**

**Common Patterns:**

1. Provider config storage (sessionStorage/localStorage)
2. Onboarding state (sessionStorage)
3. Auth tokens (handled by Supabase)

**Potential Issues:**

- Each read/write blocks main thread (synchronous)
- No error handling in many locations
- Some duplicated key access patterns

**Recommendation:** Create storage utility wrapper:

```typescript
// src/lib/utils/storage.ts
export const storage = {
  getProviderConfig: () => {
    try {
      const config = localStorage.getItem('providerConfig');
      return config ? JSON.parse(config) : null;
    } catch (err) {
      console.error('Failed to read provider config:', err);
      return null;
    }
  },
  setProviderConfig: (config: any) => {
    try {
      localStorage.setItem('providerConfig', JSON.stringify(config));
    } catch (err) {
      console.error('Failed to save provider config:', err);
    }
  },
  // ... other methods
};
```

---

## 6. IMPLEMENTATION PRIORITY MATRIX

### High Impact, Low Effort (Do First)

1. ✅ **Extract zone color config** - `30 min` - Reduce duplication
2. ✅ **Add calendar memoization** - `15 min` - Quick wins in history page
3. ✅ **Dynamic import QRCode library** - `20 min` - ~50KB code split
4. ✅ **Parallel Promise.all for dashboard** - `30 min` - Faster load times

### High Impact, Medium Effort (Priority)

5. ⚠️ **Extract large components** - `2-3 hours` - Reduce per-page JS
6. ⚠️ **Dynamic import settings dialogs** - `45 min` - Code split
7. ⚠️ **Optimize database queries** - `1 hour` - Better IndexedDB use

### Medium Impact, Low Effort

8. 📊 **Add useCallback to utility functions** - `1 hour` - Prevent recreations
9. 📊 **Create storage utility wrapper** - `45 min` - Better patterns

### Nice-to-Have / Low Priority

10. 📝 **Extract calendar widget** - `2 hours` - Component reusability
11. 📝 **Consolidate clsx + tailwind-merge** - `15 min` - Minor cleanup

---

## 7. SPECIFIC FILE RECOMMENDATIONS

### 🔴 High Priority Files

#### `/home/user/well-being-action-plan/src/app/dashboard/page.tsx` (504 lines)

**Issues:**

- Lines 195-219: Repeated zone color functions
- Lines 104-146: Sequential data loading (waterfall)
- Lines 36-68: SessionMessage component could extract useSearchParams separately

**Actions:**

1. Extract zone helpers to `src/lib/config/zoneColorConfig.ts`
2. Use `Promise.all()` for parallel data loading
3. Memoize calendar generation and color functions

#### `/home/user/well-being-action-plan/src/app/provider/link-generator/page.tsx` (610 lines)

**Issues:**

- Large monolithic component
- Lines 32-150+: DEFAULT_STRATEGIES inline array
- Complex form state management

**Actions:**

1. Extract DEFAULT_STRATEGIES to `src/lib/data/defaultStrategies.ts`
2. Split form into: header, strategy selector, details, preview
3. Consider form wizard state machine

#### `/home/user/well-being-action-plan/src/app/settings/page.tsx` (523 lines)

**Issues:**

- Line imports ImportDataDialog (328 lines in same component)
- Multiple dialogs increase component complexity

**Actions:**

1. Dynamic import ImportDataDialog:
   ```typescript
   const ImportDataDialog = dynamic(() => import('@/components/import-data-dialog'));
   ```
2. Extract export section to separate component
3. Extract data management section

#### `/home/user/well-being-action-plan/src/app/provider/links/page.tsx` (314 lines)

**Issues:**

- Line 14: QRCodeSVG imported directly

**Actions:**

```typescript
import dynamic from 'next/dynamic';

const QRCodeSVG = dynamic(
  () => import('qrcode.react').then(mod => ({ default: mod.QRCodeSVG })),
  { loading: () => <div className="h-32 w-32 bg-muted animate-pulse" /> }
);
```

---

## 8. PERFORMANCE METRICS & TARGETS

### Current Estimated Metrics

- **Largest JS Bundle (Initial):** ~150-200KB (estimated)
- **Largest JS Bundle (Patient):** ~100-120KB (without provider code)
- **First Contentful Paint:** ~1-2s (modern devices)
- **Largest Contentful Paint:** ~2-3s

### Post-Optimization Targets

- **Largest JS Bundle:** -15-20% reduction
- **QRCode removed from patient:** -30KB reduction
- **Dynamic imports:** -5-10% on initial load

---

## 9. SUMMARY TABLE

| Category           | Status        | Effort     | Impact   | Action             |
| ------------------ | ------------- | ---------- | -------- | ------------------ |
| Image Optimization | ✓ Excellent   | -          | -        | None needed        |
| Bundle Size        | ⚠️ Moderate   | Low-Medium | High     | Dynamic imports    |
| Code Splitting     | ⚠️ Needs work | Medium     | High     | Extract components |
| JS/CSS             | ✓ Good        | Low        | Medium   | Add memoization    |
| Data Fetching      | ⚠️ Waterfalls | Low        | High     | Use Promise.all()  |
| **Overall**        | **⚠️ Good**   | **Medium** | **High** | **See roadmap**    |

---

## 10. QUICK START CHECKLIST

- [ ] Extract zone color config to shared file
- [ ] Add dynamic import for qrcode.react in provider links pages
- [ ] Add useMemo to calendar generation in history page
- [ ] Convert sequential loads to Promise.all() in dashboard
- [ ] Extract ImportDataDialog to dynamic import in settings
- [ ] Create storage utility wrapper for localStorage access
- [ ] Add useCallback to utility functions in dashboard
- [ ] Extract large components into sub-components
- [ ] Monitor bundle size with `next/bundle-analyzer`
