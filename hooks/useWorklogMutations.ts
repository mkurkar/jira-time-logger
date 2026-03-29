'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { GridCell, CellMutationState } from '@/types/timesheet';
import { formatDateISO } from '@/lib/date-utils';

interface UseWorklogMutationsReturn {
  cellStates: Map<string, CellMutationState>;
  saveCell: (cell: GridCell, newHours: number) => Promise<void>;
  deleteCell: (cell: GridCell) => Promise<void>;
  getCellState: (issueKey: string, date: Date) => CellMutationState;
}

function cellKey(issueKey: string, date: Date | string): string {
  const d = typeof date === 'string' ? date : formatDateISO(date);
  return `${issueKey}:${d}`;
}

export function useWorklogMutations(): UseWorklogMutationsReturn {
  const queryClient = useQueryClient();
  const [cellStates, setCellStates] = useState<Map<string, CellMutationState>>(new Map());

  const setCellStatus = useCallback(
    (issueKey: string, date: string, status: CellMutationState['status'], error?: string) => {
      setCellStates((prev) => {
        const next = new Map(prev);
        next.set(cellKey(issueKey, date), { issueKey, date, status, error });
        return next;
      });
    },
    [],
  );

  const invalidateWorklogs = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['worklogs'] });
  }, [queryClient]);

  const saveCell = useCallback(
    async (cell: GridCell, newHours: number) => {
      const dateStr = formatDateISO(cell.date);
      const newSeconds = Math.round(newHours * 3600);

      // No change — skip
      if (newSeconds === cell.totalSeconds) return;

      setCellStatus(cell.issueKey, dateStr, 'saving');

      try {
        if (cell.worklogs.length > 0 && newSeconds > 0) {
          // UPDATE existing worklog (use the first one)
          const wl = cell.worklogs[0];
          await fetch('/api/worklogs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              issueKey: cell.issueKey,
              worklogId: wl.id,
              timeSpentSeconds: newSeconds,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || `Failed (${res.status})`);
            }
          });
        } else if (cell.worklogs.length > 0 && newSeconds === 0) {
          // DELETE — user cleared the cell
          const wl = cell.worklogs[0];
          await fetch(`/api/worklogs?issueKey=${encodeURIComponent(cell.issueKey)}&worklogId=${encodeURIComponent(wl.id)}`, {
            method: 'DELETE',
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || `Failed (${res.status})`);
            }
          });
        } else if (newSeconds > 0) {
          // CREATE new worklog
          const started = `${dateStr}T09:00:00.000+0000`;
          await fetch('/api/worklogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              issueKey: cell.issueKey,
              timeSpentSeconds: newSeconds,
              started,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || `Failed (${res.status})`);
            }
          });
        }

        setCellStatus(cell.issueKey, dateStr, 'idle');
        invalidateWorklogs(); // React Query handles refetch
      } catch (err) {
        const msg = (err as Error).message;
        let userMessage = msg;
        if (msg.includes('No permission')) {
          userMessage = 'No permission to log time on this issue';
        } else if (msg.includes('Rate limited')) {
          userMessage = 'Rate limited by Jira — please wait and try again';
        } else if (msg.includes('not found')) {
          userMessage = 'Issue or worklog not found';
        }
        setCellStatus(cell.issueKey, dateStr, 'error', userMessage);
      }
    },
    [invalidateWorklogs, setCellStatus],
  );

  const deleteCell = useCallback(
    async (cell: GridCell) => {
      if (cell.worklogs.length === 0) return;
      const dateStr = formatDateISO(cell.date);
      setCellStatus(cell.issueKey, dateStr, 'saving');

      try {
        for (const wl of cell.worklogs) {
          const res = await fetch(
            `/api/worklogs?issueKey=${encodeURIComponent(cell.issueKey)}&worklogId=${encodeURIComponent(wl.id)}`,
            { method: 'DELETE' },
          );
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Delete failed (${res.status})`);
          }
        }

        setCellStatus(cell.issueKey, dateStr, 'idle');
        invalidateWorklogs();
      } catch (err) {
        const msg = (err as Error).message;
        let userMessage = msg;
        if (msg.includes('No permission')) {
          userMessage = 'No permission to log time on this issue';
        } else if (msg.includes('Rate limited')) {
          userMessage = 'Rate limited by Jira — please wait and try again';
        } else if (msg.includes('not found')) {
          userMessage = 'Issue or worklog not found';
        }
        setCellStatus(cell.issueKey, dateStr, 'error', userMessage);
      }
    },
    [invalidateWorklogs, setCellStatus],
  );

  const getCellState = useCallback(
    (issueKey: string, date: Date): CellMutationState => {
      const key = cellKey(issueKey, date);
      return cellStates.get(key) ?? { issueKey, date: formatDateISO(date), status: 'idle' };
    },
    [cellStates],
  );

  return { cellStates, saveCell, deleteCell, getCellState };
}

/** Check if a worklog already exists for an issue on a given date */
export async function checkExistingWorklogs(issueKey: string, date: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/worklogs?issueKeys=${encodeURIComponent(issueKey)}&startDate=${date}&endDate=${date}`,
    );
    if (!res.ok) return false;
    const data = await res.json();
    const worklogs = data.worklogs?.[issueKey] ?? [];
    return worklogs.length > 0;
  } catch {
    return false;
  }
}
