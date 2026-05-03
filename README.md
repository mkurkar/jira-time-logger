# Jira Time Logger

A full-featured time tracking application for Jira — built with Next.js. Log work hours, manage your team's time, and export reports without ever leaving your browser.

---

## Features

### Views

| View | Description |
|------|-------------|
| **Weekly Grid** | Spreadsheet-style timesheet with daily columns across all your issues |
| **Calendar** | Drag-and-drop calendar with hourly slots, resize handles, and multi-user overlays |
| **My Report** | Monthly summary with PDF and CSV export, filterable by team member |
| **Team Dashboard** | Per-user progress cards with overtime/under-time alerts for the current month |

### Calendar

- Drag worklog blocks to reschedule; drag the bottom edge to resize duration
- Click any empty slot to open the issue picker and log time in one step
- Drag an issue from the sidebar directly onto the calendar to create a worklog
- **Worklog templates** — save recurring tasks with a default duration, then apply with one click or drag to the calendar
- Multi-user mode: overlay worklogs from multiple team members with colour coding
- **Keyboard shortcuts**:

  | Key | Action |
  |-----|--------|
  | `T` | Jump to today |
  | `Alt ←` / `Alt →` | Previous / next week |
  | `N` | New worklog for today |
  | `E` | Edit selected worklog |
  | `Delete` / `Backspace` | Delete selected worklog |
  | `Escape` | Close menu / clear selection |

- Context menu (right-click) with Edit, Duplicate, and Delete actions
- Issue sidebar with recent-issues section and drag-to-calendar support
- Settings popover: configurable working hours range, grid snap interval, and day count

### Reporting

- **My Report** — monthly worklog breakdown per issue, total hours, exportable as PDF or CSV
- **Account picker** — generate reports for any team member who logged time that month
- **Team Dashboard** — pro-rated progress badges per user (Ahead / On track / At risk / Behind), shown only for the current month

### Data & API

- All data fetched from the official Jira REST API v3 — no third-party sync service
- React Query caching with smart invalidation (stale-while-revalidate)
- Write validation: worklogs shorter than 60 seconds are rejected with a descriptive error
- Project selector supports **All Projects** (fetches across all your assigned issues) or a single project scope

### Quality of Life

- **Sticky app header** with branding, pill-style navigation, project selector, and user avatar chip
- **Credentials banner** — detects missing or invalid `.env.local` config on load and shows a dismissible warning
- **Global error boundary** — catches unexpected React errors and shows an auth-aware fallback UI
- Responsive layout — sidebar and nav items collapse gracefully on smaller screens
- localStorage persistence for calendar settings, recently used issues, and worklog templates

---

## Tech Stack

- **Next.js 16** (App Router, API routes)
- **React 19** with TypeScript 5
- **Atlassian Design System** (`@atlaskit/*`) — tokens, components, icons
- **TailwindCSS** — utility layout and spacing
- **TanStack Query (React Query v5)** — server state, caching, background refetch
- **date-fns** — date arithmetic and formatting
- **@react-pdf/renderer** — client-side PDF generation for monthly reports

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Jira Cloud account with API access
- A Jira API token — generate one at [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mkurkar/jira-time-logger.git
cd jira-time-logger

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Configure credentials
cp .env.local.example .env.local
# Edit .env.local with your values (see below)

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file at the project root:

```env
JIRA_INSTANCE_URL=https://your-domain.atlassian.net
JIRA_USER_EMAIL=you@example.com
JIRA_API_TOKEN=your-api-token
```

| Variable | Description |
|----------|-------------|
| `JIRA_INSTANCE_URL` | Full URL of your Jira Cloud instance |
| `JIRA_USER_EMAIL` | Email address of the Jira account used for API calls |
| `JIRA_API_TOKEN` | API token generated from your Atlassian account settings |

> The application will show a dismissible warning banner at startup if any credential is missing or invalid.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server at `localhost:3000` |
| `npm run build` | Compile a production build |
| `npm run start` | Start the compiled production server |
| `npm run lint` | Run ESLint across the codebase |

---

## Project Structure

```
app/
  page.tsx              — Root page: header + view routing
  layout.tsx            — HTML shell: error boundary, credentials check
  api/                  — Next.js API routes (Jira proxy layer)
    worklogs/           — GET / POST / PUT / DELETE worklogs
    projects/           — List accessible projects
    report/             — Monthly report aggregation
    team-report/        — Team-wide worklog summary
    my-issues/          — Issues with worklogs in a date range
    myself/             — Current authenticated user

components/
  AppHeader.tsx         — Sticky header: branding, nav tabs, project selector, avatar
  CredentialsCheck.tsx  — Banner shown when Jira credentials are missing
  ErrorBoundary.tsx     — React class error boundary
  ProjectSelector.tsx   — Dropdown: All Projects or a specific project
  WeeklyGrid.tsx        — Weekly timesheet grid view
  MonthlyReportView.tsx — Monthly report with PDF/CSV export and account picker
  TeamDashboard.tsx     — Team progress cards with overtime alerts
  calendar/
    CalendarView.tsx    — Calendar orchestration (hooks, state, layout)
    CalendarDayColumn.tsx
    CalendarToolbar.tsx
    IssueSidebar.tsx    — Issues + Templates tabbed sidebar
    WorklogTemplatesPanel.tsx — Template CRUD and drag-to-calendar

hooks/
  useCalendarKeyboard.ts — Keyboard shortcut bindings
  useCalendarNavigation.ts
  useCalendarEvents.ts
  useEventDrag.ts
  useEventResize.ts
  useSlotSelection.ts
  useContextMenu.ts
  useIssueDragDrop.ts
  useTeamMembers.ts
  useMultiUserWorklogs.ts
  useProjects.ts

types/
  calendar.ts           — CalendarEvent, CalendarSettings
  report.ts             — Report row types
  template.ts           — WorklogTemplate + localStorage helpers
```

---

## License

MIT
