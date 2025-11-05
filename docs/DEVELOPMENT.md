# Development Environment Setup

This guide will help you set up your local development environment for the Well-Being Action Plan (WBAP) project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Using npm](#using-npm)
  - [Using yarn](#using-yarn)
  - [Using pnpm](#using-pnpm)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Platform-Specific Notes](#platform-specific-notes)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required

- **Node.js**: Version 18.0.0 or higher
  - Check your version: `node --version`
  - Download from: [nodejs.org](https://nodejs.org/)
  - Recommended: Use [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) for easy version management

### Package Manager (choose one)

- **npm**: Version 9.0.0 or higher (comes with Node.js)
  - Check your version: `npm --version`

- **yarn**: Version 1.22.0 or higher (optional)
  - Install: `npm install -g yarn`
  - Check your version: `yarn --version`

- **pnpm**: Version 8.0.0 or higher (optional)
  - Install: `npm install -g pnpm`
  - Check your version: `pnpm --version`

### Recommended Tools

- **Git**: Version control
- **VS Code**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)

## Installation

### Using npm

```bash
# Clone the repository
git clone https://github.com/Turnstone-Tech-LLC/well-being-action-plan.git
cd well-being-action-plan

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Using yarn

```bash
# Clone the repository
git clone https://github.com/Turnstone-Tech-LLC/well-being-action-plan.git
cd well-being-action-plan

# Install dependencies
yarn install

# Copy environment variables
cp .env.example .env.local

# Start development server
yarn dev
```

### Using pnpm

```bash
# Clone the repository
git clone https://github.com/Turnstone-Tech-LLC/well-being-action-plan.git
cd well-being-action-plan

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

After starting the development server, open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Environment Variables

The application uses environment variables for configuration. Create a `.env.local` file in the project root by copying `.env.example`:

```bash
cp .env.example .env.local
```

### Required Variables

```bash
# Next.js Configuration
NODE_ENV=development
```

### Optional Variables

These are only needed if you're working on provider portal features:

```bash
# Provider Portal (Supabase) - Optional
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### App Configuration

```bash
# App Configuration
NEXT_PUBLIC_APP_NAME="Well-Being Action Plan"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note:** The core patient-facing features work entirely offline and don't require any external services. Supabase variables are only needed for the optional provider portal authentication.

## Development Workflow

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Make your changes** in the `src/` directory

3. **Check for errors:**
   ```bash
   # Type checking
   npm run type-check

   # Linting
   npm run lint

   # Format checking
   npm run format:check
   ```

4. **Fix formatting issues:**
   ```bash
   # Auto-fix linting issues
   npm run lint:fix

   # Auto-format code
   npm run format
   ```

5. **Build for production** to test:
   ```bash
   npm run build
   npm start
   ```

## Available Scripts

| Script | npm | yarn | pnpm | Description |
|--------|-----|------|------|-------------|
| Development Server | `npm run dev` | `yarn dev` | `pnpm dev` | Start Next.js development server on port 3000 |
| Build | `npm run build` | `yarn build` | `pnpm build` | Create optimized production build |
| Start | `npm start` | `yarn start` | `pnpm start` | Start production server |
| Lint | `npm run lint` | `yarn lint` | `pnpm lint` | Run ESLint (fails on warnings) |
| Lint Fix | `npm run lint:fix` | `yarn lint:fix` | `pnpm lint:fix` | Auto-fix ESLint issues |
| Type Check | `npm run type-check` | `yarn type-check` | `pnpm type-check` | Run TypeScript type checking |
| Format | `npm run format` | `yarn format` | `pnpm format` | Format code with Prettier |
| Format Check | `npm run format:check` | `yarn format:check` | `pnpm format:check` | Check code formatting |

## Troubleshooting

### Common Issues and Solutions

#### 1. Port 3000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find and kill the process using port 3000
# On macOS/Linux:
lsof -ti:3000 | xargs kill -9

# On Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or use a different port:
PORT=3001 npm run dev
```

#### 2. Node Version Mismatch

**Error:**
```
error: The engine "node" is incompatible with this module
```

**Solution:**
```bash
# Check your Node.js version
node --version

# If using nvm, install and use the correct version:
nvm install 18
nvm use 18

# Or download the latest LTS from nodejs.org
```

#### 3. Module Not Found Errors

**Error:**
```
Module not found: Can't resolve 'xyz'
```

**Solution:**
```bash
# Delete node_modules and lock file, then reinstall
rm -rf node_modules
rm package-lock.json  # or yarn.lock or pnpm-lock.yaml

# Reinstall dependencies
npm install  # or yarn/pnpm install
```

#### 4. TypeScript Errors After Pull

**Error:**
```
Type error: Cannot find module...
```

**Solution:**
```bash
# Reinstall dependencies
npm install

# Clear Next.js cache
rm -rf .next

# Restart development server
npm run dev
```

#### 5. ESLint Configuration Errors

**Error:**
```
ESLint configuration error
```

**Solution:**
```bash
# Clear ESLint cache
rm -rf node_modules/.cache

# Reinstall dependencies
npm install
```

#### 6. Build Fails in CI/CD

**Issue:** Build passes locally but fails in CI

**Solution:**
- Ensure all linting issues are fixed: `npm run lint`
- Check TypeScript errors: `npm run type-check`
- Verify formatting: `npm run format:check`
- Our CI requires zero warnings and errors

#### 7. PWA Not Working Locally

**Issue:** Service worker not registering in development

**Note:** PWA features (service worker, offline support) are only enabled in production builds.

**Solution:**
```bash
# Build and test production version locally
npm run build
npm start
```

#### 8. Database/IndexedDB Issues

**Issue:** Data not persisting or errors with Dexie

**Solution:**
```bash
# Clear browser data for localhost:3000
# In Chrome: DevTools > Application > Clear storage

# Or open in incognito mode to test fresh state
```

#### 9. Permission Errors During Install

**Error:**
```
EACCES: permission denied
```

**Solution:**
```bash
# Never use sudo with npm
# Fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile

# Then reinstall
npm install
```

#### 10. Slow Installation

**Issue:** `npm install` takes too long

**Solutions:**
```bash
# Try pnpm (fastest)
npm install -g pnpm
pnpm install

# Or use npm with cache
npm install --prefer-offline

# Clear npm cache if corrupted
npm cache clean --force
```

## Platform-Specific Notes

### macOS

**Verified on:** macOS Sonoma 14.0+

**Setup:**
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js via Homebrew
brew install node@18

# Or use nvm (recommended)
brew install nvm
nvm install 18
nvm use 18
```

**Notes:**
- Xcode Command Line Tools may be required: `xcode-select --install`
- No known compatibility issues

### Windows

**Verified on:** Windows 10/11

**Setup:**
```powershell
# Option 1: Download installer from nodejs.org

# Option 2: Use Chocolatey
choco install nodejs-lts

# Option 3: Use nvm-windows
# Download from: https://github.com/coreybutler/nvm-windows
nvm install 18.0.0
nvm use 18.0.0
```

**Notes:**
- Use PowerShell or Command Prompt (not Git Bash for npm commands)
- Windows Defender may slow down `npm install` - add project folder to exclusions
- If using WSL2, follow Linux instructions instead

**Common Windows Issues:**
- **Long path names:** Enable long paths in Windows:
  ```powershell
  # Run as Administrator
  New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
  ```

### Linux

**Verified on:** Ubuntu 20.04+, Debian 11+, Fedora 35+

**Setup (Ubuntu/Debian):**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

**Setup (Fedora):**
```bash
# Using DNF
sudo dnf install nodejs

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

**Notes:**
- Avoid system Node.js packages (often outdated)
- Use nvm for easier version management
- No known compatibility issues

## Getting Help

If you encounter issues not covered here:

1. **Check existing issues:** [GitHub Issues](https://github.com/Turnstone-Tech-LLC/well-being-action-plan/issues)
2. **Create a new issue:** Include:
   - Operating system and version
   - Node.js version (`node --version`)
   - Package manager and version
   - Complete error message
   - Steps to reproduce

## Next Steps

After setting up your development environment:

1. Read the [Architecture Overview](./ARCHITECTURE.md)
2. Review the [Contributing Guidelines](../CONTRIBUTING.md)
3. Check open issues for good first issues
4. Join the community discussions

---

**Happy coding! 🚀**
