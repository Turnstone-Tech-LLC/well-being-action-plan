# Implementation Plan for Issue #94: Root Page Welcome Flow, Access Code Autofill, and Data Import/Export

**Issue:** https://github.com/Turnstone-Tech-LLC/well-being-action-plan/issues/94

**Date:** 2025-11-13

## Summary

Enhance the root page (`/`) to provide a better experience for both new and returning patients, including:

1. Welcome screen for new patients with access code handling
2. Auto-redirect for returning patients to dashboard
3. Data import/export functionality
4. Clear all data option

## Current State Analysis

**Existing Functionality:**

- Root page (`src/app/page.tsx`) currently checks for provider link (`?config=` param) and redirects returning users to dashboard
- Shows error state if no valid provider link is found
- Database has `exportData()` and `importData()` functions already implemented
- `clearAllData()` function exists in `src/lib/db/index.ts`
- Onboarding flow exists at `/onboarding` with 3 steps

**Issues with Current Implementation:**

- New users without a provider link get stuck with an error message
- No way to import previously exported data
- No "Clear All Data" option in settings
- Only `?config=` parameter is supported (issue requests `?access_code=`)

## Implementation Tasks

### **Task 1: Update URL Configuration to Support Access Code Parameter**

**Files to modify:**

- `src/lib/utils/urlConfig.ts`

**Changes:**

1. Add new constant `ACCESS_CODE_PARAM = 'access_code'`
2. Create `parseAccessCode()` function to extract access code from URL
3. Update `parseProviderUrl()` to check for `access_code` parameter instead of `config`
4. Keep `config` parameter support ONLY for internal provider link generation (not user-facing)

**Note:** Clean implementation - `access_code` is the user-facing parameter name.

---

### **Task 2: Create Welcome Screen Component for New Patients**

**Files to create:**

- `src/components/welcome-screen.tsx` - Reusable welcome screen component

**Component Features:**

1. Welcome message and app introduction
2. Access code input field (auto-filled from URL if present)
3. "Get Started" button (disabled without access code)
4. "Import Existing Data" button as alternative action
5. UVM branding
6. Privacy notice

**Rationale:** Separating this into a component keeps the root page cleaner and makes the welcome screen reusable.

---

### **Task 3: Create Data Import/Export Service**

**Files to create:**

- `src/lib/services/dataPortabilityService.ts`

**Functions to implement:**

1. `exportDataToFile()` - Export IndexedDB data to JSON file with metadata
2. `importDataFromFile()` - Import data from JSON file with validation
3. `validateImportData()` - Validate imported data structure
4. `downloadDataFile()` - Trigger browser download of JSON file
5. `readDataFile()` - Read and parse uploaded JSON file

**Data Format:**

```typescript
{
  version: "1.0",
  exportDate: "2025-11-13T...",
  appVersion: "1.0.0",
  data: {
    checkIns: [...],
    copingStrategies: [...],
    userConfig: [...]
  }
}
```

**Rationale:** Wrapping the existing `exportData()`/`importData()` functions with file handling and validation ensures data integrity and provides better UX.

---

### **Task 4: Update Root Page with New Welcome Flow Logic**

**Files to modify:**

- `src/app/page.tsx`

**New Logic Flow:**

1. Check if user has completed onboarding (existing)
2. If onboarding complete → redirect to dashboard (existing)
3. If NOT complete:
   - Check for `?access_code=` parameter
   - If found → decode and show provider-specific welcome
   - If NOT found → show generic welcome screen with:
     - Access code input field
     - Import data option
     - Clear messaging about needing provider access

**States:**

- `loading` - Checking onboarding status
- `hasAccessCode` - Valid access code detected
- `isNewUser` - No onboarding data, no access code
- `accessCode` - Access code from URL or manual input

**Rationale:** This provides a graceful experience for all user types without breaking existing functionality.

---

### **Task 5: Add Data Management Section to Settings Page**

**Files to modify:**

- `src/app/settings/page.tsx`

**New Section: "Data Management"**

1. **Export Data** button
   - Downloads JSON file with all user data
   - Shows success message with file name
   - Includes timestamp in filename
2. **Clear All Data** button
   - Shows confirmation dialog before clearing
   - Warns about data loss
   - Redirects to root page after clearing
   - Uses existing `clearAllData()` function

**UI Structure:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Data Management</CardTitle>
    <CardDescription>Export or clear your data</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Export button */}
    {/* Clear data button with confirmation */}
  </CardContent>
