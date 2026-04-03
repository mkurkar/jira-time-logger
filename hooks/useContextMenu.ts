'use client';

import { useState, useCallback, useEffect } from 'react';
import type { DayEvent } from '@/types/calendar';

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  targetEvent: DayEvent | null;
}

interface UseContextMenuReturn {
  menuState: ContextMenuState;
  handleContextMenu: (e: React.MouseEvent, dayEvent: DayEvent) => void;
  closeMenu: () => void;
  handleEdit: (callback: (event: DayEvent) => void) => void;
  handleDuplicate: (callback: (event: DayEvent) => void) => void;
  handleDelete: (callback: (event: DayEvent) => void) => void;
}

const INITIAL_STATE: ContextMenuState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  targetEvent: null,
};

export function useContextMenu(): UseContextMenuReturn {
  const [menuState, setMenuState] = useState<ContextMenuState>(INITIAL_STATE);

  const closeMenu = useCallback(() => {
    setMenuState(INITIAL_STATE);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, dayEvent: DayEvent) => {
      e.preventDefault();
      setMenuState({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        targetEvent: dayEvent,
      });
    },
    [],
  );

  const handleEdit = useCallback(
    (callback: (event: DayEvent) => void) => {
      if (menuState.targetEvent) {
        callback(menuState.targetEvent);
        closeMenu();
      }
    },
    [menuState.targetEvent, closeMenu],
  );

  const handleDuplicate = useCallback(
    (callback: (event: DayEvent) => void) => {
      if (menuState.targetEvent) {
        callback(menuState.targetEvent);
        closeMenu();
      }
    },
    [menuState.targetEvent, closeMenu],
  );

  const handleDelete = useCallback(
    (callback: (event: DayEvent) => void) => {
      if (menuState.targetEvent) {
        callback(menuState.targetEvent);
        closeMenu();
      }
    },
    [menuState.targetEvent, closeMenu],
  );

  // Close on document click or Escape key
  useEffect(() => {
    if (!menuState.isOpen) return;

    const handleClick = () => closeMenu();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuState.isOpen, closeMenu]);

  // Close on any parent scroll
  useEffect(() => {
    if (!menuState.isOpen) return;

    const handleScroll = () => closeMenu();

    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuState.isOpen, closeMenu]);

  return {
    menuState,
    handleContextMenu,
    closeMenu,
    handleEdit,
    handleDuplicate,
    handleDelete,
  };
}
