import type { JiraIssue, JiraWorklog } from '@/src/types/jira';

/** Range of dates for a week (Monday through Sunday) */
export interface WeekRange {
  start: Date;    // Monday
  end: Date;      // Sunday
  dates: Date[];  // Array of 7 dates [Mon, Tue, ..., Sun]
}

/** Single cell in the grid: hours for one issue on one day */
export interface GridCell {
  issueKey: string;
  date: Date;
  totalSeconds: number;
  hours: number;          // totalSeconds / 3600, rounded to 1 decimal
  worklogs: JiraWorklog[];
}

/** Single row: one issue across all 7 days */
export interface GridRow {
  issue: JiraIssue;
  cells: GridCell[];      // Always 7 elements (Mon-Sun)
  totalSeconds: number;   // Sum of all cells
  totalHours: number;
}

/** Complete grid data structure */
export interface GridData {
  weekRange: WeekRange;
  rows: GridRow[];
  columnTotals: number[];  // 7 numbers (total hours per day)
  grandTotal: number;      // Sum of all hours
}

/** Issue selection for localStorage persistence */
export interface IssueSelection {
  issueKey: string;
  summary: string;
  addedAt: string;         // ISO timestamp
}

/** Mutation state for a single cell */
export interface CellMutationState {
  issueKey: string;
  date: string; // ISO date string
  status: 'idle' | 'saving' | 'error';
  error?: string;
}

/** Worklog mutation request (client to API route) */
export interface WorklogMutationRequest {
  action: 'create' | 'update' | 'delete';
  issueKey: string;
  worklogId?: string; // Required for update/delete
  timeSpentSeconds?: number; // Required for create/update
  started?: string; // ISO datetime, required for create
  comment?: string;
}
