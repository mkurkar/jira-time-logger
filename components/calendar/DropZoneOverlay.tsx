'use client';

import React from 'react';
import { token } from '@atlaskit/tokens';

/**
 * Represents a drop target location on the calendar grid.
 * TODO: Import from @/hooks/useIssueDragDrop once that hook is created.
 */
export interface DropTarget {
  day: Date;
  startMinutes: number;
  top: number;
  height: number;
  issueKey?: string;
  issueSummary?: string;
}

interface DropZoneOverlayProps {
  dropTarget: DropTarget;
  durationMinutes?: number;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function DropZoneOverlay({
  dropTarget,
  durationMinutes = 60,
}: DropZoneOverlayProps) {
  const startTime = formatMinutes(dropTarget.startMinutes);
  const endTime = formatMinutes(dropTarget.startMinutes + durationMinutes);

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none rounded-md border-2 border-dashed transition-all duration-75 flex items-center justify-center"
      style={{
        top: dropTarget.top,
        height: dropTarget.height,
        borderColor: token('color.border.focused'),
        backgroundColor: token('color.background.selected'),
      }}
    >
      <div className="text-xs text-center" style={{ color: token('color.text.selected') }}>
        {dropTarget.issueKey && (
          <span className="font-bold">{dropTarget.issueKey}</span>
        )}
        <span className={dropTarget.issueKey ? ' ml-1' : ''}>
          {startTime} &ndash; {endTime}
        </span>
      </div>
    </div>
  );
}
