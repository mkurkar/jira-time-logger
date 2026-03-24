import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';

/** Get Monday-Sunday week range for a given date */
export function getWeekRange(date: Date): {
  start: Date;
  end: Date;
  dates: Date[];
} {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  const dates = eachDayOfInterval({ start, end });
  return { start, end, dates };
}

/** Format date for display: "Apr 06, 2026" */
export function formatDate(date: Date): string {
  return format(date, 'MMM dd, yyyy');
}

/** Format date for API calls: "2026-04-06" */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Get week label: "Week of Apr 06, 2026 - Apr 12, 2026" */
export function getWeekLabel(start: Date, end: Date): string {
  return `Week of ${formatDate(start)} - ${formatDate(end)}`;
}

/** Shift a date by N weeks (-1 for prev, +1 for next) */
export function shiftWeek(date: Date, direction: number): Date {
  return addDays(date, direction * 7);
}

/** Get short day name: "Mon", "Tue", etc. */
export function getDayName(date: Date): string {
  return format(date, 'EEE');
}

/** Get day+date label: "Mon 04/06" */
export function getDayLabel(date: Date): string {
  return format(date, 'EEE MM/dd');
}

/** Check if two dates are the same calendar day */
export function isSameCalendarDay(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}
