'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { token } from '@atlaskit/tokens';
import { IconButton } from '@atlaskit/button/new';
import ChevronLeftIcon from '@atlaskit/icon/core/chevron-left';
import ChevronRightIcon from '@atlaskit/icon/core/chevron-right';
import Textfield from '@atlaskit/textfield';
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
      <div className="flex-shrink-0 w-8 flex flex-col items-center pt-2" style={{
        borderLeft: `1px solid ${token('color.border')}`,
        backgroundColor: token('color.background.neutral'),
      }}>
        <IconButton
          icon={ChevronLeftIcon}
          label="Expand issue sidebar"
          onClick={onToggleCollapsed}
          appearance="subtle"
          spacing="compact"
        />
        <div className="mt-4 -rotate-90 whitespace-nowrap text-[10px] font-medium tracking-wider uppercase" style={{ color: token('color.text.disabled') }}>
          Issues
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-64 flex flex-col" style={{
      borderLeft: `1px solid ${token('color.border')}`,
      backgroundColor: token('elevation.surface'),
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{
        borderBottom: `1px solid ${token('color.border')}`,
        backgroundColor: token('color.background.neutral'),
      }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: token('color.text') }}>Issues</span>
        <IconButton
          icon={ChevronRightIcon}
          label="Collapse sidebar"
          onClick={onToggleCollapsed}
          appearance="subtle"
          spacing="compact"
        />
      </div>

      {/* Search input */}
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${token('color.border')}` }}>
        <Textfield
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search issues..."
          isCompact
        />
      </div>

      {/* Scrollable issue list */}
      <div className="flex-1 overflow-y-auto">
        {/* Recently used section */}
        {recentIssues.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{
              backgroundColor: token('color.background.warning'),
              color: token('color.text.warning'),
              borderBottom: `1px solid ${token('color.border.warning')}`,
            }}>
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
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{
                backgroundColor: token('color.background.neutral'),
                color: token('color.text.subtlest'),
                borderBottom: `1px solid ${token('color.border')}`,
              }}>
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
          <div className="px-3 py-8 text-center text-xs" style={{ color: token('color.text.disabled') }}>
            {debouncedSearch.trim() ? 'No matching issues' : 'No issues loaded'}
          </div>
        )}
      </div>

      {/* Footer with drag hint */}
      <div className="px-3 py-2" style={{
        borderTop: `1px solid ${token('color.border')}`,
        backgroundColor: token('color.background.neutral'),
      }}>
        <p className="text-[10px] text-center" style={{ color: token('color.text.disabled') }}>
          Drag an issue onto the calendar to log time
        </p>
      </div>
    </div>
  );
}
