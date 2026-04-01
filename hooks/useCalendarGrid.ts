'use client';

import { useMemo, useCallback } from 'react';
import type { CalendarSlot, CalendarSettings } from '@/types/calendar';
import { SLOT_HEIGHT, DEFAULT_SETTINGS } from '@/lib/calendar-constants';

interface UseCalendarGridReturn {
  slots: CalendarSlot[];
  totalHeight: number;
  minutesToPixels: (minutes: number) => number;
  pixelsToMinutes: (pixels: number) => number;
  minutesToTop: (minutesFromMidnight: number) => number;
  snapStartToGrid: (minutes: number) => number;   // floor snap
  snapEndToGrid: (minutes: number) => number;      // ceil snap
  snapToNearestGrid: (minutes: number) => number;  // round snap
  settings: CalendarSettings;
}

export function useCalendarGrid(
  settingsOverride?: Partial<CalendarSettings>
): UseCalendarGridReturn {
  const settings: CalendarSettings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...settingsOverride }),
    [settingsOverride]  // Note: object identity — caller should memoize
  );

  // Generate time slots from startHour to endHour
  const slots = useMemo(() => {
    const result: CalendarSlot[] = [];
    const startMinutes = settings.startHour * 60;
    const endMinutes = settings.endHour * 60;
    
    for (let m = startMinutes; m < endMinutes; m += settings.slotMinutes) {
      const hours = Math.floor(m / 60);
      const mins = m % 60;
      result.push({
        time: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
        minutesFromMidnight: m,
        isHourMark: mins === 0,
        top: ((m - startMinutes) / settings.slotMinutes) * SLOT_HEIGHT,
      });
    }
    return result;
  }, [settings.startHour, settings.endHour, settings.slotMinutes]);

  // Total grid height in pixels
  const totalHeight = useMemo(() => {
    const totalMinutes = (settings.endHour - settings.startHour) * 60;
    return (totalMinutes / settings.slotMinutes) * SLOT_HEIGHT;
  }, [settings.startHour, settings.endHour, settings.slotMinutes]);

  // Convert duration in minutes to pixel height
  const minutesToPixels = useCallback(
    (minutes: number): number => {
      return (minutes / settings.slotMinutes) * SLOT_HEIGHT;
    },
    [settings.slotMinutes]
  );

  // Convert pixel offset to minutes duration
  const pixelsToMinutes = useCallback(
    (pixels: number): number => {
      return (pixels / SLOT_HEIGHT) * settings.slotMinutes;
    },
    [settings.slotMinutes]
  );

  // Convert absolute minutes-from-midnight to pixel top position (relative to grid start)
  const minutesToTop = useCallback(
    (minutesFromMidnight: number): number => {
      const offsetMinutes = minutesFromMidnight - settings.startHour * 60;
      return (offsetMinutes / settings.slotMinutes) * SLOT_HEIGHT;
    },
    [settings.startHour, settings.slotMinutes]
  );

  // Snap to grid: floor (for drag start / event start)
  const snapStartToGrid = useCallback(
    (minutes: number): number => {
      return Math.floor(minutes / settings.snapMinutes) * settings.snapMinutes;
    },
    [settings.snapMinutes]
  );

  // Snap to grid: ceil (for drag end / event end)
  const snapEndToGrid = useCallback(
    (minutes: number): number => {
      return Math.ceil(minutes / settings.snapMinutes) * settings.snapMinutes;
    },
    [settings.snapMinutes]
  );

  // Snap to grid: nearest (for move/drag position)
  const snapToNearestGrid = useCallback(
    (minutes: number): number => {
      return Math.round(minutes / settings.snapMinutes) * settings.snapMinutes;
    },
    [settings.snapMinutes]
  );

  return {
    slots,
    totalHeight,
    minutesToPixels,
    pixelsToMinutes,
    minutesToTop,
    snapStartToGrid,
    snapEndToGrid,
    snapToNearestGrid,
    settings,
  };
}
