'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { IconButton } from '@atlaskit/button/new';
import CrossIcon from '@atlaskit/icon/core/cross';
import SearchIcon from '@atlaskit/icon/core/search';
import Textfield from '@atlaskit/textfield';
import Modal, { ModalBody, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
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

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={onClose} width="medium">
          <ModalHeader>
            <ModalTitle>Select Issue</ModalTitle>
            <IconButton
              icon={CrossIcon}
              label="Close"
              onClick={onClose}
              appearance="subtle"
              spacing="compact"
            />
          </ModalHeader>
          <ModalBody>
            {/* Search */}
            <div className="mb-3">
              <Textfield
                ref={inputRef}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                placeholder="Search issues..."
                elemBeforeInput={
                  <span className="pl-2">
                    <SearchIcon label="" size="small" />
                  </span>
                }
              />
            </div>

            {/* Issue list */}
            <div className="max-h-[50vh] overflow-y-auto -mx-1">
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
              <div className="mt-3 px-4 py-2.5 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500">
                  Creating: <span className="font-medium text-gray-700">{formatDuration(duration)}</span>{' '}
                  on {formatStartTime(startTime)}
                </p>
              </div>
            )}
          </ModalBody>
        </Modal>
      )}
    </ModalTransition>
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
