'use client';

import { useState, useCallback, useEffect } from 'react';
import Button, { IconButton } from '@atlaskit/button/new';
import CrossIcon from '@atlaskit/icon/core/cross';
import Textfield from '@atlaskit/textfield';
import Spinner from '@atlaskit/spinner';
import Modal, { ModalBody, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
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

  const totalHours = worklogs.reduce((sum, e) => sum + e.worklog.timeSpentSeconds, 0) / 3600;

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={onClose} width="x-large">
          <ModalHeader>
            <ModalTitle>Historical Work Logs</ModalTitle>
            <IconButton
              icon={CrossIcon}
              label="Close"
              onClick={onClose}
              appearance="subtle"
            />
          </ModalHeader>
          <ModalBody>
            {/* Date range controls */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-md">
              <label className="text-sm text-gray-600 flex items-center gap-2">
                From:
                <Textfield
                  type="date"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                  isCompact
                />
              </label>
              <label className="text-sm text-gray-600 flex items-center gap-2">
                To:
                <Textfield
                  type="date"
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                  isCompact
                />
              </label>
              <Button
                onClick={() => fetchWorklogs()}
                isDisabled={isLoading}
                isLoading={isLoading}
                appearance="primary"
              >
                Search
              </Button>
              {worklogs.length > 0 && (
                <span className="ml-auto text-sm text-gray-500">
                  {worklogs.length} entries &middot; {formatHours(Math.round(totalHours * 10) / 10)} total
                </span>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Spinner size="large" />
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
          </ModalBody>
        </Modal>
      )}
    </ModalTransition>
  );
}
