'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import WeekNavigator from '@/components/WeekNavigator';
import TimesheetRow from '@/components/TimesheetRow';
import GrandTotal from '@/components/GrandTotal';
import IssueSearch from '@/components/IssueSearch';
import BulkEntryModal from '@/components/BulkEntryModal';
import HistoricalLogViewer from '@/components/HistoricalLogViewer';
import { getWeekRange, shiftWeek, formatDateISO, getDayLabel } from '@/lib/date-utils';
import { aggregateWorklogs } from '@/lib/worklog-aggregator';
import { loadSavedIssues, addSavedIssue, removeSavedIssue } from '@/lib/issue-storage';
import { useWorklogMutations } from '@/hooks/useWorklogMutations';
import type { WeekRange, IssueSelection } from '@/types/timesheet';
import type { JiraIssue, JiraWorklog } from '@/src/types/jira';

interface WeeklyGridProps {
  projectKey?: string;
}

export default function WeeklyGrid({ projectKey }: WeeklyGridProps) {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState<Date>(() => new Date());
  const [weekRange, setWeekRange] = useState<WeekRange>(() => getWeekRange(new Date()));
  const [savedIssues, setSavedIssues] = useState<IssueSelection[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showBulkEntry, setShowBulkEntry] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Load saved issues from localStorage AND auto-fetch user's issues on mount
  useEffect(() => {
    const stored = loadSavedIssues();
    setSavedIssues(stored);

    // Auto-fetch user's recent/assigned issues from Jira
    (async () => {
      try {
        let res: Response;
        if (projectKey) {
          const jql = `project = "${projectKey}" ORDER BY updated DESC`;
          res = await fetch(`/api/issues?jql=${encodeURIComponent(jql)}&maxResults=50`);
        } else {
          res = await fetch('/api/my-issues');
        }
        if (!res.ok) return;
        const data = await res.json();
        const autoIssues: JiraIssue[] = data.issues || [];

        // Merge auto-loaded issues with saved ones (dedup by key)
        const existingKeys = new Set(stored.map((s) => s.issueKey));
        const newIssues = autoIssues.filter((issue) => !existingKeys.has(issue.key));

        if (newIssues.length > 0) {
          const merged = [...stored];
          for (const issue of newIssues) {
            merged.push({
              issueKey: issue.key,
              summary: issue.fields.summary,
              addedAt: new Date().toISOString(),
            });
          }
          setSavedIssues(merged);
          // Don't persist auto-loaded issues to localStorage — they refresh from Jira each time
        }
      } catch (err) {
        console.error('Auto-load issues failed:', err);
      }
    })();
  }, [projectKey]);

  // Update week range when weekStart changes
  useEffect(() => {
    setWeekRange(getWeekRange(weekStart));
  }, [weekStart]);

  // Stable sorted issue keys for query key identity
  const issueKeys = savedIssues.map((s) => s.issueKey);
  const sortedIssueKeys = useMemo(() => [...issueKeys].sort(), [issueKeys.join(',')]);

  const startDate = formatDateISO(weekRange.start);
  const endDate = formatDateISO(weekRange.end);

  // Fetch issue details via React Query
  const { data: issuesData } = useQuery({
    queryKey: ['weekly-issues', sortedIssueKeys],
    queryFn: async () => {
      if (issueKeys.length === 0) return [];
      const jql = `key in (${issueKeys.join(',')}) ORDER BY key ASC`;
      const res = await fetch(`/api/issues?jql=${encodeURIComponent(jql)}&maxResults=50`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch issues (${res.status})`);
      }
      const data = await res.json();
      return (data.issues || []) as JiraIssue[];
    },
    enabled: issueKeys.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes — issues don't change often
  });

  // Fetch worklogs via React Query (uses 'worklogs' prefix so useWorklogMutations invalidation matches)
  const { data: worklogsData, isLoading: isLoadingWorklogs, error: worklogsError } = useQuery({
    queryKey: ['worklogs', 'weekly', sortedIssueKeys, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/worklogs?issueKeys=${issueKeys.join(',')}&startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch worklogs (${res.status})`);
      }
      const data = await res.json();
      return data.worklogs as Record<string, JiraWorklog[]>;
    },
    enabled: issueKeys.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Derive grid data from fetched issues + worklogs
  const gridData = useMemo(() => {
    if (!issuesData || !worklogsData) return null;
    return aggregateWorklogs(issuesData, worklogsData, weekRange);
  }, [issuesData, worklogsData, weekRange]);

  // Worklog mutations hook (no arguments — invalidation via React Query)
  const { saveCell, getCellState } = useWorklogMutations();

  // Toast management
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Week navigation handlers
  const handlePrevWeek = () => setWeekStart((prev) => shiftWeek(prev, -1));
  const handleNextWeek = () => setWeekStart((prev) => shiftWeek(prev, 1));
  const handleToday = () => setWeekStart(new Date());

  // Issue management handlers
  const handleAddIssue = (issue: JiraIssue) => {
    const updated = addSavedIssue(issue.key, issue.fields.summary);
    setSavedIssues(updated);
  };

  const handleRemoveIssue = (issueKey: string) => {
    const updated = removeSavedIssue(issueKey);
    setSavedIssues(updated);
  };

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Week navigation */}
      <WeekNavigator
        weekRange={weekRange}
        onPrevious={handlePrevWeek}
        onNext={handleNextWeek}
        onToday={handleToday}
      />

      {/* Issue search */}
      <IssueSearch
        onAddIssue={handleAddIssue}
        existingKeys={savedIssues.map((s) => s.issueKey)}
        projectKey={projectKey}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setShowBulkEntry(true)}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Bulk Entry
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          View History
        </button>
      </div>

      {/* Error state */}
      {worklogsError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {worklogsError.message}
        </div>
      )}

      {/* Loading state */}
      {isLoadingWorklogs && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-500">Loading timesheet data...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoadingWorklogs && !worklogsError && savedIssues.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No issues added yet</p>
          <p className="text-sm">Search for Jira issues above to start tracking your time.</p>
        </div>
      )}

      {/* Grid table */}
      {!isLoadingWorklogs && gridData && gridData.rows.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[220px]">
                  Issue
                </th>
                {weekRange.dates.map((date, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px]"
                  >
                    {getDayLabel(date)}
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-200 min-w-[80px]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {gridData.rows.map((row) => (
                <TimesheetRow
                  key={row.issue.key}
                  row={row}
                  onRemove={handleRemoveIssue}
                  onSaveCell={saveCell}
                  getCellState={getCellState}
                />
              ))}
            </tbody>
            <tfoot>
              <GrandTotal
                columnTotals={gridData.columnTotals}
                grandTotal={gridData.grandTotal}
              />
            </tfoot>
          </table>
        </div>
      )}

      {/* Modals */}
      <BulkEntryModal
        isOpen={showBulkEntry}
        onClose={() => setShowBulkEntry(false)}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['worklogs'] });
          setShowBulkEntry(false);
        }}
      />
      <HistoricalLogViewer
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        savedIssueKeys={savedIssues.map((s) => s.issueKey)}
      />
    </div>
  );
}
