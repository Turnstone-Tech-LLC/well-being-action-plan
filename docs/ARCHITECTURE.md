# Well-Being Action Plan - Architecture Overview

## Table of Contents

- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [Technology Stack](#technology-stack)
- [Data Architecture](#data-architecture)
- [Application Structure](#application-structure)
- [Security & Privacy](#security--privacy)
- [Progressive Web App Features](#progressive-web-app-features)

## Overview

Well-Being Action Plan (WBAP) is built as a Progressive Web App with a local-first architecture, prioritizing privacy, offline functionality, and accessibility for youth mental health support.

## Architecture Principles

### 1. Local-First Design

All patient data is stored locally on the user's device using IndexedDB. This ensures:
- **Privacy:** Sensitive mental health data never leaves the device
- **Offline Access:** Full functionality without internet connection
- **Performance:** Instant data access without network latency
- **User Control:** Users own their data completely

### 2. Privacy-First Approach

- **No Cloud Storage:** Patient well-being action plans are never transmitted to servers
- **Minimal Data Collection:** Only essential data for app functionality
- **No Analytics Tracking:** No patient behavior tracking or analytics
- **Transparent Data Flow:** Clear documentation of what data goes where

### 3. Accessibility-First Design

- **WCAG 2.1 AA Compliance:** Meeting accessibility standards
- **Mobile-First:** Optimized for mobile devices primarily used by youth
- **Screen Reader Support:** Semantic HTML and ARIA labels
- **Crisis Resources:** Always accessible, prominent placement

## Technology Stack

### Frontend Framework
- **Next.js 14+** with App Router for modern React development
- **TypeScript** with strict mode for type safety
- **React 18+** for UI components

### Styling & Components
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for accessible, customizable components
- **CSS Variables** for theming support

### Data Layer
- **Dexie.js** - Type-safe IndexedDB wrapper
- **React Hooks** for state management
- **Custom hooks** for data access patterns

### Progressive Web App
- **next-pwa** - Service worker generation and caching
- **Web App Manifest** - Installation and metadata
- **Offline Support** - Full functionality without network

### Build & Development
- **ESLint** for code quality
- **Prettier** for code formatting
- **TypeScript Compiler** for type checking

## Data Architecture

### Local Storage (IndexedDB)

```
IndexedDB Database: "wbap-db"
├── patients (table)
│   ├── id (primary key)
│   ├── demographics
│   └── created_at
├── wellbeing_plans (table)
│   ├── id (primary key)
│   ├── patient_id (foreign key)
│   ├── goals
│   ├── strategies
│   ├── support_network
│   ├── warning_signs
│   ├── crisis_resources
│   └── updated_at
└── provider_settings (table)
    ├── id (primary key)
    ├── organization_info
    └── preferences
```

### Data Flow

1. **Patient Data Entry**
   ```
   User Input → React Component → Custom Hook → Dexie.js → IndexedDB
   ```

2. **Data Retrieval**
   ```
   IndexedDB → Dexie.js → Custom Hook → React Component → UI
   ```

3. **URL-Based Sharing** (Read-Only)
   ```
   Plan Data → Encoded JSON → URL Parameter → Decode → Display Only
   ```

### Provider Portal (Cloud-Based)

**Separate from patient data:**
- **Supabase Auth** for provider authentication
- **Provider profiles** stored in cloud
- **Organization settings** synchronized
- **NO patient data** in cloud storage

## Application Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Home page
│   ├── plan/                    # Well-being plan routes
│   ├── provider/                # Provider portal routes
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── plan/                    # Plan-specific components
│   ├── provider/                # Provider portal components
│   └── shared/                  # Shared components
├── lib/                         # Utilities and core logic
│   ├── db.ts                    # Dexie database configuration
│   ├── types.ts                 # TypeScript type definitions
│   ├── utils.ts                 # Utility functions
│   └── constants.ts             # App constants
└── hooks/                       # Custom React hooks
    ├── useWellbeingPlan.ts     # Plan data management
    ├── usePatient.ts           # Patient data management
    └── useOfflineSync.ts       # Offline sync logic

public/
├── icons/                       # PWA icons
├── manifest.json               # PWA manifest
└── robots.txt                  # SEO configuration

docs/                            # Documentation
├── ARCHITECTURE.md             # This file
├── API.md                      # API documentation
└── DEPLOYMENT.md               # Deployment guide
```

## Security & Privacy

### Data Security Measures

1. **Local Storage Encryption** (Future Enhancement)
   - IndexedDB encryption at rest
   - User-controlled encryption keys

2. **No Sensitive Data Transmission**
   - Patient data stays on device
   - Only provider authentication data transmitted

3. **URL Sharing Security**
   - Base64 encoding (not encryption)
   - Read-only access via URLs
   - No server-side storage of shared plans

### Privacy Considerations

- **HIPAA Alignment:** Local storage reduces HIPAA scope
- **No Analytics:** No Google Analytics or similar tracking
- **Minimal Permissions:** Only requests necessary device permissions
- **Transparent Practices:** Clear privacy policy and data flow

## Progressive Web App Features

### Service Worker Strategy

```javascript
// Caching Strategy
- Static Assets: Cache-first
- API Calls: Network-first (provider portal only)
- Patient Data: Local IndexedDB (no network)
```

### Offline Functionality

1. **Full Offline Access**
   - View and edit well-being plans
   - Access crisis resources
   - Navigate all patient-facing features

2. **Offline-Only Features**
   - Patient well-being plans (never online)
   - Crisis resources always available

3. **Online-Required Features**
   - Provider portal authentication
   - Organizational settings sync

### Installation

- **Installable:** Add to home screen on iOS and Android
- **Standalone Mode:** Runs like native app
- **App Icon:** Custom branding

## URL-Based Configuration System

### Sharing Well-Being Plans

Plans can be shared via URLs for viewing only:

```
Format: /plan/view?data=<base64-encoded-json>

Example Flow:
1. Provider creates plan in app
2. System encodes plan data to Base64
3. Generates shareable URL
4. Recipient opens URL → plan displays read-only
5. No server-side storage of shared content
```

### Security Notes

- **Not encryption:** Base64 is encoding, not security
- **URL length limits:** Large plans may exceed browser limits
- **Alternative:** QR codes for sharing without typing URLs

## Future Architecture Considerations

### Planned Enhancements

1. **End-to-End Encryption**
   - Encrypt IndexedDB data at rest
   - User-managed encryption keys

2. **Peer-to-Peer Sync**
   - Device-to-device sync without cloud
   - WebRTC for direct connections

3. **Enhanced Offline Support**
   - Background sync for provider features
   - Conflict resolution strategies

4. **Export/Import**
   - Export plans to encrypted files
   - Import from other systems

### Scalability

- **Client-side:** No backend scaling concerns for patient data
- **Provider Portal:** Supabase handles authentication scaling
- **Static Assets:** CDN distribution via Vercel

## Development Guidelines

### Adding New Features

1. **Privacy Check:** Does this transmit patient data? (Should be NO)
2. **Offline Check:** Does this work offline? (Should be YES for patient features)
3. **Accessibility Check:** Is this accessible? (Should be YES)
4. **Type Safety:** Are types properly defined? (Should be YES)

### Database Schema Changes

1. Update Dexie schema with version increment
2. Write migration logic for existing data
3. Test migration on sample data
4. Document schema changes

### Performance Considerations

- **Code Splitting:** Use Next.js dynamic imports
- **Image Optimization:** Next.js Image component
- **Bundle Size:** Monitor and minimize dependencies
- **IndexedDB Queries:** Index frequently queried fields

## Testing Strategy

### Unit Tests
- Utility functions
- Custom hooks (with React Testing Library)
- Data transformations

### Integration Tests
- Component interactions
- Database operations
- Service worker behavior

### E2E Tests (Future)
- User workflows
- Offline functionality
- Cross-browser compatibility

### Accessibility Tests
- Automated: axe-core, Lighthouse
- Manual: Screen reader testing
- User testing with accessibility needs

## Deployment

### Vercel Deployment

- **Zero Configuration:** Next.js automatic deployment
- **Edge Network:** Global CDN for static assets
- **Environment Variables:** Secure provider portal config
- **Preview Deployments:** PR-based previews

### Production Checklist

- [ ] Environment variables configured
- [ ] PWA manifest updated
- [ ] Icons generated for all sizes
- [ ] Crisis resources verified and current
- [ ] Accessibility audit passed
- [ ] Privacy policy reviewed
- [ ] Performance budget met

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Dexie.js Documentation](https://dexie.org)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Questions or suggestions about the architecture?** Open a GitHub Discussion or Issue.