</Card>
```

**Rationale:** Settings is the appropriate place for data management features. This keeps the root page focused on onboarding.

---

### **Task 6: Create Import Data Dialog Component**

**Files to create:**

- `src/components/import-data-dialog.tsx`

**Features:**

1. File upload input (accepts `.json` files)
2. Drag-and-drop support
3. Data preview before import
4. Validation feedback
5. Import confirmation
6. Progress indicator
7. Success/error messaging

**Rationale:** A dedicated dialog component provides better UX and can be reused from both the root page and settings page.

---

### **Task 7: Update Onboarding Flow to Handle Access Codes**

**Files to modify:**

- `src/app/onboarding/page.tsx`

**Changes:**

1. Check for access code in URL on mount
2. If access code present, decode and store provider config
3. If no access code and no stored provider config, show error/redirect to root

**Rationale:** Ensures onboarding can't proceed without a valid provider configuration, preventing users from getting stuck.

---

### **Task 8: Add Confirmation Dialog Component**

**Files to create:**

- `src/components/confirmation-dialog.tsx` (if not already exists)

**Features:**

1. Reusable confirmation dialog
2. Customizable title, description, and actions
3. Destructive action variant (for "Clear All Data")
4. Accessible (keyboard navigation, ARIA labels)

**Rationale:** Needed for "Clear All Data" confirmation and potentially other destructive actions.

---

## File Structure Summary

**New Files:**

1. `src/components/welcome-screen.tsx` - Welcome screen for new users
2. `src/components/import-data-dialog.tsx` - Data import dialog
3. `src/components/confirmation-dialog.tsx` - Reusable confirmation dialog
4. `src/lib/services/dataPortabilityService.ts` - Data export/import service

**Modified Files:**

1. `src/app/page.tsx` - Enhanced root page logic
2. `src/app/settings/page.tsx` - Add data management section
3. `src/lib/utils/urlConfig.ts` - Support access_code parameter
4. `src/app/onboarding/page.tsx` - Validate access code presence

---

## Implementation Order

### **Phase 1: Foundation** (Tasks 1, 3, 8)

- Update URL config for access code support
- Create data portability service
- Create confirmation dialog component

### **Phase 2: UI Components** (Tasks 2, 6)

- Create welcome screen component
- Create import data dialog

### **Phase 3: Integration** (Tasks 4, 5, 7)

- Update root page with new logic
- Add data management to settings
- Update onboarding validation

---

## Acceptance Criteria Mapping

✅ **Root page displays welcome screen if no IndexedDB profile exists**

- Task 4: Root page logic update

✅ **Access code auto-filled from `?access_code=` query params**

- Task 1: URL config update
- Task 2: Welcome screen component

✅ **Manual access code entry is possible**

- Task 2: Welcome screen component with input field

✅ **Onboarding cannot progress without provider-issued access code**

- Task 7: Onboarding validation

✅ **If IndexedDB exists, skip welcome screen and load Dashboard**

- Task 4: Root page logic (already partially implemented)

✅ **Root page includes "Import Existing Data" option**

- Task 2: Welcome screen component
- Task 6: Import data dialog

✅ **Export Data feature in Dashboard Settings**

- Task 5: Settings page update
- Task 3: Data portability service

✅ **Import Data option on root page for returning users**

- Task 2: Welcome screen component
- Task 6: Import data dialog

✅ **Clear All Data option in Dashboard Settings**

- Task 5: Settings page update
- Task 8: Confirmation dialog

---

## Privacy & Security Considerations

1. **No PHI in exports** - Data stays local, exports are client-side only
2. **File validation** - Validate imported data structure before applying
3. **Confirmation dialogs** - Prevent accidental data loss
4. **No server transmission** - All import/export happens in browser
5. **Clear user messaging** - Explain what data is being exported/imported

---

## Testing Strategy

**Unit Tests:**

- `dataPortabilityService.test.ts` - Test export/import functions
- `urlConfig.test.ts` - Test access code parsing (update existing)

**Integration Tests:**

- Root page welcome flow
- Import/export workflow
- Clear data workflow

**E2E Tests:**

- New user with access code
- New user without access code (import data)
- Returning user auto-redirect
- Export → Clear → Import workflow

---

## Downstream Changes

After implementing the above, we need to update:

1. **Provider Portal** - Update link generator to use `access_code` parameter instead of `config`
2. **Documentation** - Update README with import/export instructions
3. **Error Messages** - Update error messages to mention import option

---

## DRY Principles

This plan follows DRY principles by:

- Reusing existing `exportData()`, `importData()`, `clearAllData()` functions
- Creating reusable components (welcome screen, dialogs)
- Centralizing data portability logic in a service
- Maintaining existing provider link functionality

The plan maintains the privacy-first architecture by keeping all data operations client-side and never transmitting patient data to servers.

---

## Notes

- **Access Code Parameter:** Using `access_code` as the clean, user-facing parameter name (not supporting backward compatibility with `config`)
- **Provider Links:** The provider portal will need to be updated to generate links with `?access_code=` instead of `?config=`
- **Data Format:** Export files will be timestamped JSON files (e.g., `wbap-data-2025-11-13.json`)
- **File Size:** Exported data should be small (typically < 1MB) since it's local-only data
