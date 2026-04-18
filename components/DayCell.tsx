'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { token } from '@atlaskit/tokens';
import { formatHours } from '@/lib/worklog-aggregator';
import { adfToText } from '@/lib/adf-helpers';
import type { GridCell, CellMutationState } from '@/types/timesheet';
import type { JiraWorklog } from '@/src/types/jira';

interface DayCellProps {
  cell: GridCell;
  mutationState: CellMutationState;
  onSave: (cell: GridCell, newHours: number, comment?: string) => void;
  onUpdateWorklog?: (cell: GridCell, worklog: JiraWorklog, newHours: number, comment?: string) => void;
  onDeleteWorklog?: (cell: GridCell, worklog: JiraWorklog) => void;
}

export default function DayCell({ cell, mutationState, onSave, onUpdateWorklog, onDeleteWorklog }: DayCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [commentValue, setCommentValue] = useState('');
  const [showExpanded, setShowExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close expanded view when clicking outside
  useEffect(() => {
    if (!showExpanded) return;
    const handler = (e: MouseEvent) => {
      if (expandedRef.current && !expandedRef.current.contains(e.target as Node)) {
        setShowExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExpanded]);

  const hasMultipleWorklogs = cell.worklogs.length > 1;
  const hasComments = cell.worklogs.some(wl => wl.comment && adfToText(wl.comment).trim().length > 0);

  const startEditing = useCallback(() => {
    if (mutationState.status === 'saving') return;
    if (hasMultipleWorklogs) {
      setShowExpanded(true);
      return;
    }
    setEditValue(cell.hours > 0 ? String(cell.hours) : '');
    // Pre-fill comment from existing worklog
    const existingComment = cell.worklogs[0]?.comment ? adfToText(cell.worklogs[0].comment) : '';
    setCommentValue(existingComment);
    setIsEditing(true);
  }, [cell.hours, cell.worklogs, mutationState.status, hasMultipleWorklogs]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
    setCommentValue('');
  }, []);

  const parseHours = (input: string): number => {
    const trimmed = input.trim();
    if (!trimmed) return 0;
    const cleaned = trimmed.replace(/h$/i, '');
    if (cleaned.includes(':')) {
      const [h, m] = cleaned.split(':').map(Number);
      return (h || 0) + (m || 0) / 60;
    }
    const val = parseFloat(cleaned);
    if (isNaN(val) || val < 0) return 0;
    return Math.round(val * 10) / 10;
  };

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    const newHours = parseHours(editValue);
    const comment = commentValue.trim() || undefined;
    onSave(cell, newHours, comment);
  }, [editValue, commentValue, cell, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        cancelEditing();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
      }
    },
    [commitEdit, cancelEditing],
  );

  const isSaving = mutationState.status === 'saving';
  const isError = mutationState.status === 'error';
  const hasTime = cell.hours > 0;

  if (isEditing) {
    return (
      <td className="px-1 py-1 relative">
        <div className="flex flex-col gap-1">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { /* delay to allow comment focus */ }}
            className="w-full px-2 py-1 text-center text-sm rounded outline-none"
            style={{
              border: `2px solid ${token('color.border.focused')}`,
              backgroundColor: token('color.background.selected'),
              color: token('color.text'),
            }}
            placeholder="0h"
          />
          <input
            type="text"
            value={commentValue}
            onChange={(e) => setCommentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            className="w-full px-2 py-0.5 text-xs rounded outline-none"
            style={{
              border: `1px solid ${token('color.border')}`,
              backgroundColor: token('elevation.surface'),
              color: token('color.text.subtle'),
            }}
            placeholder="Comment..."
          />
        </div>
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
      className={`px-3 py-2 text-center text-sm tabular-nums cursor-pointer transition-colors relative ${isSaving ? 'animate-pulse' : ''}`}
      style={cellStyle}
      onMouseEnter={(e) => { if (!isSaving && !isError) e.currentTarget.style.backgroundColor = token('color.background.neutral.subtle.hovered'); }}
      onMouseLeave={(e) => { if (!isSaving && !isError) e.currentTarget.style.backgroundColor = ''; }}
      title={isError ? `Error: ${mutationState.error}` : isSaving ? 'Saving...' : hasMultipleWorklogs ? `${cell.worklogs.length} worklogs — click to expand` : 'Click to edit'}
    >
      {isSaving ? '...' : formatHours(cell.hours)}
      {/* Indicators */}
      {hasComments && !isSaving && (
        <span
          className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: token('color.icon.information') }}
          title="Has comment"
        />
      )}
      {hasMultipleWorklogs && !isSaving && (
        <span
          className="absolute bottom-0.5 right-0.5 text-[9px] leading-none font-medium"
          style={{ color: token('color.text.subtlest') }}
        >
          {cell.worklogs.length}
        </span>
      )}

      {/* Expanded multi-worklog popover */}
      {showExpanded && (
        <div
          ref={expandedRef}
          className="absolute z-50 left-0 top-full mt-1 min-w-[220px] rounded-md p-2"
          style={{
            backgroundColor: token('elevation.surface.overlay'),
            border: `1px solid ${token('color.border')}`,
            boxShadow: token('elevation.shadow.overlay'),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-medium mb-1.5" style={{ color: token('color.text.subtle') }}>
            {cell.worklogs.length} worklogs
          </div>
          {cell.worklogs.map((wl) => {
            const hours = Math.round((wl.timeSpentSeconds / 3600) * 10) / 10;
            const comment = wl.comment ? adfToText(wl.comment) : '';
            return (
              <WorklogRow
                key={wl.id}
                worklog={wl}
                hours={hours}
                comment={comment}
                onUpdate={(newHours, newComment) => {
                  onUpdateWorklog?.(cell, wl, newHours, newComment);
                  setShowExpanded(false);
                }}
                onDelete={() => {
                  onDeleteWorklog?.(cell, wl);
                  setShowExpanded(false);
                }}
              />
            );
          })}
        </div>
      )}
    </td>
  );
}

