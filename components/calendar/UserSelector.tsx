'use client';

import React, { useState, useRef, useEffect } from 'react';
import Button from '@atlaskit/button/new';
import PeopleGroupIcon from '@atlaskit/icon/core/people-group';
import ChevronDownIcon from '@atlaskit/icon/core/chevron-down';
import CheckMarkIcon from '@atlaskit/icon/core/check-mark';
import type { TeamMember } from '@/hooks/useTeamMembers';

export interface UserSelectorProps {
  teamMembers: TeamMember[];
  selectedAccountIds: Set<string>;
  isLoading: boolean;
  onToggleUser: (accountId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function UserSelector({
  teamMembers,
  selectedAccountIds,
  isLoading,
  onToggleUser,
  onSelectAll,
  onDeselectAll,
}: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedCount = selectedAccountIds.size;
  const label = isLoading
    ? 'Loading...'
    : `${selectedCount} user${selectedCount !== 1 ? 's' : ''}`;

  return (
    <div ref={containerRef} className="relative">
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        isDisabled={isLoading}
        iconBefore={PeopleGroupIcon}
        iconAfter={ChevronDownIcon}
        appearance="default"
        spacing="compact"
      >
        {label}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header with Select All / Deselect All */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Team Members
            </span>
            <div className="flex gap-1">
              <button
                onClick={onSelectAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                All
              </button>
              <span className="text-xs text-gray-300">|</span>
              <button
                onClick={onDeselectAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                None
              </button>
            </div>
          </div>

          {/* Member list */}
          <div className="max-h-60 overflow-y-auto py-1">
            {teamMembers.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">
                No team members found
              </div>
            )}
            {teamMembers.map((member) => {
              const isChecked = selectedAccountIds.has(member.accountId);
              return (
                <button
                  key={member.accountId}
                  onClick={() => onToggleUser(member.accountId)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-50 text-left"
                >
                  {/* Color indicator */}
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  />
                  {/* Display name */}
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {member.displayName}
                  </span>
                  {/* Checkbox */}
                  <span
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                      isChecked
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isChecked && (
                      <CheckMarkIcon label="" size="small" color="currentColor" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
