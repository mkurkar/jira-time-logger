'use client';

import { useEffect } from 'react';

interface UseCalendarKeyboardProps {
  /** Cancel active drag (revert override) */
  cancelDrag?: () => void;
  /** Cancel active resize (revert override) */
  cancelResize?: () => void;
  /** Clear slot selection */
  clearSelection?: () => void;
  /** Close context menu */
  closeMenu?: () => void;
  /** Navigate to today */
  goToToday?: () => void;
  /** Navigate to previous week */
  prevWeek?: () => void;
  /** Navigate to next week */
  nextWeek?: () => void;
  /** Open new worklog for today (n key) */
  openNewWorklog?: () => void;
  /** Edit the currently focused/selected event (e key) */
  editSelected?: () => void;
  /** Delete the currently focused/selected event (Delete / Backspace) */
  deleteSelected?: () => void;
}

/**
 * Keyboard shortcut handler for the calendar grid.
 *
 * Shortcuts:
 *   Escape      — Cancel active drag → resize → selection → context menu
 *   t           — Navigate to today
 *   ArrowLeft   — Previous week
 *   ArrowRight  — Next week
 *   n           — Open new worklog modal (for today)
 *   e           — Edit the selected/focused event
 *   Delete / Backspace — Delete the selected/focused event
 */
export function useCalendarKeyboard({
  cancelDrag,
  cancelResize,
  clearSelection,
  closeMenu,
  goToToday,
  prevWeek,
  nextWeek,
  openNewWorklog,
  editSelected,
  deleteSelected,
}: UseCalendarKeyboardProps): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keystrokes aimed at form inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'Escape': {
          if (cancelDrag) { cancelDrag(); return; }
          if (cancelResize) { cancelResize(); return; }
          if (clearSelection) { clearSelection(); return; }
          if (closeMenu) { closeMenu(); return; }
          break;
        }

        case 't': {
          goToToday?.();
          break;
        }

        case 'ArrowLeft': {
          if (e.altKey || e.metaKey) { prevWeek?.(); e.preventDefault(); }
          break;
        }

        case 'ArrowRight': {
          if (e.altKey || e.metaKey) { nextWeek?.(); e.preventDefault(); }
          break;
        }

        case 'n': {
          openNewWorklog?.();
          break;
        }

        case 'e': {
          editSelected?.();
          break;
        }

        case 'Delete':
        case 'Backspace': {
          deleteSelected?.();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cancelDrag, cancelResize, clearSelection, closeMenu, goToToday, prevWeek, nextWeek, openNewWorklog, editSelected, deleteSelected]);
}
