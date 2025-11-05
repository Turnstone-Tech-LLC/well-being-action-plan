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
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open http://localhost:3000 in your browser
   - The page auto-updates as you edit files

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
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
npm run type-check

# Run linting
npm run lint

# Run build to ensure no errors
npm run build
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

## Code Style Guidelines

### TypeScript

- Use TypeScript strict mode (already configured)
- Define explicit types for function parameters and returns
- Avoid `any` types when possible
- Use meaningful variable and function names

### React Components

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for props

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use shadcn/ui components when available
- Ensure WCAG 2.1 AA accessibility compliance

### File Organization

- Place React components in `src/components/`
- Place utility functions in `src/lib/`
- Place custom hooks in `src/hooks/`
- Place types/interfaces in relevant module files or `src/lib/types.ts`

## Pull Request Process

### Before Submitting

1. Ensure all tests pass and code builds successfully
2. Run `npm run lint` and fix any issues
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
