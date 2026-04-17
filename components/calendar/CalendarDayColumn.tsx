'use client';

import React, { useRef } from 'react';
import { token } from '@atlaskit/tokens';
import { format, isToday } from 'date-fns';
import type { DayEvent, CalendarSlot } from '@/types/calendar';
import CalendarEventBlock from './CalendarEventBlock';

interface CalendarDayColumnProps {
  day: Date;
  events: DayEvent[];
  slots: CalendarSlot[];
  totalHeight: number;
  onEventPointerDown?: (e: React.PointerEvent, dayEvent: DayEvent) => void;
  onResizeStart?: (e: React.PointerEvent, dayEvent: DayEvent, edge: 'top' | 'bottom') => void;
  onSlotPointerDown?: (e: React.PointerEvent, day: Date) => void;
  onContextMenu?: (e: React.MouseEvent, dayEvent: DayEvent) => void;
  selection?: { startTop: number; height: number } | null;
  nowIndicatorTop?: number | null;
  dragEventId?: string | null;
  resizeEventId?: string | null;
  registerRef?: (day: Date, el: HTMLDivElement | null) => void;
  multiUserMode?: boolean;
}

export default function CalendarDayColumn({
  day,
  events,
  slots,
  totalHeight,
  onEventPointerDown,
  onResizeStart,
  onSlotPointerDown,
  onContextMenu,
  selection,
  nowIndicatorTop,
  dragEventId,
  resizeEventId,
  registerRef,
  multiUserMode,
}: CalendarDayColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const today = isToday(day);

  const handleRef = (el: HTMLDivElement | null) => {
    (columnRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    registerRef?.(day, el);
  };

  const handleSlotPointerDown = (e: React.PointerEvent) => {
    // Only trigger on empty area (not on events)
    if ((e.target as HTMLElement).closest('[data-event]')) return;
    onSlotPointerDown?.(e, day);
  };

  return (
    <div className="flex flex-col min-w-0">
      {/* Day header */}
      <div
        className="sticky top-0 z-20 text-center py-2 text-sm font-medium"
        style={{
          borderBottom: `1px solid ${token('color.border')}`,
          backgroundColor: token('elevation.surface'),
          color: today ? token('color.link') : token('color.text'),
        }}
      >
        <div className="text-xs" style={{ color: token('color.text.disabled') }}>{format(day, 'EEE')}</div>
        <div
          className={`
            inline-flex items-center justify-center w-7 h-7 rounded-full
          `}
          style={today ? { backgroundColor: token('color.background.brand.bold'), color: '#fff' } : undefined}
        >
          {format(day, 'd')}
        </div>
      </div>

      {/* Grid area */}
      <div
        ref={handleRef}
        className="relative flex-1"
        style={{ height: totalHeight, borderRight: `1px solid ${token('color.border')}` }}
        onPointerDown={handleSlotPointerDown}
      >
        {/* Slot grid lines */}
        {slots.map((slot) => (
          <div
            key={slot.time}
            className="absolute left-0 right-0"
            style={{
              top: slot.top,
              borderTop: `1px solid ${slot.isHourMark ? token('color.border') : token('color.border')}`,
              opacity: slot.isHourMark ? 1 : 0.5,
            }}
          />
        ))}

        {/* Events */}
        {events.map((dayEvent) => (
          <CalendarEventBlock
            key={dayEvent.id}
            dayEvent={dayEvent}
            onPointerDown={onEventPointerDown}
            onResizeStart={onResizeStart}
            onContextMenu={onContextMenu}
            isDragging={dragEventId === dayEvent.calendarEvent.id}
            isResizing={resizeEventId === dayEvent.calendarEvent.id}
            multiUserMode={multiUserMode}
          />
        ))}

        {/* Selection overlay (drag-to-create) */}
        {selection && (
          <div
            className="absolute left-1 right-1 rounded pointer-events-none z-40"
            style={{
              top: selection.startTop,
              height: selection.height,
              backgroundColor: token('color.background.selected'),
              border: `2px solid ${token('color.border.focused')}`,
            }}
          />
        )}

        {/* Now indicator */}
        {nowIndicatorTop != null && (
          <div
            className="absolute left-0 right-0 z-30 pointer-events-none"
            style={{ top: nowIndicatorTop }}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full -ml-1" style={{ backgroundColor: token('color.background.danger.bold') }} />
              <div className="flex-1 h-px" style={{ backgroundColor: token('color.background.danger.bold') }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
