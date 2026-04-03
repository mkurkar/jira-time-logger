'use client';

import { useRef, useCallback, useEffect } from 'react';
import { startOfDay, addMinutes } from 'date-fns';
import type { CalendarEvent, CalendarSettings, DayEvent, InteractionMode } from '@/types/calendar';
import { MIN_EVENT_MINUTES } from '@/lib/calendar-constants';

interface UseEventResizeProps {
  settings: CalendarSettings;
  pixelsToMinutes: (px: number) => number;
  snapStartToGrid: (min: number) => number;
  snapEndToGrid: (min: number) => number;
  minutesToTop: (min: number) => number;
  minutesToPixels: (min: number) => number;
  setOptimisticOverride: (id: string, patch: Partial<CalendarEvent>) => void;
  clearOptimisticOverride: (id: string) => void;
  onResizeEnd?: (eventId: string, newStart: Date, newEnd: Date) => void;
  enabled?: boolean;
}

interface UseEventResizeReturn {
  handleResizeStart: (e: React.PointerEvent, dayEvent: DayEvent, edge: 'top' | 'bottom') => void;
  isResizing: boolean;
  resizeEventId: string | null;
  interactionMode: InteractionMode;
}

interface ResizeState {
  eventId: string;
  edge: 'top' | 'bottom';
  day: Date;
  /** Initial pointer Y in viewport coords */
  initialPointerY: number;
  /** Event's original start in minutes-from-midnight */
  initialStartMinutes: number;
  /** Event's original end in minutes-from-midnight */
  initialEndMinutes: number;
}

export function useEventResize({
  settings,
  pixelsToMinutes,
  snapStartToGrid,
  snapEndToGrid,
  setOptimisticOverride,
  clearOptimisticOverride,
  onResizeEnd,
  enabled = true,
}: UseEventResizeProps): UseEventResizeReturn {
  const resizeRef = useRef<ResizeState | null>(null);
  const lastComputedRef = useRef<{ start: Date; end: Date } | null>(null);
  const isResizingRef = useRef(false);
  const resizeEventIdRef = useRef<string | null>(null);

  // Stable ref for latest props
  const propsRef = useRef({
    settings,
    pixelsToMinutes,
    snapStartToGrid,
    snapEndToGrid,
    setOptimisticOverride,
    clearOptimisticOverride,
    onResizeEnd,
  });
  propsRef.current = {
    settings,
    pixelsToMinutes,
    snapStartToGrid,
    snapEndToGrid,
    setOptimisticOverride,
    clearOptimisticOverride,
    onResizeEnd,
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const state = resizeRef.current;
    if (!state) return;

    const { settings: s, pixelsToMinutes: p2m, snapStartToGrid: snapStart, snapEndToGrid: snapEnd, setOptimisticOverride: setOverride } = propsRef.current;

    const deltaY = e.clientY - state.initialPointerY;
    const deltaMinutes = p2m(deltaY);

    let newStartMinutes = state.initialStartMinutes;
    let newEndMinutes = state.initialEndMinutes;

    if (state.edge === 'top') {
      // Dragging the top edge changes the start time
      const rawStart = state.initialStartMinutes + deltaMinutes;
      newStartMinutes = snapStart(rawStart);
      // Enforce minimum duration
      if (newEndMinutes - newStartMinutes < MIN_EVENT_MINUTES) {
        newStartMinutes = newEndMinutes - MIN_EVENT_MINUTES;
      }
      // Clamp to visible range
      newStartMinutes = Math.max(s.startHour * 60, newStartMinutes);
    } else {
      // Dragging the bottom edge changes the end time
      const rawEnd = state.initialEndMinutes + deltaMinutes;
      newEndMinutes = snapEnd(rawEnd);
      // Enforce minimum duration
      if (newEndMinutes - newStartMinutes < MIN_EVENT_MINUTES) {
        newEndMinutes = newStartMinutes + MIN_EVENT_MINUTES;
      }
      // Clamp to visible range
      newEndMinutes = Math.min(s.endHour * 60, newEndMinutes);
    }

    // Build new dates
    const newStart = addMinutes(startOfDay(state.day), newStartMinutes);
    const newEnd = addMinutes(startOfDay(state.day), newEndMinutes);

    lastComputedRef.current = { start: newStart, end: newEnd };
    setOverride(state.eventId, { start: newStart, end: newEnd });
  }, []);

  const handlePointerUp = useCallback((_e: PointerEvent) => {
    const state = resizeRef.current;
    if (!state) return;

    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);

    const last = lastComputedRef.current;
    propsRef.current.clearOptimisticOverride(state.eventId);

    if (last && propsRef.current.onResizeEnd) {
      propsRef.current.onResizeEnd(state.eventId, last.start, last.end);
    }

    isResizingRef.current = false;
    resizeEventIdRef.current = null;
    resizeRef.current = null;
    lastComputedRef.current = null;
  }, [handlePointerMove]);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, dayEvent: DayEvent, edge: 'top' | 'bottom') => {
      if (!enabled) return;
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const { calendarEvent, day } = dayEvent;
      const startMinutes =
        calendarEvent.start.getHours() * 60 + calendarEvent.start.getMinutes();
      const endMinutes =
        calendarEvent.end.getHours() * 60 + calendarEvent.end.getMinutes();

      resizeRef.current = {
        eventId: calendarEvent.id,
        edge,
        day,
        initialPointerY: e.clientY,
        initialStartMinutes: startMinutes,
        initialEndMinutes: endMinutes,
      };

      isResizingRef.current = true;
      resizeEventIdRef.current = calendarEvent.id;

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    },
    [enabled, handlePointerMove, handlePointerUp],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      resizeRef.current = null;
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    handleResizeStart,
    isResizing: isResizingRef.current,
    resizeEventId: resizeEventIdRef.current,
    interactionMode: isResizingRef.current ? 'resizing' : 'idle',
  };
}
