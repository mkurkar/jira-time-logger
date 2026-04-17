'use client';

import React from 'react';
import Button, { IconButton } from '@atlaskit/button/new';
import ChevronLeftIcon from '@atlaskit/icon/core/chevron-left';
import ChevronRightIcon from '@atlaskit/icon/core/chevron-right';
import SettingsIcon from '@atlaskit/icon/core/settings';

export interface CalendarToolbarProps {
  rangeLabel: string;
  viewMode: 'week' | 'day';
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewModeChange: (mode: 'week' | 'day') => void;
  onSettingsClick?: () => void;
  userSelector?: React.ReactNode;
}

export default function CalendarToolbar({
  rangeLabel,
  viewMode,
  onPrev,
  onNext,
  onToday,
  onViewModeChange,
  onSettingsClick,
  userSelector,
}: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2">
        <IconButton
          icon={ChevronLeftIcon}
          label="Previous"
          onClick={onPrev}
          appearance="subtle"
          spacing="compact"
        />
        <Button
          onClick={onToday}
          appearance="subtle"
        >
          Today
        </Button>
        <IconButton
          icon={ChevronRightIcon}
          label="Next"
          onClick={onNext}
          appearance="subtle"
          spacing="compact"
        />
      </div>
      <h2 className="text-sm font-semibold text-gray-800">{rangeLabel}</h2>
      <div className="flex items-center gap-2">
        {userSelector}
        <div className="flex rounded-md overflow-hidden">
          <Button
            onClick={() => onViewModeChange('week')}
            appearance={viewMode === 'week' ? 'primary' : 'default'}
            spacing="compact"
          >
            Week
          </Button>
          <Button
            onClick={() => onViewModeChange('day')}
            appearance={viewMode === 'day' ? 'primary' : 'default'}
            spacing="compact"
          >
            Day
          </Button>
        </div>
        {onSettingsClick && (
          <IconButton
            icon={SettingsIcon}
            label="Settings"
            onClick={onSettingsClick}
            appearance="subtle"
            spacing="compact"
          />
        )}
      </div>
    </div>
  );
}
