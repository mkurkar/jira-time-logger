'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import type { CalendarSettings, SlotSelection, InteractionMode } from '@/types/calendar';

interface UseSlotSelectionProps {
  dayColumnRefs: React.RefObject<Map<string, HTMLDivElement>>;
  visibleDays: Date[];
  settings: CalendarSettings;
  pixelsToMinutes: (px: number) => number;
  snapStartToGrid: (min: number) => number;
  snapEndToGrid: (min: number) => number;
  minutesToTop: (min: number) => number;
  minutesToPixels: (min: number) => number;
  onSelectionComplete?: (day: Date, startMinutes: number, endMinutes: number) => void;
  enabled?: boolean;
}

interface UseSlotSelectionReturn {
  handleSlotPointerDown: (e: React.PointerEvent, day: Date) => void;
  selection: SlotSelection | null;
  selectionPixels: { day: Date; startTop: number; height: number } | null;
  isSelecting: boolean;
  clearSelection: () => void;
  interactionMode: InteractionMode;
}

interface SelectionState {
  day: Date;
  /** Pointer Y at start, in viewport coords */
  initialPointerY: number;
  /** The Y offset within the day column at start */
  initialOffsetY: number;
  /** Reference to the day column element for Y calculations */
  columnEl: HTMLDivElement;
}

function formatDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function useSlotSelection({
  dayColumnRefs,
  visibleDays,
  settings,
  pixelsToMinutes,
  snapStartToGrid,
  snapEndToGrid,
  minutesToTop,
  minutesToPixels,
  onSelectionComplete,
  enabled = true,
}: UseSlotSelectionProps): UseSlotSelectionReturn {
  const selectionStateRef = useRef<SelectionState | null>(null);
  const [selection, setSelection] = useState<SlotSelection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Stable ref for latest props
  const propsRef = useRef({
    settings,
    pixelsToMinutes,
    snapStartToGrid,
    snapEndToGrid,
    minutesToTop,
    minutesToPixels,
    onSelectionComplete,
  });
  propsRef.current = {
    settings,
    pixelsToMinutes,
    snapStartToGrid,
    snapEndToGrid,
    minutesToTop,
    minutesToPixels,
    onSelectionComplete,
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const state = selectionStateRef.current;
    if (!state) return;

    const { settings: s, pixelsToMinutes: p2m, snapStartToGrid: snapStart, snapEndToGrid: snapEnd } = propsRef.current;

    const rect = state.columnEl.getBoundingClientRect();
    const currentOffsetY = e.clientY - rect.top;

    // Convert both Y positions to minutes-from-midnight
    const minutesA = s.startHour * 60 + p2m(state.initialOffsetY);
    const minutesB = s.startHour * 60 + p2m(currentOffsetY);

    // Determine start and end, handling upward drag
    let startMinutes: number;
    let endMinutes: number;
    if (minutesA <= minutesB) {
      startMinutes = snapStart(minutesA);
      endMinutes = snapEnd(minutesB);
    } else {
      startMinutes = snapStart(minutesB);
      endMinutes = snapEnd(minutesA);
    }

    // Clamp to visible range
    startMinutes = Math.max(s.startHour * 60, startMinutes);
    endMinutes = Math.min(s.endHour * 60, endMinutes);

    if (endMinutes <= startMinutes) return;

    setSelection({
      day: state.day,
      startMinutes,
      endMinutes,
    });
  }, []);

  const handlePointerUp = useCallback((_e: PointerEvent) => {
    const state = selectionStateRef.current;
    if (!state) return;

    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);

    setIsSelecting(false);
    selectionStateRef.current = null;

    // Read the final selection and notify
    setSelection((current) => {
      if (current && current.endMinutes > current.startMinutes) {
        propsRef.current.onSelectionComplete?.(
          current.day,
          current.startMinutes,
          current.endMinutes,
        );
      }
      return current;
    });
  }, [handlePointerMove]);

  const handleSlotPointerDown = useCallback(
    (e: React.PointerEvent, day: Date) => {
      if (!enabled) return;
      if (e.button !== 0) return;

      // Don't start selection if clicking on an event
      const target = e.target as HTMLElement;
      if (target.closest('[data-event]')) return;

      e.preventDefault();

      const dayKey = formatDayKey(day);
      const refs = dayColumnRefs.current;
      const columnEl = refs?.get(dayKey);
      if (!columnEl) return;

      const rect = columnEl.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;

      const { settings: s, pixelsToMinutes: p2m, snapStartToGrid: snapStart, snapEndToGrid: snapEnd } = propsRef.current;

      // Compute initial snapped position
      const rawMinutes = s.startHour * 60 + p2m(offsetY);
      const startMinutes = snapStart(rawMinutes);
      const endMinutes = snapEnd(rawMinutes);

      selectionStateRef.current = {
        day,
        initialPointerY: e.clientY,
        initialOffsetY: offsetY,
        columnEl,
      };

      setIsSelecting(true);
      setSelection({
        day,
        startMinutes,
        endMinutes: Math.max(endMinutes, startMinutes + s.snapMinutes),
      });

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    },
    [enabled, dayColumnRefs, handlePointerMove, handlePointerUp],
  );

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsSelecting(false);
    selectionStateRef.current = null;
  }, []);

  // Compute pixel coordinates for the selection overlay
  const selectionPixels = selection
    ? (() => {
        const { minutesToTop: m2t, minutesToPixels: m2p } = propsRef.current;
        const startTop = m2t(selection.startMinutes);
        const height = m2p(selection.endMinutes - selection.startMinutes);
        return { day: selection.day, startTop, height };
      })()
    : null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      selectionStateRef.current = null;
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    handleSlotPointerDown,
    selection,
    selectionPixels,
    isSelecting,
    clearSelection,
    interactionMode: isSelecting ? 'selecting' : 'idle',
  };
}
