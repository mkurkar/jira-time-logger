import type { IssueSelection } from '@/types/timesheet';

const STORAGE_KEY = 'jira-timesheet-issues';

/** Load saved issue selections from localStorage */
export function loadSavedIssues(): IssueSelection[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as IssueSelection[];
  } catch {
    return [];
  }
}

/** Save issue selections to localStorage */
export function saveIssues(issues: IssueSelection[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  } catch {
    console.error('Failed to save issues to localStorage');
  }
}

/** Add an issue to the saved list (no duplicates) */
export function addSavedIssue(
  issueKey: string,
  summary: string,
): IssueSelection[] {
  const existing = loadSavedIssues();
  if (existing.some((s) => s.issueKey === issueKey)) return existing;
  const updated = [
    ...existing,
    { issueKey, summary, addedAt: new Date().toISOString() },
  ];
  saveIssues(updated);
  return updated;
}

/** Remove an issue from the saved list */
export function removeSavedIssue(issueKey: string): IssueSelection[] {
  const existing = loadSavedIssues();
  const updated = existing.filter((s) => s.issueKey !== issueKey);
  saveIssues(updated);
  return updated;
}
