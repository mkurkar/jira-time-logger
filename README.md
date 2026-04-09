# Jira Time Logger

A modern timesheet and calendar application for logging work hours to Jira.

## Features

- **Weekly Grid View** — Spreadsheet-style time entry with daily columns
- **Calendar View** — Drag-and-drop calendar with hourly time slots
- **Multi-User Support** — View and manage worklogs for team members
- **Issue Search** — Find Jira issues by key, summary, or project
- **Bulk Entry** — Log time across multiple days at once
- **Historical Logs** — View past worklog entries
- **Keyboard Shortcuts** — Quick navigation and actions
- **React Query Caching** — Smart data fetching with automatic invalidation

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** with TypeScript
- **TailwindCSS** for styling
- **React Query** for server state management
- **Jira REST API** integration

## Getting Started

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and fill in your Jira credentials
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.local.example` for required configuration.
