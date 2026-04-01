'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  startOfDay,
  endOfDay,
  differenceInMinutes,
  addSeconds,
  format,
  max as dateMax,
  min as dateMin,
} from 'date-fns';
import type { JiraWorklog, JiraIssue } from '@/src/types/jira';
import type { CalendarEvent, DayEvent, CalendarSettings } from '@/types/calendar';
import { getIssueColor, getUserColor, MIN_EVENT_MINUTES } from '@/lib/calendar-constants';

interface UseCalendarEventsProps {
  worklogs: JiraWorklog[];
  issues: JiraIssue[];
  visibleDays: Date[];
  minutesToTop: (minutesFromMidnight: number) => number;
  minutesToPixels: (minutes: number) => number;
  settings: CalendarSettings;
  multiUserMode?: boolean;
}

interface UseCalendarEventsReturn {
  dayEventsMap: Map<string, DayEvent[]>;
  calendarEvents: CalendarEvent[];
  setOptimisticOverride: (id: string, patch: Partial<CalendarEvent>) => void;
  clearOptimisticOverride: (id: string) => void;
  clearAllOverrides: () => void;
}

/** Build an issue lookup map for O(1) access */
function buildIssueMap(issues: JiraIssue[]): Map<string, JiraIssue> {
  const map = new Map<string, JiraIssue>();
  for (const issue of issues) {
    map.set(issue.id, issue);
    map.set(issue.key, issue);
  }
  return map;
}

/** Transform a JiraWorklog into a CalendarEvent */
function worklogToCalendarEvent(
  worklog: JiraWorklog,
  issueMap: Map<string, JiraIssue>,
  multiUserMode: boolean
): CalendarEvent {
  const start = new Date(worklog.started);
  const end = addSeconds(start, worklog.timeSpentSeconds);
  const issue = issueMap.get(worklog.issueId);
  const issueKey = issue?.key ?? `ISSUE-${worklog.issueId}`;

  const authorAccountId = worklog.author?.accountId;
  const authorDisplayName = worklog.author?.displayName;
  const authorColor = authorAccountId ? getUserColor(authorAccountId) : undefined;
  
  return {
    id: worklog.id,
    worklog,
    start,
    end,
    color: multiUserMode && authorColor ? authorColor : getIssueColor(issueKey),
    issueKey,
    issueSummary: issue?.fields?.summary ?? '',
    authorAccountId,
    authorDisplayName,
    authorColor,
  };
}

/** Split a CalendarEvent into per-day DayEvent segments */
function splitEventIntoDays(
  event: CalendarEvent,
  visibleDays: Date[],
  minutesToTop: (m: number) => number,
  minutesToPixels: (m: number) => number,
  settings: CalendarSettings,
): DayEvent[] {
  const results: DayEvent[] = [];
  
  for (const day of visibleDays) {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    // Check if event overlaps this day
    if (event.start >= dayEnd || event.end <= dayStart) continue;
    
    // Clip event to day boundaries
    const segStart = dateMax([event.start, dayStart]);
    const segEnd = dateMin([event.end, dayEnd]);
    
    const startMinutes = differenceInMinutes(segStart, dayStart);
    const endMinutes = differenceInMinutes(segEnd, dayStart);
    const durationMinutes = endMinutes - startMinutes;
    
    // Enforce minimum display height
    const displayMinutes = Math.max(durationMinutes, MIN_EVENT_MINUTES);
    
    // Clamp to visible range
    const visibleStartMin = settings.startHour * 60;
    const visibleEndMin = settings.endHour * 60;
    const clampedStart = Math.max(startMinutes, visibleStartMin);
    const clampedEnd = Math.min(clampedStart + displayMinutes, visibleEndMin);
    
    const top = minutesToTop(clampedStart);
    const height = minutesToPixels(clampedEnd - clampedStart);
    
    if (height <= 0) continue;
    
    results.push({
      id: `${event.id}-${format(day, 'yyyy-MM-dd')}`,
      calendarEvent: event,
      day,
      top,
      height,
      left: '0%',      // Will be set by overlap layout
      width: '100%',    // Will be set by overlap layout  
      isClippedStart: event.start < dayStart,
      isClippedEnd: event.end > dayEnd,
      column: 0,        // Will be set by overlap layout
      totalColumns: 1,  // Will be set by overlap layout
    });
  }
  
  return results;
}

