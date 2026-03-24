import type { JiraIssue, JiraWorklog } from '@/src/types/jira';
import type { GridData, GridRow, GridCell, WeekRange } from '@/types/timesheet';
import { isSameCalendarDay } from '@/lib/date-utils';

/**
 * Aggregate raw worklogs into a grid data structure.
 * For each issue, creates 7 cells (Mon-Sun) with summed hours.
 */
export function aggregateWorklogs(
  issues: JiraIssue[],
  worklogsByIssue: Record<string, JiraWorklog[]>,
  weekRange: WeekRange,
): GridData {
  const rows: GridRow[] = issues.map((issue) => {
    const worklogs = worklogsByIssue[issue.key] || [];

    // Create 7 cells, one per day
    const cells: GridCell[] = weekRange.dates.map((date) => {
      // Find worklogs for this day
      const dayWorklogs = worklogs.filter((wl) =>
        isSameCalendarDay(new Date(wl.started), date),
      );
      const totalSeconds = dayWorklogs.reduce(
        (sum, wl) => sum + wl.timeSpentSeconds,
        0,
      );

      return {
        issueKey: issue.key,
        date,
        totalSeconds,
        hours: Math.round((totalSeconds / 3600) * 10) / 10, // Round to 1 decimal
        worklogs: dayWorklogs,
      };
    });

    const totalSeconds = cells.reduce(
      (sum, cell) => sum + cell.totalSeconds,
      0,
    );

    return {
      issue,
      cells,
      totalSeconds,
      totalHours: Math.round((totalSeconds / 3600) * 10) / 10,
    };
  });

  // Calculate column totals (7 values, one per day)
  const columnTotals = weekRange.dates.map((_, dayIndex) => {
    const totalSeconds = rows.reduce(
      (sum, row) => sum + row.cells[dayIndex].totalSeconds,
      0,
    );
    return Math.round((totalSeconds / 3600) * 10) / 10;
  });

  const grandTotal =
    Math.round(
      (rows.reduce((sum, row) => sum + row.totalSeconds, 0) / 3600) * 10,
    ) / 10;

  return { weekRange, rows, columnTotals, grandTotal };
}

/**
 * Format hours for display.
 * 0 → "—", positive → "Xh" or "X.Yh"
 */
export function formatHours(hours: number): string {
  if (hours === 0) return '—';
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours}h`;
}
