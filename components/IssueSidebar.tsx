'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { JiraIssue } from '@/src/types/jira';
import IssueSidebarItem from './IssueSidebarItem';

interface IssueSidebarProps {
  issues: JiraIssue[];
  recentIssueKeys: string[];
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function IssueSidebar({
  issues,
  recentIssueKeys,
  isCollapsed,
  onToggleCollapsed,
}: IssueSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input (300ms)
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Filter issues by search term
  const filteredIssues = useMemo(() => {
    if (!debouncedSearch.trim()) return issues;
    const lower = debouncedSearch.toLowerCase();
    return issues.filter(
      (i) =>
        i.key.toLowerCase().includes(lower) ||
        i.fields.summary.toLowerCase().includes(lower)
    );
  }, [issues, debouncedSearch]);

  // Separate recently used from the rest
  const recentIssues = useMemo(() => {
    const recentSet = new Set(recentIssueKeys);
    return filteredIssues.filter((i) => recentSet.has(i.key));
  }, [filteredIssues, recentIssueKeys]);

  const otherIssues = useMemo(() => {
    const recentSet = new Set(recentIssueKeys);
    return filteredIssues.filter((i) => !recentSet.has(i.key));
  }, [filteredIssues, recentIssueKeys]);

  if (isCollapsed) {
    return (
      <div className="flex-shrink-0 w-8 border-l border-gray-200 bg-gray-50 flex flex-col items-center pt-2">
        <button
          onClick={onToggleCollapsed}
          className="p-1 rounded hover:bg-gray-200 text-gray-500"
          title="Expand issue sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="mt-4 -rotate-90 whitespace-nowrap text-[10px] text-gray-400 font-medium tracking-wider uppercase">
          Issues
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-64 border-l border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Issues</span>
        <button
          onClick={onToggleCollapsed}
          className="p-1 rounded hover:bg-gray-200 text-gray-500"
          title="Collapse sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Search input */}
      <div className="px-3 py-2 border-b border-gray-100">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search issues..."
          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
        />
      </div>

      {/* Scrollable issue list */}
      <div className="flex-1 overflow-y-auto">
        {/* Recently used section */}
        {recentIssues.length > 0 && (
          <>
            <div className="px-3 py-1.5 bg-amber-50/80 text-[10px] font-semibold text-amber-700 uppercase tracking-wider border-b border-amber-100">
              Recently Used
            </div>
            {recentIssues.map((issue) => (
              <IssueSidebarItem key={`recent-${issue.key}`} issue={issue} isRecentlyUsed />
            ))}
          </>
        )}

        {/* All issues section */}
        {otherIssues.length > 0 && (
          <>
            {recentIssues.length > 0 && (
              <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                All Issues
              </div>
            )}
            {otherIssues.map((issue) => (
              <IssueSidebarItem key={issue.key} issue={issue} />
            ))}
          </>
        )}

        {/* Empty state */}
        {filteredIssues.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-gray-400">
            {debouncedSearch.trim() ? 'No matching issues' : 'No issues loaded'}
          </div>
        )}
      </div>

      {/* Footer with drag hint */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
        <p className="text-[10px] text-gray-400 text-center">
          Drag an issue onto the calendar to log time
        </p>
      </div>
    </div>
  );
}
