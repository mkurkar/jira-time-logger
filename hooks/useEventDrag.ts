'use client';

import { useRef, useCallback, useEffect } from 'react';
import { startOfDay, addMinutes, differenceInMinutes } from 'date-fns';
import type { CalendarEvent, CalendarSettings, DayEvent, InteractionMode } from '@/types/calendar';
import { DRAG_THRESHOLD } from '@/lib/calendar-constants';

interface UseEventDragProps {
  dayColumnRefs: React.RefObject<Map<string, HTMLDivElement>>;
  visibleDays: Date[];
  settings: CalendarSettings;
  pixelsToMinutes: (px: number) => number;
  snapToNearestGrid: (min: number) => number;
  minutesToTop: (min: number) => number;
  minutesToPixels: (min: number) => number;
  setOptimisticOverride: (id: string, patch: Partial<CalendarEvent>) => void;
  clearOptimisticOverride: (id: string) => void;
  onDragEnd?: (eventId: string, newStart: Date, newEnd: Date) => void;
  onClick?: (eventId: string) => void;
  enabled?: boolean;
}

interface UseEventDragReturn {
  handleEventPointerDown: (e: React.PointerEvent, dayEvent: DayEvent) => void;
  isDragging: boolean;
  dragEventId: string | null;
  interactionMode: InteractionMode;
}

interface DragState {
  eventId: string;
  /** Duration of the event in minutes (preserved during drag) */
  durationMinutes: number;
  /** Initial pointer Y in viewport coords */
  initialPointerY: number;
  /** Initial pointer X in viewport coords */
  initialPointerX: number;
  /** Whether we've passed the 5px threshold */
  activated: boolean;
  /** Current day the pointer is over */
  currentDay: Date;
}

function formatDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function useEventDrag({
  dayColumnRefs,
  visibleDays,
  settings,
  pixelsToMinutes,
  snapToNearestGrid,
  setOptimisticOverride,
  clearOptimisticOverride,
  onDragEnd,
  onClick,
  enabled = true,
}: UseEventDragProps): UseEventDragReturn {
  const dragRef = useRef<DragState | null>(null);
  const lastComputedRef = useRef<{ start: Date; end: Date } | null>(null);
  // Reactive state — updated only on activation/deactivation
  const isDraggingRef = useRef(false);
  const dragEventIdRef = useRef<string | null>(null);
  // Stable refs for callbacks that read latest props
  const propsRef = useRef({
    pixelsToMinutes,
    snapToNearestGrid,
    setOptimisticOverride,
    clearOptimisticOverride,
    onDragEnd,
    onClick,
    settings,
    dayColumnRefs,
    visibleDays,
  });
  propsRef.current = {
    pixelsToMinutes,
    snapToNearestGrid,
    setOptimisticOverride,
    clearOptimisticOverride,
    onDragEnd,
    onClick,
    settings,
    dayColumnRefs,
    visibleDays,
  };

  /**
   * Given pointer viewport X, find which day column the pointer is over.
   */
  const findDayAtPointer = useCallback(
    (clientX: number): Date | null => {
      const refs = propsRef.current.dayColumnRefs.current;
      if (!refs) return null;

      for (const [key, el] of refs.entries()) {
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
          const day = propsRef.current.visibleDays.find(
            (d) => formatDayKey(d) === key,
          );
          return day ?? null;
        }
      }
      return null;
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const state = dragRef.current;
      if (!state) return;

      const dx = e.clientX - state.initialPointerX;
      const dy = e.clientY - state.initialPointerY;

      if (!state.activated) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
          return;
        }
        state.activated = true;
        isDraggingRef.current = true;
        dragEventIdRef.current = state.eventId;
      }

      const { settings: s, pixelsToMinutes: p2m, snapToNearestGrid: snap, setOptimisticOverride: setOverride } = propsRef.current;

      // Determine target day
      const pointerDay = findDayAtPointer(e.clientX);
      const targetDay = pointerDay ?? state.currentDay;
      state.currentDay = targetDay;

      // Get day column element for Y calculation
      const dayKey = formatDayKey(targetDay);
      const refs = propsRef.current.dayColumnRefs.current;
      const columnEl = refs?.get(dayKey);
      if (!columnEl) return;

      // Compute minutes from pointer Y
      const rect = columnEl.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const rawMinutes = s.startHour * 60 + p2m(offsetY);

      // Snap to nearest grid, centering on event
      const snappedStart = snap(rawMinutes - state.durationMinutes / 2);

      // Clamp within visible range
      const minStart = s.startHour * 60;
      const maxStart = s.endHour * 60 - state.durationMinutes;
      const clampedStart = Math.max(minStart, Math.min(maxStart, snappedStart));

      // Build new dates
      const newStart = addMinutes(startOfDay(targetDay), clampedStart);
      const newEnd = addMinutes(newStart, state.durationMinutes);

      lastComputedRef.current = { start: newStart, end: newEnd };
      setOverride(state.eventId, { start: newStart, end: newEnd });
    },
    [findDayAtPointer],
  );

  const handlePointerUp = useCallback(
    (_e: PointerEvent) => {
      const state = dragRef.current;
      if (!state) return;

      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);

      if (state.activated) {
        const last = lastComputedRef.current;
        propsRef.current.clearOptimisticOverride(state.eventId);
        if (last && propsRef.current.onDragEnd) {
          propsRef.current.onDragEnd(state.eventId, last.start, last.end);
        }
        isDraggingRef.current = false;
        dragEventIdRef.current = null;
      } else {
        // Threshold not reached — treat as click
        propsRef.current.onClick?.(state.eventId);
      }

      dragRef.current = null;
      lastComputedRef.current = null;
    },
    [handlePointerMove],
  );

  const handleEventPointerDown = useCallback(
    (e: React.PointerEvent, dayEvent: DayEvent) => {
      if (!enabled) return;
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const { calendarEvent } = dayEvent;
      const durationMinutes = differenceInMinutes(calendarEvent.end, calendarEvent.start);

      dragRef.current = {
        eventId: calendarEvent.id,
        durationMinutes,
        initialPointerY: e.clientY,
        initialPointerX: e.clientX,
        activated: false,
        currentDay: dayEvent.day,
      };

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
      dragRef.current = null;
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    handleEventPointerDown,
    isDragging: isDraggingRef.current,
    dragEventId: dragEventIdRef.current,
    interactionMode: isDraggingRef.current ? 'dragging' : 'idle',
  };
}
