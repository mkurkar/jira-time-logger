import type { JiraWorklog } from '@/src/types/jira';

/** A single worklog entry enriched with issue context */
export interface ReportWorklogEntry {
  worklogId: string;
  issueKey: string;
  issueSummary: string;
  projectKey: string;
  projectName: string;
  date: string;          // YYYY-MM-DD
  timeSpentSeconds: number;
  comment: string;
  authorAccountId: string;
  authorName: string;
}

/** Per-issue aggregation for the monthly report */
export interface ReportIssueRow {
  issueKey: string;
  issueSummary: string;
  projectKey: string;
  projectName: string;
  totalSeconds: number;
  entries: ReportWorklogEntry[];
}

/** Per-project aggregation for the monthly report */
export interface ReportProjectRow {
  projectKey: string;
  projectName: string;
  totalSeconds: number;
  issues: ReportIssueRow[];
}

/** Per-day aggregation for the monthly report */
export interface ReportDayRow {
  date: string;          // YYYY-MM-DD
  totalSeconds: number;
  entries: ReportWorklogEntry[];
}

/** Full monthly report for a single user */
export interface MonthlyReport {
  month: number;         // 1–12
  year: number;
  authorAccountId: string;
  authorName: string;
  totalSeconds: number;
  byDay: ReportDayRow[];
  byIssue: ReportIssueRow[];
  byProject: ReportProjectRow[];
}

/** Per-user summary row for the team dashboard */
export interface DashboardUserRow {
  accountId: string;
  displayName: string;
  totalSeconds: number;
  targetSeconds: number;   // monthly target hours * 3600
  projectBreakdown: { projectKey: string; projectName: string; totalSeconds: number }[];
  dailyActivity: Record<string, number>;  // YYYY-MM-DD → seconds
}

/** Full team dashboard data */
export interface TeamDashboard {
  month: number;
  year: number;
  users: DashboardUserRow[];
}

/** Target hours config stored in localStorage */
export interface TargetHoursConfig {
  monthlyHours: number;  // e.g. 160
}

export const DEFAULT_TARGET_HOURS: TargetHoursConfig = {
  monthlyHours: 160,
};

// ── Helper: format seconds → "Xh Ym" ──────────────────────────────────────────

export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100;
}

// ── Aggregator ─────────────────────────────────────────────────────────────────

export interface RawReportInput {
  issueKey: string;
  issueSummary: string;
  projectKey: string;
  projectName: string;
  worklogs: JiraWorklog[];
}

export function buildMonthlyReport(
  inputs: RawReportInput[],
  month: number,
  year: number,
  authorAccountId: string,
  authorName: string,
): MonthlyReport {
  const entries: ReportWorklogEntry[] = [];

  for (const { issueKey, issueSummary, projectKey, projectName, worklogs } of inputs) {
    for (const wl of worklogs) {
      if (wl.author.accountId !== authorAccountId) continue;
      const date = wl.started.slice(0, 10); // YYYY-MM-DD
      const [y, mo] = date.split('-').map(Number);
      if (y !== year || mo !== month) continue;

      const comment = extractCommentText(wl);
      entries.push({
        worklogId: wl.id,
        issueKey,
        issueSummary,
        projectKey,
        projectName,
        date,
        timeSpentSeconds: wl.timeSpentSeconds,
        comment,
        authorAccountId: wl.author.accountId,
        authorName: wl.author.displayName,
      });
    }
  }

  const totalSeconds = entries.reduce((s, e) => s + e.timeSpentSeconds, 0);

  // By day
  const dayMap = new Map<string, ReportDayRow>();
  for (const e of entries) {
    if (!dayMap.has(e.date)) dayMap.set(e.date, { date: e.date, totalSeconds: 0, entries: [] });
    const row = dayMap.get(e.date)!;
    row.totalSeconds += e.timeSpentSeconds;
    row.entries.push(e);
  }
  const byDay = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // By issue
  const issueMap = new Map<string, ReportIssueRow>();
  for (const e of entries) {
    if (!issueMap.has(e.issueKey)) {
      issueMap.set(e.issueKey, {
        issueKey: e.issueKey,
        issueSummary: e.issueSummary,
        projectKey: e.projectKey,
        projectName: e.projectName,
        totalSeconds: 0,
        entries: [],
      });
    }
    const row = issueMap.get(e.issueKey)!;
    row.totalSeconds += e.timeSpentSeconds;
    row.entries.push(e);
  }
  const byIssue = Array.from(issueMap.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);

  // By project
  const projectMap = new Map<string, ReportProjectRow>();
  for (const issueRow of byIssue) {
    if (!projectMap.has(issueRow.projectKey)) {
      projectMap.set(issueRow.projectKey, {
        projectKey: issueRow.projectKey,
        projectName: issueRow.projectName,
        totalSeconds: 0,
        issues: [],
      });
    }
    const row = projectMap.get(issueRow.projectKey)!;
    row.totalSeconds += issueRow.totalSeconds;
    row.issues.push(issueRow);
  }
  const byProject = Array.from(projectMap.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);

  return { month, year, authorAccountId, authorName, totalSeconds, byDay, byIssue, byProject };
}

/** Extract plain text from an ADF comment or return empty string */
function extractCommentText(wl: JiraWorklog): string {
  if (!wl.comment) return '';
  const nodes = wl.comment.content ?? [];
  const texts: string[] = [];
  function walk(node: { type: string; text?: string; content?: unknown[] }) {
    if (node.text) texts.push(node.text);
    if (node.content) (node.content as typeof nodes).forEach(walk);
  }
  nodes.forEach(walk);
  return texts.join(' ').trim();
}
