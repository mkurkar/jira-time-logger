'use client';

import { useState, useCallback, useEffect } from 'react';
import { formatDateISO } from '@/lib/date-utils';
import { formatHours } from '@/lib/worklog-aggregator';
import { adfToText } from '@/lib/adf-helpers';
import type { JiraWorklog, JiraIssue } from '@/src/types/jira';

interface HistoricalLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  savedIssueKeys: string[];
}

interface WorklogEntry {
  issueKey: string;
  worklog: JiraWorklog;
}

export default function HistoricalLogViewer({ isOpen, onClose, savedIssueKeys }: HistoricalLogViewerProps) {
  const today = formatDateISO(new Date());
  const thirtyDaysAgo = formatDateISO(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [worklogs, setWorklogs] = useState<WorklogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorklogs = useCallback(async (issueKeysOverride?: string[]) => {
    const keysToUse = issueKeysOverride || savedIssueKeys;

    setIsLoading(true);
    setError(null);

    try {
      // If no keys provided, try fetching user's issues from Jira
      let issueKeys = keysToUse.length > 0 ? keysToUse : [];

      if (issueKeys.length === 0) {
        const issuesRes = await fetch('/api/my-issues');
        if (issuesRes.ok) {
          const data = await issuesRes.json();
          issueKeys = (data.issues || []).map((i: JiraIssue) => i.key);
        }
      }

      if (issueKeys.length === 0) {
        setWorklogs([]);
        setIsLoading(false);
        return;
      }

      const res = await fetch(
        `/api/worklogs?issueKeys=${issueKeys.join(',')}&startDate=${startDate}&endDate=${endDate}`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${res.status})`);
      }

      const data = await res.json();
      const entries: WorklogEntry[] = [];

      for (const [issueKey, wls] of Object.entries(data.worklogs as Record<string, JiraWorklog[]>)) {
        for (const wl of wls) {
          entries.push({ issueKey, worklog: wl });
        }
      }

      // Sort by date descending
      entries.sort((a, b) => new Date(b.worklog.started).getTime() - new Date(a.worklog.started).getTime());
      setWorklogs(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setWorklogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [savedIssueKeys, startDate, endDate]);

  // Auto-fetch worklogs when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetchWorklogs();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const totalHours = worklogs.reduce((sum, e) => sum + e.worklog.timeSpentSeconds, 0) / 3600;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Historical Work Logs</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>

        {/* Date range controls */}
        <div className="flex items-center gap-4 px-6 py-3 border-b bg-gray-50">
          <label className="text-sm text-gray-600">
            From:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="ml-2 px-3 py-1.5 border rounded text-sm"
            />
          </label>
          <label className="text-sm text-gray-600">
            To:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="ml-2 px-3 py-1.5 border rounded text-sm"
            />
          </label>
          <button
            onClick={() => fetchWorklogs()}
            disabled={isLoading}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
          {worklogs.length > 0 && (
            <span className="ml-auto text-sm text-gray-500">
              {worklogs.length} entries &middot; {formatHours(Math.round(totalHours * 10) / 10)} total
            </span>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {worklogs.length === 0 && !isLoading && !error && (
            <p className="text-center text-gray-500 py-8">
              No worklogs found for the selected date range. Try adjusting the dates and clicking &quot;Search&quot;.
            </p>
          )}

          {worklogs.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="pb-2 font-semibold">Issue</th>
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Time</th>
                  <th className="pb-2 font-semibold">Author</th>
                  <th className="pb-2 font-semibold">Comment</th>
                </tr>
              </thead>
              <tbody>
                {worklogs.map((entry) => (
                  <tr key={`${entry.issueKey}-${entry.worklog.id}`} className="border-b border-gray-100">
                    <td className="py-2 text-blue-600 font-medium">{entry.issueKey}</td>
                    <td className="py-2 text-gray-700">
                      {new Date(entry.worklog.started).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-gray-900 font-medium">{entry.worklog.timeSpent}</td>
                    <td className="py-2 text-gray-600">{entry.worklog.author.displayName}</td>
                    <td className="py-2 text-gray-500 truncate max-w-[200px]">
                      {entry.worklog.comment ? adfToText(entry.worklog.comment) : '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
