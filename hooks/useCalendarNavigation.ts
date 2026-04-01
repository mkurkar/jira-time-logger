'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  startOfDay,
  addDays,
  format,
  isToday,
} from 'date-fns';

export type CalendarViewMode = 'week' | 'day';

interface UseCalendarNavigationReturn {
  currentDate: Date;
  viewMode: CalendarViewMode;
  visibleDays: Date[];
  rangeStart: Date;
  rangeEnd: Date;
  rangeLabel: string;
  goToPrev: () => void;
  goToNext: () => void;
  goToToday: () => void;
  setViewMode: (mode: CalendarViewMode) => void;
  setCurrentDate: (date: Date) => void;
  isTodayVisible: boolean;
}

export function useCalendarNavigation(
  initialDate?: Date,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1  // Default Monday
): UseCalendarNavigationReturn {
  const [currentDate, setCurrentDate] = useState<Date>(
    () => startOfDay(initialDate ?? new Date())
  );
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');

  const visibleDays = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate];
    }
    const weekStart = startOfWeek(currentDate, { weekStartsOn });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate, viewMode, weekStartsOn]);

  const rangeStart = useMemo(() => visibleDays[0], [visibleDays]);
  const rangeEnd = useMemo(() => visibleDays[visibleDays.length - 1], [visibleDays]);

  const rangeLabel = useMemo(() => {
    if (viewMode === 'day') {
      return format(currentDate, 'EEEE, MMM d, yyyy');
    }
    const start = visibleDays[0];
    const end = visibleDays[visibleDays.length - 1];
    // Same month: "Apr 7 - 13, 2026"
    if (format(start, 'MMM yyyy') === format(end, 'MMM yyyy')) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
    }
    // Different month: "Mar 31 - Apr 6, 2026"
    if (format(start, 'yyyy') === format(end, 'yyyy')) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    // Different year (edge case)
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  }, [currentDate, viewMode, visibleDays]);

  const goToPrev = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === 'week' ? subWeeks(prev, 1) : addDays(prev, -1)
    );
  }, [viewMode]);

  const goToNext = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === 'week' ? addWeeks(prev, 1) : addDays(prev, 1)
    );
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(startOfDay(new Date()));
  }, []);

  const isTodayVisible = useMemo(
    () => visibleDays.some((d) => isToday(d)),
    [visibleDays]
  );

  return {
    currentDate,
    viewMode,
    visibleDays,
    rangeStart,
    rangeEnd,
    rangeLabel,
    goToPrev,
    goToNext,
    goToToday,
    setViewMode,
    setCurrentDate,
    isTodayVisible,
  };
}
