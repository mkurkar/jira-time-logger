'use client';

import { useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';
import type { CalendarSettings } from '@/types/calendar';

export interface DropTarget {
  day: Date;
  startMinutes: number;
  top: number;
  height: number;
  issueKey: string;
  issueSummary: string;
}

interface UseIssueDragDropProps {
  dayColumnRefs: React.RefObject<Map<string, HTMLDivElement>>;
  visibleDays: Date[];
  settings: CalendarSettings;
  pixelsToMinutes: (px: number) => number;
  snapStartToGrid: (min: number) => number;
  minutesToTop: (min: number) => number;
  minutesToPixels: (min: number) => number;
  defaultDurationMinutes?: number;
  onDrop?: (issueKey: string, issueSummary: string, day: Date, startMinutes: number, durationMinutes: number) => void;
}

interface UseIssueDragDropReturn {
  isDraggingOver: boolean;
  dropTarget: DropTarget | null;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

function formatDayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function useIssueDragDrop({
  dayColumnRefs,
  visibleDays,
  settings,
  pixelsToMinutes,
  snapStartToGrid,
  minutesToTop,
  minutesToPixels,
  defaultDurationMinutes = 60,
  onDrop,
}: UseIssueDragDropProps): UseIssueDragDropReturn {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const dragCounterRef = useRef(0);

  // Stable ref for latest props to avoid stale closures
  const propsRef = useRef({
    settings, pixelsToMinutes, snapStartToGrid, minutesToTop, minutesToPixels, defaultDurationMinutes, onDrop,
  });
  propsRef.current = {
    settings, pixelsToMinutes, snapStartToGrid, minutesToTop, minutesToPixels, defaultDurationMinutes, onDrop,
  };

  const computeDropTarget = useCallback((e: React.DragEvent): DropTarget | null => {
    const refs = dayColumnRefs.current;
    if (!refs) return null;

    const { settings: s, pixelsToMinutes: p2m, snapStartToGrid: snap, minutesToTop: m2t, minutesToPixels: m2p, defaultDurationMinutes: dur } = propsRef.current;

    // Find which day column the pointer is over
    for (const day of visibleDays) {
      const key = formatDayKey(day);
      const col = refs.get(key);
      if (!col) continue;
      const rect = col.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right) {
        const offsetY = e.clientY - rect.top;
        const rawMinutes = s.startHour * 60 + p2m(offsetY);
        const startMinutes = snap(rawMinutes);
        const clampedStart = Math.max(s.startHour * 60, Math.min(s.endHour * 60 - dur, startMinutes));

        // Try to parse issue data from dataTransfer (may not be available during dragover in some browsers)
        let issueKey = '';
        let issueSummary = '';
        try {
          const data = e.dataTransfer.getData('application/json');
          if (data) {
            const parsed = JSON.parse(data);
            issueKey = parsed.issueKey || '';
            issueSummary = parsed.issueSummary || '';
          }
        } catch {
          // getData may not work during dragover — that's fine
        }

        return {
          day,
          startMinutes: clampedStart,
          top: m2t(clampedStart),
          height: m2p(dur),
          issueKey,
          issueSummary,
        };
      }
    }
    return null;
  }, [dayColumnRefs, visibleDays]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Check if this is an issue drag (has application/json type)
    if (!e.dataTransfer.types.includes('application/json')) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const target = computeDropTarget(e);
    setDropTarget(target);
    setIsDraggingOver(true);
  }, [computeDropTarget]);

  const handleDragLeave = useCallback((_e: React.DragEvent) => {
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
      setDropTarget(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);
    setDropTarget(null);

    // Parse issue data
    let issueKey = '';
    let issueSummary = '';
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const parsed = JSON.parse(data);
        issueKey = parsed.issueKey || '';
        issueSummary = parsed.issueSummary || '';
      }
    } catch {
      return; // Invalid data
    }

    if (!issueKey) return;

    // Compute drop position
    const refs = dayColumnRefs.current;
    if (!refs) return;
    const { settings: s, pixelsToMinutes: p2m, snapStartToGrid: snap, defaultDurationMinutes: dur, onDrop: cb } = propsRef.current;

    for (const day of visibleDays) {
      const key = formatDayKey(day);
      const col = refs.get(key);
      if (!col) continue;
      const rect = col.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right) {
        const offsetY = e.clientY - rect.top;
        const rawMinutes = s.startHour * 60 + p2m(offsetY);
        const startMinutes = snap(rawMinutes);
        const clampedStart = Math.max(s.startHour * 60, Math.min(s.endHour * 60 - dur, startMinutes));
        cb?.(issueKey, issueSummary, day, clampedStart, dur);
        return;
      }
    }
  }, [dayColumnRefs, visibleDays]);

  return {
    isDraggingOver,
    dropTarget,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
