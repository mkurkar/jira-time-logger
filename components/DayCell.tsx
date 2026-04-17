'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { token } from '@atlaskit/tokens';
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
          className="w-full px-2 py-1 text-center text-sm rounded outline-none"
          style={{
            border: `2px solid ${token('color.border.focused')}`,
            backgroundColor: token('color.background.selected'),
            color: token('color.text'),
          }}
          placeholder="0h"
        />
      </td>
    );
  }

  const cellStyle: React.CSSProperties = isSaving
    ? { backgroundColor: token('color.background.warning'), color: token('color.text.warning') }
    : isError
    ? { backgroundColor: token('color.background.danger'), color: token('color.text.danger') }
    : hasTime
    ? { color: token('color.text'), fontWeight: 500 }
    : { color: token('color.text.subtlest') };

  return (
    <td
      onClick={startEditing}
      className={`px-3 py-2 text-center text-sm tabular-nums cursor-pointer transition-colors ${isSaving ? 'animate-pulse' : ''}`}
      style={cellStyle}
      onMouseEnter={(e) => { if (!isSaving && !isError) e.currentTarget.style.backgroundColor = token('color.background.neutral.subtle.hovered'); }}
      onMouseLeave={(e) => { if (!isSaving && !isError) e.currentTarget.style.backgroundColor = ''; }}
      title={isError ? `Error: ${mutationState.error}` : isSaving ? 'Saving...' : 'Click to edit'}
    >
      {isSaving ? '⏳' : formatHours(cell.hours)}
    </td>
  );
}
