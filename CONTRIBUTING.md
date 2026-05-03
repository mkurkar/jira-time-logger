# Contributing to Jira Time Logger

Thank you for your interest in contributing. This document covers everything you need to get started — from setting up a local development environment to submitting a pull request.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Good First Issues](#good-first-issues)

---

## Code of Conduct

Be respectful and constructive. We welcome contributors of all experience levels. Harassment of any kind will not be tolerated.

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- A **Jira Cloud** account with API access
- A Jira API token — generate one at [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

### Local Setup

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/jira-time-logger.git
cd jira-time-logger

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Set up credentials
cp .env.local.example .env.local
# Edit .env.local and fill in JIRA_INSTANCE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app will show a warning banner if your credentials are missing or invalid.

---

## Development Workflow

### Branching

Create a new branch from `main` for every change:

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/the-bug-you-are-fixing
```

Branch naming conventions:

| Prefix | Use for |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code changes with no behaviour change |
| `docs/` | Documentation only |
| `chore/` | Dependency bumps, config changes |

### Useful Commands

```bash
npm run dev          # Start dev server with hot reload
npm run typecheck    # Run TypeScript type checking (zero errors expected)
npm run lint         # Run ESLint
npm run build:next   # Production build — must pass before opening a PR
```

> **Always run `npm run typecheck` and `npm run build:next` before pushing.** PRs with type errors or build failures will not be merged.

---

## Project Structure

```
app/
  page.tsx            — Root page: header + view routing
  layout.tsx          — HTML shell: providers, error boundary, credentials check
  api/                — Next.js API routes (Jira proxy layer)

components/
  AppHeader.tsx       — Sticky header with nav, project selector, user avatar
  calendar/           — All calendar view components and sub-components
  WeeklyGrid.tsx      — Weekly timesheet grid
  MonthlyReportView.tsx
  TeamDashboard.tsx

hooks/                — Custom React hooks (data fetching, interactions)
lib/                  — Shared utilities and constants
types/                — TypeScript type definitions
src/types/            — Jira API response types
```

---

## Submitting Changes

1. **Open an issue first** for non-trivial changes so we can discuss the approach before you invest time writing code.
2. Keep pull requests focused — one feature or fix per PR.
3. Write a clear PR description explaining *what* changed and *why*.
4. Reference the related issue in your PR description: `Closes #123`.
5. Ensure the following all pass locally before opening the PR:
   - `npm run typecheck` — zero errors
   - `npm run lint` — zero warnings or errors
   - `npm run build:next` — successful production build
6. PRs are squash-merged. Your commit messages don't need to be perfect, but your PR title should follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add dark mode toggle
fix: prevent crash when worklog duration is zero
docs: add keyboard shortcut reference to README
```

---

## Coding Standards

### TypeScript

- Strict mode is enabled — no `any` unless absolutely necessary and commented.
- Always type component props with an `interface`, not `type` aliases.
- Use `useCallback` and `useMemo` where appropriate to avoid unnecessary re-renders.

### Styling

- Use **Atlaskit design tokens** (`token('color.text')`, etc.) for all colours, borders, and shadows — do not hardcode hex values.
- Use **TailwindCSS** for layout, spacing, and sizing utilities.
- Do not mix Tailwind colour classes (`text-blue-500`) with Atlaskit tokens — pick one system per property.

### API Routes

- All Jira API calls must go through the Next.js API routes in `app/api/` — never call `atlassian.net` directly from the client.
- Return consistent error shapes: `{ error: string }` with an appropriate HTTP status.
- Validate all incoming request bodies before forwarding to Jira.

### Components

- Keep components focused — if a file grows beyond ~300 lines, consider splitting it.
- Extract reusable logic into custom hooks in `/hooks`.
- Prefer named exports for components; default exports are fine for page-level components.

---

## Reporting Bugs

[Open a bug report](https://github.com/mkurkar/jira-time-logger/issues/new?template=bug_report.md) and include:

- A clear description of the problem
- Steps to reproduce
- Expected vs. actual behaviour
- Your Node.js version and browser
- Any relevant console errors (with Jira credentials redacted)

---

## Requesting Features

[Open a feature request](https://github.com/mkurkar/jira-time-logger/issues/new?template=feature_request.md) and describe:

- The problem you are trying to solve
- Your proposed solution (or just the problem if you are not sure)
- Any alternatives you have considered

---

## Good First Issues

Look for issues labelled [`good first issue`](https://github.com/mkurkar/jira-time-logger/labels/good%20first%20issue) — these are scoped tasks with enough context to get started without deep knowledge of the codebase.

If you are new to the project and want to contribute but are unsure where to start, feel free to open a discussion and ask.

---

## Questions?

Open a [GitHub Discussion](https://github.com/mkurkar/jira-time-logger/discussions) — it is the best place for questions, ideas, and general feedback.