/** 
 * Greedy column assignment for overlapping events.
 * Groups events that transitively overlap, then assigns columns left-to-right.
 */
function assignOverlapColumns(events: DayEvent[]): DayEvent[] {
  if (events.length <= 1) return events;
  
  // Sort by top position, then by height (taller first)
  const sorted = [...events].sort((a, b) => a.top - b.top || b.height - a.height);
  
  // Find transitive overlap groups using union-find approach
  const groups: DayEvent[][] = [];
  let currentGroup: DayEvent[] = [sorted[0]];
  let groupMaxBottom = sorted[0].top + sorted[0].height;
  
  for (let i = 1; i < sorted.length; i++) {
    const event = sorted[i];
    if (event.top < groupMaxBottom) {
      // Overlaps with current group
      currentGroup.push(event);
      groupMaxBottom = Math.max(groupMaxBottom, event.top + event.height);
    } else {
      // Start new group
      groups.push(currentGroup);
      currentGroup = [event];
      groupMaxBottom = event.top + event.height;
    }
  }
  groups.push(currentGroup);
  
  // Assign columns within each group
  const result: DayEvent[] = [];
  for (const group of groups) {
    const columns: DayEvent[][] = [];
    
    for (const event of group) {
      // Find first column where event doesn't overlap
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        if (lastInCol.top + lastInCol.height <= event.top) {
          columns[col].push(event);
          event.column = col;
          placed = true;
          break;
        }
      }
      if (!placed) {
        event.column = columns.length;
        columns.push([event]);
      }
    }
    
    const totalCols = columns.length;
    for (const event of group) {
      event.totalColumns = totalCols;
      const widthPercent = 100 / totalCols;
      event.left = `${event.column * widthPercent}%`;
      event.width = `${widthPercent}%`;
    }
    
    result.push(...group);
  }
  
  return result;
}

export function useCalendarEvents({
  worklogs,
  issues,
  visibleDays,
  minutesToTop,
  minutesToPixels,
  settings,
  multiUserMode = false,
}: UseCalendarEventsProps): UseCalendarEventsReturn {
  const [optimisticOverrides, setOptimisticOverrides] = useState<
    Map<string, Partial<CalendarEvent>>
  >(new Map());

  const issueMap = useMemo(() => buildIssueMap(issues), [issues]);

  // Transform worklogs → CalendarEvents, applying optimistic overrides
  const calendarEvents = useMemo(() => {
    const events = worklogs.map((wl) => worklogToCalendarEvent(wl, issueMap, multiUserMode));
    
    // Apply optimistic overrides
    return events.map((event) => {
      const override = optimisticOverrides.get(event.id);
      if (override) {
        return { ...event, ...override };
      }
      return event;
    });
  }, [worklogs, issueMap, optimisticOverrides, multiUserMode]);

  // Split events into days and compute layout
  const dayEventsMap = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    
    // Initialize empty arrays for all visible days
    for (const day of visibleDays) {
      map.set(format(day, 'yyyy-MM-dd'), []);
    }
    
    // Split each event into day segments
    for (const event of calendarEvents) {
      const dayEvents = splitEventIntoDays(
        event,
        visibleDays,
        minutesToTop,
        minutesToPixels,
        settings,
      );
      for (const de of dayEvents) {
        const key = format(de.day, 'yyyy-MM-dd');
        const existing = map.get(key);
        if (existing) {
          existing.push(de);
        }
      }
    }
    
    // Apply overlap layout for each day
    for (const [key, events] of map) {
      map.set(key, assignOverlapColumns(events));
    }
    
    return map;
  }, [calendarEvents, visibleDays, minutesToTop, minutesToPixels, settings]);

  const setOptimisticOverride = useCallback(
    (id: string, patch: Partial<CalendarEvent>) => {
      setOptimisticOverrides((prev) => {
        const next = new Map(prev);
        next.set(id, { ...prev.get(id), ...patch });
        return next;
      });
    },
    []
  );

  const clearOptimisticOverride = useCallback((id: string) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearAllOverrides = useCallback(() => {
    setOptimisticOverrides(new Map());
  }, []);

  return {
    dayEventsMap,
    calendarEvents,
    setOptimisticOverride,
    clearOptimisticOverride,
    clearAllOverrides,
  };
}
