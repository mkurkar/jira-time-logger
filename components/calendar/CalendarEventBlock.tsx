'use client';

import React from 'react';
import { format } from 'date-fns';
import type { DayEvent } from '@/types/calendar';

interface CalendarEventBlockProps {
  dayEvent: DayEvent;
  onPointerDown?: (e: React.PointerEvent, dayEvent: DayEvent) => void;
  onResizeStart?: (e: React.PointerEvent, dayEvent: DayEvent, edge: 'top' | 'bottom') => void;
  onContextMenu?: (e: React.MouseEvent, dayEvent: DayEvent) => void;
  isDragging?: boolean;
  isResizing?: boolean;
  multiUserMode?: boolean;
}

/** Extract 2-letter initials from a display name (e.g., "Muhammad Kurkar" → "MK", "AJ" → "AJ") */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function CalendarEventBlock({
  dayEvent,
  onPointerDown,
  onResizeStart,
  onContextMenu,
  isDragging = false,
  isResizing = false,
  multiUserMode = false,
}: CalendarEventBlockProps) {
  const { calendarEvent, height, isClippedStart, isClippedEnd } = dayEvent;
  const isCompact = height < 40; // Less than ~1.5 slots
  const showAuthorBadge = multiUserMode && calendarEvent.authorDisplayName;
  const initials = showAuthorBadge ? getInitials(calendarEvent.authorDisplayName!) : '';

  const handlePointerDown = (e: React.PointerEvent) => {
    // Don't start drag from resize handles
    if ((e.target as HTMLElement).dataset.resize) return;
    onPointerDown?.(e, dayEvent);
  };

  const handleResizeTop = (e: React.PointerEvent) => {
    e.stopPropagation();
    onResizeStart?.(e, dayEvent, 'top');
  };

  const handleResizeBottom = (e: React.PointerEvent) => {
    e.stopPropagation();
    onResizeStart?.(e, dayEvent, 'bottom');
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, dayEvent);
  };

  const timeLabel = `${format(calendarEvent.start, 'HH:mm')} - ${format(calendarEvent.end, 'HH:mm')}`;

  return (
    <div
      data-event={calendarEvent.id}
      className={`
        absolute select-none overflow-hidden
        border border-white/20 shadow-sm
        transition-shadow duration-150
        ${isDragging ? 'opacity-90 shadow-lg z-50 cursor-grabbing' : 'cursor-grab'}
        ${isResizing ? 'opacity-90 z-50' : ''}
        ${isClippedStart ? 'rounded-t-none border-t-0' : 'rounded-t-md'}
        ${isClippedEnd ? 'rounded-b-none border-b-0' : 'rounded-b-md'}
      `}
      style={{
        top: dayEvent.top,
        height: dayEvent.height,
        left: dayEvent.left,
        width: dayEvent.width,
        backgroundColor: calendarEvent.color,
        minHeight: 20,
      }}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    >
      {/* Top resize handle */}
      {!isClippedStart && (
        <div
          data-resize="top"
          className="absolute top-0 left-0 right-0 h-1.5 cursor-n-resize hover:bg-white/30 z-10"
          onPointerDown={handleResizeTop}
        />
      )}

      {/* Event content */}
      <div className={`px-1.5 text-white text-xs leading-tight ${isCompact ? 'py-0.5' : 'py-1'}`}>
        {isCompact ? (
          <div className="flex items-center gap-1 truncate">
            <span className="font-semibold">{calendarEvent.issueKey}</span>
            {showAuthorBadge && (
              <span
                className="w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: calendarEvent.authorColor || '#6b7280' }}
              >
                {initials}
              </span>
            )}
            <span className="truncate opacity-80">{calendarEvent.issueSummary}</span>
          </div>
        ) : (
          <>
            <div className="font-semibold truncate">{calendarEvent.issueKey}</div>
            <div className="opacity-80 truncate">{timeLabel}</div>
            {height >= 60 && (
              <div className="opacity-70 truncate mt-0.5">{calendarEvent.issueSummary}</div>
            )}
          </>
        )}
      </div>

      {/* Author initials badge (non-compact, top-right) */}
      {showAuthorBadge && !isCompact && (
        <div
          className="absolute top-1 right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: calendarEvent.authorColor || '#6b7280' }}
        >
          {initials}
        </div>
      )}

      {/* Bottom resize handle */}
      {!isClippedEnd && (
        <div
          data-resize="bottom"
          className="absolute bottom-0 left-0 right-0 h-1.5 cursor-s-resize hover:bg-white/30 z-10"
          onPointerDown={handleResizeBottom}
        />
      )}
    </div>
  );
}
