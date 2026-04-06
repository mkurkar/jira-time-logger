'use client';

import React, { useState, useRef, useEffect } from 'react';
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
    ? 'Loading…'
    : `${selectedCount} user${selectedCount !== 1 ? 's' : ''}`;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded hover:bg-gray-200 text-gray-700 border border-gray-300 bg-white disabled:opacity-50"
      >
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
        {label}
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

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
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
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