/** Individual worklog row in the expanded popover */
function WorklogRow({
  worklog,
  hours,
  comment,
  onUpdate,
  onDelete,
}: {
  worklog: JiraWorklog;
  hours: number;
  comment: string;
  onUpdate: (newHours: number, comment?: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editHours, setEditHours] = useState(String(hours));
  const [editComment, setEditComment] = useState(comment);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const parseHours = (input: string): number => {
    const trimmed = input.trim();
    if (!trimmed) return 0;
    const cleaned = trimmed.replace(/h$/i, '');
    if (cleaned.includes(':')) {
      const [h, m] = cleaned.split(':').map(Number);
      return (h || 0) + (m || 0) / 60;
    }
    const val = parseFloat(cleaned);
    if (isNaN(val) || val < 0) return 0;
    return Math.round(val * 10) / 10;
  };

  if (isEditing) {
    return (
      <div className="p-1.5 mb-1 rounded" style={{ backgroundColor: token('color.background.neutral.subtle') }}>
        <div className="flex gap-1 mb-1">
          <input
            ref={inputRef}
            type="text"
            value={editHours}
            onChange={(e) => setEditHours(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onUpdate(parseHours(editHours), editComment.trim() || undefined);
              } else if (e.key === 'Escape') {
                setIsEditing(false);
              }
            }}
            className="w-16 px-1.5 py-0.5 text-xs text-center rounded outline-none"
            style={{ border: `1px solid ${token('color.border.focused')}`, backgroundColor: token('elevation.surface'), color: token('color.text') }}
            placeholder="0h"
          />
          <button
            onClick={() => onUpdate(parseHours(editHours), editComment.trim() || undefined)}
            className="px-1.5 py-0.5 text-[10px] rounded font-medium"
            style={{ backgroundColor: token('color.background.brand.bold'), color: token('color.text.inverse') }}
          >
            Save
          </button>
        </div>
        <input
          type="text"
          value={editComment}
          onChange={(e) => setEditComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onUpdate(parseHours(editHours), editComment.trim() || undefined);
            else if (e.key === 'Escape') setIsEditing(false);
          }}
          className="w-full px-1.5 py-0.5 text-[10px] rounded outline-none"
          style={{ border: `1px solid ${token('color.border')}`, backgroundColor: token('elevation.surface'), color: token('color.text.subtle') }}
          placeholder="Comment..."
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between px-1.5 py-1 mb-0.5 rounded cursor-pointer group"
      style={{ color: token('color.text') }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = token('color.background.neutral.subtle.hovered'); }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
      onClick={() => {
        setEditHours(String(hours));
        setEditComment(comment);
        setIsEditing(true);
      }}
    >
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium tabular-nums">{hours}h</span>
        {comment && (
          <span className="text-[10px] ml-1.5 truncate" style={{ color: token('color.text.subtlest') }}>
            {comment}
          </span>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 ml-1 px-1 py-0.5 text-[10px] rounded"
        style={{ color: token('color.text.danger') }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = token('color.background.danger'); }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
      >
        ×
      </button>
    </div>
  );
}
