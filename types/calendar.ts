import type { JiraWorklog } from '@/src/types/jira';

/** A worklog transformed into a calendar-renderable event */
export interface CalendarEvent {
  id: string;                    // worklog.id
  worklog: JiraWorklog;          // Original Jira worklog
  start: Date;                   // Parsed from worklog.started
  end: Date;                     // Computed: start + timeSpentSeconds
  color: string;                 // Derived from issue type/key hash
  issueKey: string;              // e.g., "PROJ-123"
  issueSummary: string;          // From issue fields
  authorAccountId?: string;      // worklog.author.accountId
  authorDisplayName?: string;    // worklog.author.displayName
  authorColor?: string;          // Derived from getUserColor(accountId)
}

/** A CalendarEvent positioned within a specific day column */
export interface DayEvent {
  id: string;                    // Same as CalendarEvent.id + day suffix for cross-day splits
  calendarEvent: CalendarEvent;
  day: Date;                     // The specific day this segment belongs to
  top: number;                   // px from top of grid
  height: number;                // px height
  left: string;                  // CSS percentage for overlap layout (e.g., "0%")
  width: string;                 // CSS percentage for overlap layout (e.g., "100%")
  isClippedStart: boolean;       // Event starts before this day (midnight clip)
  isClippedEnd: boolean;         // Event ends after this day (midnight clip)
  column: number;                // Assigned overlap column index (0-based)
  totalColumns: number;          // Total columns in this overlap group
}

/** A time slot in the grid background */
export interface CalendarSlot {
  time: string;                  // Display label: "08:00", "08:15"
  minutesFromMidnight: number;   // For calculations
  isHourMark: boolean;           // True for :00 marks (show thicker line)
  top: number;                   // px from top of grid
}

/** User-configurable calendar settings */
export interface CalendarSettings {
  snapMinutes: 5 | 10 | 15 | 30 | 60;
  startHour: number;             // 0-23 (default 6)
  endHour: number;               // 1-24 (default 22)
  slotMinutes: 15 | 30 | 60;    // Visual slot interval
}

/** Active drag/resize/selection state (used by interaction hooks) */
export type InteractionMode = 'idle' | 'dragging' | 'resizing' | 'selecting';

/** Selection range for drag-to-create */
export interface SlotSelection {
  day: Date;
  startMinutes: number;          // Minutes from midnight
  endMinutes: number;            // Minutes from midnight
}
