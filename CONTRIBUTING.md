# Contributing to Well-Being Action Plan

Thank you for your interest in contributing to the Well-Being Action Plan (WBAP) project! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project is dedicated to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and considerate in communication
- Welcome diverse perspectives and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community and users
- Show empathy towards other community members

**This is a mental health application.** Please be especially mindful of language and approach when discussing features or issues related to sensitive topics.

## Getting Started

### Development Environment Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR-USERNAME/well-being-action-plan.git
   cd well-being-action-plan
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Run Development Server**

   ```bash
   pnpm run dev
   ```

4. **Access Application**
   - Open http://localhost:3000 in your browser
   - The page auto-updates as you edit files

### Prerequisites

- Node.js 22 or higher (LTS)
- pnpm 9.0.0 or higher (required package manager)
- Git
- Code editor (VS Code recommended)

## Development Workflow

### Creating a Branch

Create a descriptive branch name:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Making Changes

1. Make your changes in logical, atomic commits
2. Write clear, descriptive commit messages
3. Follow the existing code style and conventions
4. Add tests for new features when applicable
5. Update documentation as needed

### Testing Your Changes

```bash
# Run type checking
pnpm run type-check

# Run linting
pnpm run lint

# Run build to ensure no errors
pnpm run build
```

### Commit Message Guidelines

Use clear, descriptive commit messages:

**Good examples:**

- `feat: Add crisis resources banner component`
- `fix: Resolve IndexedDB connection error on Safari`
- `docs: Update installation instructions`
- `refactor: Simplify well-being plan data structure`

**Format:**

```
<type>: <short summary>

<optional detailed description>

<optional footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting (no logic changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Code Quality Tools

### ESLint and Prettier

This project uses ESLint and Prettier to maintain code quality and consistency.

**Automated formatting and linting:**

- Code is automatically formatted on save (if using recommended VSCode settings)
- Lint checks run automatically before each commit via husky pre-commit hooks
- ESLint enforces TypeScript, React, and accessibility best practices

**Available scripts:**

```bash
# Run ESLint to check for issues
pnpm run lint

# Auto-fix ESLint issues
pnpm run lint:fix

# Format code with Prettier
pnpm run format

# Check formatting without modifying files
pnpm run format:check

# Type checking
pnpm run type-check
```

### ESLint Configuration

ESLint is configured with:

- **TypeScript rules**: Enforces type safety and best practices
- **React rules**: Ensures proper React patterns and hooks usage
- **Accessibility rules** (`eslint-plugin-jsx-a11y`): Critical for mental health application
  - Alt text for images
  - ARIA attributes validation
  - Semantic HTML enforcement
  - Keyboard navigation support
  - Label associations for form elements

Key rules enforced:

- No unused variables (with exceptions for `_` prefixed variables)
- Prefer `const` over `let`
- No `var` declarations
- Consistent equality checks (`===`)
- Proper React hooks usage
- Accessibility compliance (WCAG 2.1 AA)

### Prettier Configuration

Prettier enforces consistent code formatting:

- Single quotes for strings
- Semicolons required
- 2 spaces for indentation
- 100 character line width
- Trailing commas in ES5 style
- Tailwind CSS class sorting (via plugin)

### Pre-commit Hooks

Pre-commit hooks automatically run before each commit using husky and lint-staged:

1. Runs ESLint with auto-fix on staged `.js`, `.jsx`, `.ts`, `.tsx` files
2. Runs Prettier on staged files (code and config files)
3. Prevents commits if there are unfixable linting errors

**To bypass hooks** (not recommended):

```bash
git commit --no-verify
```

### VSCode Setup (Recommended)

1. **Install Recommended Extensions**

   When you open the project in VSCode, you'll be prompted to install recommended extensions:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - TypeScript
   - Error Lens
   - Code Spell Checker
   - Pretty TypeScript Errors

2. **Workspace Settings**

   The `.vscode/settings.json` configures:
   - Format on save
   - Auto-fix ESLint issues on save
   - Prettier as default formatter
   - TypeScript path mapping
   - Tailwind CSS IntelliSense

## Code Style Guidelines

### TypeScript

- Use TypeScript strict mode (already configured)
- Define explicit types for function parameters and returns
- Avoid `any` types when possible (ESLint will warn)
- Use meaningful variable and function names
- Prefix unused parameters with `_` to avoid linting warnings

### React Components

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for props
- Self-close components without children
- Avoid unnecessary curly braces in JSX

### Accessibility

**Critical for mental health application:**

- Always provide alt text for images
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- Ensure proper heading hierarchy (`h1` → `h2` → `h3`)
- Include ARIA labels where needed
- Test keyboard navigation
- Maintain sufficient color contrast
- Associate labels with form inputs

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use shadcn/ui components when available
- Ensure WCAG 2.1 AA accessibility compliance
- Let Prettier sort Tailwind classes automatically

### File Organization

- Place React components in `src/components/`
- Place utility functions in `src/lib/`
- Place custom hooks in `src/hooks/`
- Place types/interfaces in relevant module files or `src/lib/types.ts`

## Pull Request Process

### Before Submitting

1. Ensure all tests pass and code builds successfully
2. Run `pnpm run lint` and fix any issues
3. Update documentation if needed
4. Rebase your branch on the latest main branch

### Submitting a Pull Request

1. **Push Your Branch**

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

3. **PR Description Should Include:**
   - Clear description of changes
   - Related issue numbers (if applicable)
   - Screenshots for UI changes
   - Testing steps performed
   - Any breaking changes

### Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, a maintainer will merge your PR

## Reporting Issues

### Bug Reports

When reporting bugs, include:

- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser/device information
- Screenshots if applicable
- Console errors (if any)

### Feature Requests

When requesting features:

- Describe the problem you're trying to solve
- Explain your proposed solution
- Consider accessibility and privacy implications
- Note any alternative solutions considered

## Privacy & Security Considerations

**Critical:** This is a mental health application handling sensitive data.

- Never log, transmit, or store patient data in cloud services
- All patient data must remain in IndexedDB (local storage)
- Follow HIPAA-aligned privacy practices
- Report security vulnerabilities privately to maintainers
- Consider accessibility in all features

## Questions?

- Open a GitHub Discussion for general questions
- Tag issues with `question` label
- Reach out to maintainers for sensitive topics

## Recognition

Contributors will be recognized in:

- GitHub contributors page
- Release notes for significant contributions
- Project documentation

Thank you for contributing to mental health support tools! 💙

---

**Remember:** If you encounter content related to self-harm or crisis situations while developing, please reach out to crisis resources (988 or 741741) if needed.
