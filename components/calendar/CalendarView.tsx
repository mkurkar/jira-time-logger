'use client';

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, differenceInMinutes, startOfDay, parseISO, addDays } from 'date-fns';
import type { JiraWorklog, JiraIssue } from '@/src/types/jira';
import type { CalendarSettings, CalendarEvent } from '@/types/calendar';
import { TIME_AXIS_WIDTH, DEFAULT_SETTINGS } from '@/lib/calendar-constants';
import { useCalendarGrid } from '@/hooks/useCalendarGrid';
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useEventDrag } from '@/hooks/useEventDrag';
import { useEventResize } from '@/hooks/useEventResize';
import { useSlotSelection } from '@/hooks/useSlotSelection';
import { useContextMenu } from '@/hooks/useContextMenu';
import { useCalendarKeyboard } from '@/hooks/useCalendarKeyboard';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useMultiUserWorklogs } from '@/hooks/useMultiUserWorklogs';
import CalendarDayColumn from './CalendarDayColumn';
import CalendarToolbar from './CalendarToolbar';
import CalendarSettingsPopover from './CalendarSettingsPopover';
import CalendarContextMenu from './CalendarContextMenu';
import UserSelector from './UserSelector';
import IssueSidebar from './IssueSidebar';
import IssuePickerModal from './IssuePickerModal';
import EditWorklogModal from './EditWorklogModal';
import DropZoneOverlay from './DropZoneOverlay';
import { useIssueDragDrop } from '@/hooks/useIssueDragDrop';

// Helper: format Date to Jira datetime string
function toJiraDatetime(date: Date): string {
  const iso = date.toISOString(); // "2024-01-15T09:00:00.000Z"
  return iso.replace('Z', '+0000');
}

interface CalendarViewProps {
  worklogs?: JiraWorklog[];
  issues: JiraIssue[];
  onCreateWorklog?: (issueKey: string, started: string, timeSpentSeconds: number) => Promise<void>;
  onUpdateWorklog?: (issueKey: string, worklogId: string, started: string, timeSpentSeconds: number) => Promise<void>;
  onDeleteWorklog?: (issueKey: string, worklogId: string) => Promise<void>;
  projectKey?: string;
  multiUserMode?: boolean;
  selectedUsers?: Array<{accountId: string; displayName: string; color: string}>;
}

