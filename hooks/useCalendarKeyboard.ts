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
}

/**
 * Keyboard shortcut handler for the calendar grid.
 *
 * Shortcuts:
 *   Escape — Cancel active drag → resize → selection → context menu (first active wins)
 *   t      — Navigate to today (ignored when focus is in an input/textarea)
 */
export function useCalendarKeyboard({
  cancelDrag,
  cancelResize,
  clearSelection,
  closeMenu,
  goToToday,
}: UseCalendarKeyboardProps): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keystrokes aimed at form inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'Escape': {
          // Cascade: cancel the first active interaction found
          if (cancelDrag) {
            cancelDrag();
            return;
          }
          if (cancelResize) {
            cancelResize();
            return;
          }
          if (clearSelection) {
            clearSelection();
            return;
          }
          if (closeMenu) {
            closeMenu();
            return;
          }
          break;
        }

        case 't': {
          if (goToToday) {
            goToToday();
          }
          break;
        }

        // Future shortcuts can be added here
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cancelDrag, cancelResize, clearSelection, closeMenu, goToToday]);
}
