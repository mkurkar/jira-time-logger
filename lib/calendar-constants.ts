import type { CalendarSettings } from '@/types/calendar';

/** Height in pixels for one time slot unit */
export const SLOT_HEIGHT = 25;

/** Minimum pixels pointer must move before drag activates */
export const DRAG_THRESHOLD = 5;

/** Width of the left time axis column in pixels */
export const TIME_AXIS_WIDTH = 48;

/** Minimum event duration in minutes (prevents zero-height events) */
export const MIN_EVENT_MINUTES = 15;

/** Default calendar settings */
export const DEFAULT_SETTINGS: CalendarSettings = {
  snapMinutes: 15,
  startHour: 6,
  endHour: 22,
  slotMinutes: 15,
};

/** Colors for issue-based event coloring (cycle through for different issue keys) */
export const EVENT_COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
] as const;

/** Get a deterministic color for an issue key */
export function getIssueColor(issueKey: string): string {
  let hash = 0;
  for (let i = 0; i < issueKey.length; i++) {
    hash = ((hash << 5) - hash + issueKey.charCodeAt(i)) | 0;
  }
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

/** Colors for user-based event coloring in multi-user mode (Google Calendar palette style) */
export const USER_COLORS = [
  '#4285F4', // Google Blue
  '#EA4335', // Google Red
  '#34A853', // Google Green
  '#FBBC05', // Google Yellow
  '#FF6D01', // Orange
  '#46BDC6', // Teal
  '#7B1FA2', // Purple
  '#C2185B', // Pink
  '#0097A7', // Cyan
  '#689F38', // Light Green
] as const;

/** Get a deterministic color for a user account ID */
export function getUserColor(accountId: string): string {
  let hash = 0;
  for (let i = 0; i < accountId.length; i++) {
    hash = ((hash << 5) - hash + accountId.charCodeAt(i)) | 0;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}
