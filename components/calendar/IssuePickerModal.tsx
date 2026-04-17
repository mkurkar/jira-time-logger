'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { token } from '@atlaskit/tokens';
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
                  <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider sticky top-0" style={{
                    backgroundColor: token('color.background.warning'),
                    color: token('color.text.warning'),
                    borderBottom: `1px solid ${token('color.border.warning')}`,
                  }}>
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
                  <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider sticky top-0" style={{
                    backgroundColor: token('color.background.neutral'),
                    color: token('color.text.subtlest'),
                    borderBottom: `1px solid ${token('color.border')}`,
                  }}>
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
                <div className="px-4 py-8 text-center text-xs" style={{ color: token('color.text.disabled') }}>
                  {searchTerm.trim() ? 'No matching issues' : 'No issues available'}
                </div>
              )}
            </div>

            {/* Footer: time preview */}
            {startTime && (
              <div className="mt-3 px-4 py-2.5 rounded-md" style={{ backgroundColor: token('color.background.neutral') }}>
                <p className="text-xs" style={{ color: token('color.text.subtlest') }}>
                  Creating: <span className="font-medium" style={{ color: token('color.text') }}>{formatDuration(duration)}</span>{' '}
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
      className="w-full px-4 py-2 text-left transition-colors flex items-start gap-2"
      style={{ borderBottom: `1px solid ${token('color.border')}` }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = token('color.background.neutral.subtle.hovered'); }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <span className="text-xs font-semibold whitespace-nowrap flex-shrink-0" style={{ color: token('color.link') }}>
        {issue.key}
      </span>
      <span className="text-xs truncate" style={{ color: token('color.text.subtle') }}>{issue.fields.summary}</span>
    </button>
  );
}
