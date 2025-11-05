# Well-Being Action Plan (WBAP)

> Open-source Progressive Web App for youth mental health support through digital Well-Being Action Plans

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black)](https://nextjs.org/)

## Overview

Well-Being Action Plan (WBAP) is a privacy-first Progressive Web App designed to support youth mental health through personalized digital well-being action plans. Built with a local-first architecture, all patient data is stored securely on-device using IndexedDB, ensuring complete privacy and offline functionality.

## Tech Stack

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** Dexie.js (IndexedDB wrapper)
- **PWA:** next-pwa for Progressive Web App functionality
- **Deployment:** Vercel-ready configuration

## Key Features

- **Local-First Architecture:** All patient data stored locally via IndexedDB
- **Offline Support:** Full functionality without internet connection
- **Privacy-First:** No cloud storage of sensitive patient information
- **Progressive Web App:** Installable on mobile and desktop devices
- **Accessible Design:** WCAG-compliant, mobile-first responsive design
- **Crisis Resources:** Quick access to 988 Suicide & Crisis Lifeline and Crisis Text Line (741741)

## Quick Start

### Prerequisites

- Node.js 22+ (LTS)
- pnpm 9+ (recommended) or npm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Turnstone-Tech-LLC/well-being-action-plan.git
cd well-being-action-plan

# Install pnpm (if not already installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
# Create optimized production build
pnpm build

# Start production server
pnpm start
```

## Documentation

For detailed information about the architecture, development guidelines, and more:

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting pull requests.

### Ways to Contribute

- Report bugs and request features via GitHub Issues
- Submit pull requests for bug fixes or new features
- Improve documentation
- Share feedback and suggestions

## Privacy & Security

This application prioritizes user privacy:

- **No cloud storage** of patient data
- **Local-only** data persistence using IndexedDB
- **Offline-first** design ensuring functionality without network access
- **No tracking** or analytics on patient data

Provider portal authentication uses Supabase Auth, but patient well-being plans remain local-only.

## Crisis Resources

If you or someone you know is in crisis:

- **988 Suicide & Crisis Lifeline:** Call or text 988
- **Crisis Text Line:** Text HOME to 741741
- **Emergency Services:** Call 911

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

Built with care by [Turnstone Tech LLC](https://turnstone.tech) for the mental health community.

---

**Note:** This is mental health software. If you're experiencing a crisis, please contact emergency services or a crisis helpline immediately.
