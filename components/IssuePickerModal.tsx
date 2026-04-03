'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { JiraIssue } from '@/src/types/jira';

interface IssuePickerModalProps {
  issues: JiraIssue[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (issueKey: string) => void;
  recentIssueKeys?: string[];
  /** Duration in seconds */
  duration: number;
  startTime: Date | null;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function formatStartTime(date: Date): string {
  const dayStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dayStr} at ${timeStr}`;
}

export default function IssuePickerModal({
  issues,
  isOpen,
  onClose,
  onSelect,
  recentIssueKeys = [],
  duration,
  startTime,
}: IssuePickerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      // Focus input after a tick to let the modal render
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Escape key closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter issues by search term
  const filteredIssues = useMemo(() => {
    if (!searchTerm.trim()) return issues;
    const lower = searchTerm.toLowerCase();
    return issues.filter(
      (i) =>
        i.key.toLowerCase().includes(lower) ||
        i.fields.summary.toLowerCase().includes(lower)
    );
  }, [issues, searchTerm]);

  // Separate recently used from the rest
  const recentIssues = useMemo(() => {
    const recentSet = new Set(recentIssueKeys);
    return filteredIssues.filter((i) => recentSet.has(i.key));
  }, [filteredIssues, recentIssueKeys]);

  const otherIssues = useMemo(() => {
    const recentSet = new Set(recentIssueKeys);
    return filteredIssues.filter((i) => !recentSet.has(i.key));
  }, [filteredIssues, recentIssueKeys]);

  const handleSelect = useCallback(
    (issueKey: string) => {
      onSelect(issueKey);
    },
    [onSelect]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Select Issue</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search issues..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>
        </div>

        {/* Issue list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Recently used section */}
          {recentIssues.length > 0 && (
            <>
              <div className="px-4 py-1.5 bg-amber-50/80 text-[10px] font-semibold text-amber-700 uppercase tracking-wider border-b border-amber-100 sticky top-0">
                Recently Used
              </div>
              {recentIssues.map((issue) => (
                <IssueRow
                  key={`recent-${issue.key}`}
                  issue={issue}
                  onClick={handleSelect}
                />
              ))}
            </>
          )}

          {/* All issues section */}
          {otherIssues.length > 0 && (
            <>
              <div className="px-4 py-1.5 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 sticky top-0">
                All Issues
              </div>
              {otherIssues.map((issue) => (
                <IssueRow
                  key={issue.key}
                  issue={issue}
                  onClick={handleSelect}
                />
              ))}
            </>
          )}

          {/* Empty state */}
          {filteredIssues.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-gray-400">
              {searchTerm.trim() ? 'No matching issues' : 'No issues available'}
            </div>
          )}
        </div>

        {/* Footer: time preview */}
        {startTime && (
          <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500">
              Creating: <span className="font-medium text-gray-700">{formatDuration(duration)}</span>{' '}
              on {formatStartTime(startTime)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Individual issue row inside the picker */
function IssueRow({
  issue,
  onClick,
}: {
  issue: JiraIssue;
  onClick: (key: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(issue.key)}
      className="w-full px-4 py-2 text-left border-b border-gray-100 hover:bg-blue-50 transition-colors flex items-start gap-2"
    >
      <span className="text-xs font-semibold text-blue-600 whitespace-nowrap flex-shrink-0">
        {issue.key}
      </span>
      <span className="text-xs text-gray-600 truncate">{issue.fields.summary}</span>
    </button>
  );
}