export default function CalendarView({
  issues,
  onCreateWorklog,
  onUpdateWorklog,
  onDeleteWorklog,
  projectKey,
}: CalendarViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dayColumnRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // T017: Settings state with localStorage persistence
  const [settings, setSettings] = useState<CalendarSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calendar-settings');
      if (saved) {
        try { return JSON.parse(saved); } catch { /* ignore */ }
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [showSettings, setShowSettings] = useState(false);

  // Persist settings to localStorage on change
  useEffect(() => {
    localStorage.setItem('calendar-settings', JSON.stringify(settings));
  }, [settings]);

  // T014: Error toast state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showError = useCallback((msg: string) => {
    setErrorMessage(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
  }, []);

  // T018: Recently used issues (localStorage)
  const [recentIssueKeys, setRecentIssueKeys] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('recent-issue-keys');
        return saved ? JSON.parse(saved) : [];
      } catch { return []; }
    }
    return [];
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Issue picker modal state (for slot selection flow)
  const [issuePickerState, setIssuePickerState] = useState<{
    isOpen: boolean;
    startDate: Date | null;
    timeSpentSeconds: number;
  }>({ isOpen: false, startDate: null, timeSpentSeconds: 0 });

  // Edit worklog modal state
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Helper to add an issue key to recent list
  const addRecentIssue = useCallback((key: string) => {
    setRecentIssueKeys(prev => {
      const filtered = prev.filter(k => k !== key);
      const updated = [key, ...filtered].slice(0, 10);
      localStorage.setItem('recent-issue-keys', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Core hooks
  const grid = useCalendarGrid(settings);
  const nav = useCalendarNavigation();

  // T012: Team members and multi-user worklogs
  const team = useTeamMembers();
  const multiUserMode = team.selectedAccountIds.size > 1;

  // Auto-fetch current user so worklogs always load even without project selection
  const { data: currentUser } = useQuery({
    queryKey: ['myself'],
    queryFn: async () => {
      const res = await fetch('/api/myself');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes — current user rarely changes
  });

  // Auto-select current user when data arrives
  useEffect(() => {
    if (currentUser?.accountId && team.selectedAccountIds.size === 0) {
      team.toggleUser(currentUser.accountId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.accountId]);

  // Fetch team members when projectKey is provided
  useEffect(() => {
    if (projectKey) {
      team.fetchTeamMembers(projectKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectKey]);

  // Derive date range and issue keys for multi-user worklogs
  const dateRange = useMemo(() => {
    if (nav.visibleDays.length === 0) return { startDate: '', endDate: '' };
    const first = nav.visibleDays[0];
    const last = nav.visibleDays[nav.visibleDays.length - 1];
    return {
      startDate: format(first, 'yyyy-MM-dd'),
      endDate: format(addDays(last, 1), 'yyyy-MM-dd'),
    };
  }, [nav.visibleDays]);

  const issueKeys = useMemo(() => issues.map(i => i.key), [issues]);

  const multiUserWorklogs = useMultiUserWorklogs({
    issueKeys,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    accountIds: Array.from(team.selectedAccountIds),
  });

  // Always use multiUserWorklogs — single source of truth for worklog data
  const effectiveWorklogs = multiUserWorklogs.worklogs;

  // Build selectedUsers array for per-user totals
  const selectedUsers = useMemo(() => {
    return team.teamMembers
      .filter(m => team.selectedAccountIds.has(m.accountId))
      .map(m => ({ accountId: m.accountId, displayName: m.displayName, color: m.color }));
  }, [team.teamMembers, team.selectedAccountIds]);

  const events = useCalendarEvents({
    worklogs: effectiveWorklogs,
    issues,
    visibleDays: nav.visibleDays,
    minutesToTop: grid.minutesToTop,
    minutesToPixels: grid.minutesToPixels,
    settings: grid.settings,
    multiUserMode,
  });

  // Register day column DOM elements for cross-day detection
  const registerDayRef = useCallback((day: Date, el: HTMLDivElement | null) => {
    const key = format(day, 'yyyy-MM-dd');
    if (el) {
      dayColumnRefs.current.set(key, el);
    } else {
      dayColumnRefs.current.delete(key);
    }
  }, []);

  // T013a: Handle drag end — update worklog with new start time (duration preserved)
  const handleDragEnd = useCallback(async (eventId: string, newStart: Date, newEnd: Date) => {
    const calEvent = events.calendarEvents.find(e => e.id === eventId);
    if (!calEvent) return;

    const timeSpentSeconds = Math.round((newEnd.getTime() - newStart.getTime()) / 1000);

    try {
      const res = await fetch('/api/worklogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueKey: calEvent.issueKey,
          worklogId: calEvent.id,
          started: toJiraDatetime(newStart),
          timeSpentSeconds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${res.status})`);
      }
      // Success: refetch data
      multiUserWorklogs.refetch();
    } catch (err) {
      showError(`Failed to move worklog: ${(err as Error).message}`);
    }
  }, [events.calendarEvents, showError, multiUserWorklogs]);

  // T013b: Handle resize end — update worklog with new start/duration
  const handleResizeEnd = useCallback(async (eventId: string, newStart: Date, newEnd: Date) => {
    const calEvent = events.calendarEvents.find(e => e.id === eventId);
    if (!calEvent) return;

    const timeSpentSeconds = Math.round((newEnd.getTime() - newStart.getTime()) / 1000);

    try {
      const res = await fetch('/api/worklogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueKey: calEvent.issueKey,
          worklogId: calEvent.id,
          started: toJiraDatetime(newStart),
          timeSpentSeconds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${res.status})`);
      }
      multiUserWorklogs.refetch();
    } catch (err) {
      showError(`Failed to resize worklog: ${(err as Error).message}`);
    }
  }, [events.calendarEvents, showError, multiUserWorklogs]);

  // T013c: Handle slot selection complete — open issue picker modal
  const handleSelectionComplete = useCallback(async (day: Date, startMinutes: number, endMinutes: number) => {
    const timeSpentSeconds = (endMinutes - startMinutes) * 60;
    const startDate = new Date(day);
    startDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

    // Clear selection visual immediately
    slotSelection.clearSelection();

    // Open issue picker modal with the selection data
    setIssuePickerState({
      isOpen: true,
      startDate,
      timeSpentSeconds,
    });
  }, []);

  // Handle issue selected from picker — POST worklog + refresh
  const handleIssueSelected = useCallback(async (issueKey: string) => {
    const { startDate, timeSpentSeconds } = issuePickerState;
    if (!startDate) return;

    // Close modal immediately for responsiveness
    setIssuePickerState({ isOpen: false, startDate: null, timeSpentSeconds: 0 });

    try {
      const res = await fetch('/api/worklogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueKey,
          started: toJiraDatetime(startDate),
          timeSpentSeconds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${res.status})`);
      }
      addRecentIssue(issueKey);
      multiUserWorklogs.refetch();
    } catch (err) {
      showError(`Failed to create worklog: ${(err as Error).message}`);
    }
  }, [issuePickerState, addRecentIssue, showError, multiUserWorklogs]);

  // Event click handler (Phase 4.3: will open edit modal/popover)
  const handleEventClick = useCallback((eventId: string) => {
    console.log('Event clicked:', eventId);
  }, []);

  // T012: Initialize interaction hooks
  const drag = useEventDrag({
    dayColumnRefs: dayColumnRefs,
    visibleDays: nav.visibleDays,
    settings: grid.settings,
    pixelsToMinutes: grid.pixelsToMinutes,
    snapToNearestGrid: grid.snapToNearestGrid,
    minutesToTop: grid.minutesToTop,
    minutesToPixels: grid.minutesToPixels,
    setOptimisticOverride: events.setOptimisticOverride,
    clearOptimisticOverride: events.clearOptimisticOverride,
    onDragEnd: handleDragEnd,
    onClick: handleEventClick,
  });

  const resize = useEventResize({
    settings: grid.settings,
    pixelsToMinutes: grid.pixelsToMinutes,
    snapStartToGrid: grid.snapStartToGrid,
    snapEndToGrid: grid.snapEndToGrid,
    minutesToTop: grid.minutesToTop,
    minutesToPixels: grid.minutesToPixels,
    setOptimisticOverride: events.setOptimisticOverride,
    clearOptimisticOverride: events.clearOptimisticOverride,
    onResizeEnd: handleResizeEnd,
  });

  const slotSelection = useSlotSelection({
    dayColumnRefs: dayColumnRefs,
    visibleDays: nav.visibleDays,
    settings: grid.settings,
    pixelsToMinutes: grid.pixelsToMinutes,
    snapStartToGrid: grid.snapStartToGrid,
    snapEndToGrid: grid.snapEndToGrid,
    minutesToTop: grid.minutesToTop,
    minutesToPixels: grid.minutesToPixels,
    onSelectionComplete: handleSelectionComplete,
  });

  // T016: Context menu hook
  const contextMenu = useContextMenu();

  // T019: Keyboard shortcuts
  useCalendarKeyboard({
    clearSelection: slotSelection.clearSelection,
    closeMenu: contextMenu.closeMenu,
    goToToday: nav.goToToday,
  });

  // T017: Issue drag-to-assign hook
  const issueDragDrop = useIssueDragDrop({
    dayColumnRefs,
    visibleDays: nav.visibleDays,
    settings: grid.settings,
    pixelsToMinutes: grid.pixelsToMinutes,
    snapStartToGrid: grid.snapStartToGrid,
    minutesToTop: grid.minutesToTop,
    minutesToPixels: grid.minutesToPixels,
    defaultDurationMinutes: 60,
    onDrop: async (issueKey, issueSummary, day, startMinutes, durationMinutes) => {
      const startDate = new Date(day);
      startDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
      const timeSpentSeconds = durationMinutes * 60;

      try {
        const res = await fetch('/api/worklogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issueKey,
            started: toJiraDatetime(startDate),
            timeSpentSeconds,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed (${res.status})`);
        }
        addRecentIssue(issueKey);
        multiUserWorklogs.refetch();
      } catch (err) {
        showError(`Failed to log time: ${(err as Error).message}`);
      }
    },
  });

  // T020: Now indicator position — auto-updates every 60 seconds
  const computeNowTop = useCallback(() => {
    const now = new Date();
    const minutesSinceMidnight = differenceInMinutes(now, startOfDay(now));
    const startMin = grid.settings.startHour * 60;
    const endMin = grid.settings.endHour * 60;
    if (minutesSinceMidnight < startMin || minutesSinceMidnight > endMin) return null;
    return grid.minutesToTop(minutesSinceMidnight);
  }, [grid]);

  const [nowIndicatorTop, setNowIndicatorTop] = useState<number | null>(computeNowTop);

  useEffect(() => {
    setNowIndicatorTop(computeNowTop());
    const interval = setInterval(() => {
      setNowIndicatorTop(computeNowTop());
    }, 60000);
    return () => clearInterval(interval);
  }, [computeNowTop]);

  // Scroll to current time on mount
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (!hasScrolledRef.current && scrollContainerRef.current && nowIndicatorTop != null) {
      const scrollTarget = Math.max(0, nowIndicatorTop - 100); // 100px above now
      scrollContainerRef.current.scrollTop = scrollTarget;
      hasScrolledRef.current = true;
    }
  }, [nowIndicatorTop]);

  // T021: Compute daily totals from worklogs
  const dayTotals = React.useMemo(() => {
    const totals = new Map<string, number>();
    for (const day of nav.visibleDays) {
      const dateKey = format(day, 'yyyy-MM-dd');
      totals.set(dateKey, 0);
    }
    for (const wl of effectiveWorklogs) {
      const wlDay = format(parseISO(wl.started), 'yyyy-MM-dd');
      const current = totals.get(wlDay);
      if (current !== undefined) {
        totals.set(wlDay, current + wl.timeSpentSeconds);
      }
    }
    return totals;
  }, [effectiveWorklogs, nav.visibleDays]);

  // T011: Compute per-user daily totals
  const userDayTotals = useMemo(() => {
    const totals = new Map<string, Map<string, number>>();
    for (const wl of effectiveWorklogs) {
      const accountId = wl.author.accountId;
      if (!totals.has(accountId)) {
        totals.set(accountId, new Map<string, number>());
      }
      const userMap = totals.get(accountId)!;
      const wlDay = format(parseISO(wl.started), 'yyyy-MM-dd');
      userMap.set(wlDay, (userMap.get(wlDay) || 0) + wl.timeSpentSeconds);
    }
    return totals;
  }, [effectiveWorklogs]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* T014: Error toast */}
      {errorMessage && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between">
          <span className="text-sm text-red-700">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 text-sm font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading indicator for worklog fetching */}
      {multiUserWorklogs.isLoading && (
        <div className="h-0.5 bg-blue-100 overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse" style={{ width: '100%' }} />
        </div>
      )}

      {/* T015: Extracted toolbar */}
      <div className="relative">
        <CalendarToolbar
          rangeLabel={nav.rangeLabel}
          viewMode={nav.viewMode}
          onPrev={nav.goToPrev}
          onNext={nav.goToNext}
          onToday={nav.goToToday}
          onViewModeChange={nav.setViewMode}
          onSettingsClick={() => setShowSettings(s => !s)}
          userSelector={
            <UserSelector
              teamMembers={team.teamMembers}
              selectedAccountIds={team.selectedAccountIds}
              isLoading={team.isLoading}
              onToggleUser={team.toggleUser}
              onSelectAll={team.selectAll}
              onDeselectAll={team.deselectAll}
            />
          }
        />

        {/* T017: Settings popover */}
        {showSettings && (
          <CalendarSettingsPopover
            settings={settings}
            onSettingsChange={setSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>

      {/* T021: Daily totals row */}
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        <div className="flex-shrink-0 border-r border-gray-200" style={{ width: TIME_AXIS_WIDTH }}>
          <div className="px-1 py-1 text-xs text-gray-400 text-right">Total</div>
        </div>
        <div
          className="flex-1 grid"
          style={{ gridTemplateColumns: `repeat(${nav.visibleDays.length}, minmax(0, 1fr))` }}
        >
          {nav.visibleDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const totalSeconds = dayTotals.get(dateKey) ?? 0;
            const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
            return (
              <div
                key={dateKey}
                className="text-center py-1 text-xs font-medium text-gray-500 border-l border-gray-100 first:border-l-0"
              >
                {totalHours}h
              </div>
            );
          })}
        </div>
      </div>

      {/* T011: Per-user daily totals breakdown */}
      {multiUserMode && selectedUsers.length >= 2 && (
        <div className="border-b border-gray-200 bg-gray-50/30">
          {selectedUsers.map((user) => {
            const userTotals = userDayTotals.get(user.accountId);
            const firstName = user.displayName.split(/\s+/)[0];
            return (
              <div key={user.accountId} className="flex">
                <div className="flex-shrink-0 border-r border-gray-200 pl-3 pr-1 py-0.5 flex items-center gap-1" style={{ width: TIME_AXIS_WIDTH }}>
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="text-[10px] text-gray-500 truncate">{firstName}</span>
                </div>
                <div
                  className="flex-1 grid"
                  style={{ gridTemplateColumns: `repeat(${nav.visibleDays.length}, minmax(0, 1fr))` }}
                >
                  {nav.visibleDays.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const seconds = userTotals?.get(dateKey) ?? 0;
                    const hours = Math.round((seconds / 3600) * 10) / 10;
                    return (
                      <div
                        key={dateKey}
                        className="text-center py-0.5 text-[10px] text-gray-400 border-l border-gray-100 first:border-l-0"
                      >
                        {hours > 0 ? `${hours}h` : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* T017: Calendar grid + Issue sidebar layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Scrollable calendar grid */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
          onDragEnter={issueDragDrop.handleDragEnter}
          onDragOver={issueDragDrop.handleDragOver}
          onDragLeave={issueDragDrop.handleDragLeave}
          onDrop={issueDragDrop.handleDrop}
        >
          <div className="flex" style={{ minHeight: grid.totalHeight + 60 }}>
            {/* Time axis (left column) */}
            <div
              className="sticky left-0 z-10 bg-white border-r border-gray-200 flex-shrink-0"
              style={{ width: TIME_AXIS_WIDTH }}
            >
              {/* Empty header spacer */}
              <div className="sticky top-0 z-20 bg-white border-b border-gray-200 py-2">
                <div className="h-7" /> {/* Match day header height */}
              </div>
              {/* Hour labels */}
              <div className="relative" style={{ height: grid.totalHeight }}>
                {grid.slots
                  .filter((slot) => slot.isHourMark)
                  .map((slot) => (
                    <div
                      key={slot.time}
                      className="absolute right-2 text-xs text-gray-400 -translate-y-1/2"
                      style={{ top: slot.top }}
                    >
                      {slot.time}
                    </div>
                  ))}
              </div>
            </div>

            {/* Day columns (CSS Grid) */}
            <div
              className="flex-1 grid relative"
              style={{
                gridTemplateColumns: `repeat(${nav.visibleDays.length}, minmax(0, 1fr))`,
              }}
            >
              {nav.visibleDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = events.dayEventsMap.get(dateKey) ?? [];

                // T012: Compute selection pixels for this day column
                const selectionPixelsForDay = (slotSelection.selectionPixels &&
                  format(slotSelection.selectionPixels.day, 'yyyy-MM-dd') === dateKey)
                  ? { startTop: slotSelection.selectionPixels.startTop, height: slotSelection.selectionPixels.height }
                  : null;

                return (
                  <CalendarDayColumn
                    key={dateKey}
                    day={day}
                    events={dayEvents}
                    slots={grid.slots}
                    totalHeight={grid.totalHeight}
                    onEventPointerDown={drag.handleEventPointerDown}
                    onResizeStart={resize.handleResizeStart}
                    onSlotPointerDown={slotSelection.handleSlotPointerDown}
                    onContextMenu={contextMenu.handleContextMenu}  // T022: Context menu
                    nowIndicatorTop={isToday(day) ? nowIndicatorTop : null}
                    registerRef={registerDayRef}
                    selection={selectionPixelsForDay}
                    dragEventId={drag.dragEventId}
                    resizeEventId={resize.resizeEventId}
                    multiUserMode={multiUserMode}
                  />
                );
              })}

              {/* T016: Drop zone overlay — positioned within the correct day column */}
              {issueDragDrop.isDraggingOver && issueDragDrop.dropTarget && (() => {
                const dayIndex = nav.visibleDays.findIndex(
                  d => format(d, 'yyyy-MM-dd') === format(issueDragDrop.dropTarget!.day, 'yyyy-MM-dd')
                );
                const totalDays = nav.visibleDays.length;
                if (dayIndex < 0) return null;
                return (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: 0,
                      bottom: 0,
                      left: `${(dayIndex / totalDays) * 100}%`,
                      width: `${(1 / totalDays) * 100}%`,
                    }}
                  >
                    {/* Spacer for sticky day header */}
                    <div className="sticky top-0 z-20 py-2"><div className="h-7" /></div>
                    <div className="relative" style={{ height: grid.totalHeight }}>
                      <DropZoneOverlay dropTarget={issueDragDrop.dropTarget} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* T014: Issue sidebar */}
        <IssueSidebar
          issues={issues}
          recentIssueKeys={recentIssueKeys}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed(c => !c)}
        />
      </div>

      {/* T022: Context menu */}
      <CalendarContextMenu
        isOpen={contextMenu.menuState.isOpen}
        position={contextMenu.menuState.position}
        onEdit={() => {
          contextMenu.handleEdit((dayEvent) => {
            setEditingEvent(dayEvent.calendarEvent);
          });
        }}
        onDuplicate={() => {
          contextMenu.handleDuplicate(async (dayEvent) => {
            const calEvent = dayEvent.calendarEvent;
            const durationSeconds = Math.round(
              (calEvent.end.getTime() - calEvent.start.getTime()) / 1000
            );
            // Create duplicate at the next slot after the original
            const newStart = new Date(calEvent.end);
            try {
              const res = await fetch('/api/worklogs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  issueKey: calEvent.issueKey,
                  started: toJiraDatetime(newStart),
                  timeSpentSeconds: durationSeconds,
                }),
              });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Failed (${res.status})`);
              }
              multiUserWorklogs.refetch();
            } catch (err) {
              showError(`Failed to duplicate worklog: ${(err as Error).message}`);
            }
          });
        }}
        onDelete={() => {
          contextMenu.handleDelete(async (dayEvent) => {
            const calEvent = dayEvent.calendarEvent;
            try {
              const res = await fetch(
                `/api/worklogs?issueKey=${encodeURIComponent(calEvent.issueKey)}&worklogId=${encodeURIComponent(calEvent.id)}`,
                { method: 'DELETE' }
              );
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Failed (${res.status})`);
              }
              multiUserWorklogs.refetch();
            } catch (err) {
              showError(`Failed to delete worklog: ${(err as Error).message}`);
            }
          });
        }}
        onClose={contextMenu.closeMenu}
      />

      {/* Edit worklog modal */}
      <EditWorklogModal
        isOpen={editingEvent !== null}
        calendarEvent={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSaved={() => {
          setEditingEvent(null);
          multiUserWorklogs.refetch();
        }}
      />

      {/* Issue picker modal for slot selection */}
      <IssuePickerModal
        issues={issues}
        isOpen={issuePickerState.isOpen}
        onClose={() => setIssuePickerState({ isOpen: false, startDate: null, timeSpentSeconds: 0 })}
        onSelect={handleIssueSelected}
        recentIssueKeys={recentIssueKeys}
        duration={issuePickerState.timeSpentSeconds}
        startTime={issuePickerState.startDate}
      />
    </div>
  );
}
