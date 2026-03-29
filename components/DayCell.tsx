'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { formatHours } from '@/lib/worklog-aggregator';
import type { GridCell, CellMutationState } from '@/types/timesheet';

interface DayCellProps {
  cell: GridCell;
  mutationState: CellMutationState;
  onSave: (cell: GridCell, newHours: number) => void;
}

export default function DayCell({ cell, mutationState, onSave }: DayCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    if (mutationState.status === 'saving') return; // Don't edit while saving
    setEditValue(cell.hours > 0 ? String(cell.hours) : '');
    setIsEditing(true);
  }, [cell.hours, mutationState.status]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    // Parse hours — support "2", "2h", "2.5", "2.5h", "1:30" (1.5h)
    let newHours = 0;
    if (trimmed) {
      const cleaned = trimmed.replace(/h$/i, '');
      if (cleaned.includes(':')) {
        const [h, m] = cleaned.split(':').map(Number);
        newHours = (h || 0) + (m || 0) / 60;
      } else {
        newHours = parseFloat(cleaned);
      }
      if (isNaN(newHours) || newHours < 0) {
        newHours = 0; // Invalid input → treat as 0
      }
      // Round to 1 decimal
      newHours = Math.round(newHours * 10) / 10;
    }
    onSave(cell, newHours);
  }, [editValue, cell, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        cancelEditing();
      }
    },
    [commitEdit, cancelEditing],
  );

  const isSaving = mutationState.status === 'saving';
  const isError = mutationState.status === 'error';
  const hasTime = cell.hours > 0;

  if (isEditing) {
    return (
      <td className="px-1 py-1">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitEdit}
          className="w-full px-2 py-1 text-center text-sm border-2 border-blue-500 rounded outline-none bg-blue-50"
          placeholder="0h"
        />
      </td>
    );
  }

  return (
    <td
      onClick={startEditing}
      className={`px-3 py-2 text-center text-sm tabular-nums cursor-pointer transition-colors
        ${isSaving ? 'bg-yellow-50 text-yellow-600 animate-pulse' : ''}
        ${isError ? 'bg-red-50 text-red-600' : ''}
        ${!isSaving && !isError && hasTime ? 'text-gray-900 font-medium hover:bg-blue-50' : ''}
        ${!isSaving && !isError && !hasTime ? 'text-gray-400 hover:bg-blue-50' : ''}
      `}
      title={isError ? `Error: ${mutationState.error}` : isSaving ? 'Saving...' : 'Click to edit'}
    >
      {isSaving ? '⏳' : formatHours(cell.hours)}
    </td>
  );
}
