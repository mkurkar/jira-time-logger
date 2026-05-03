'use client';

import React, { useState, useEffect } from 'react';
import { token } from '@atlaskit/tokens';
import EditIcon from '@atlaskit/icon/core/edit';
import CopyIcon from '@atlaskit/icon/core/copy';
import DeleteIcon from '@atlaskit/icon/core/delete';

interface CalendarContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function CalendarContextMenu({
  isOpen,
  position,
  onEdit,
  onDuplicate,
  onDelete,
  onClose,
}: CalendarContextMenuProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Reset confirmation state when menu closes/opens
  useEffect(() => {
    if (!isOpen) setConfirmingDelete(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItemStyle: React.CSSProperties = {
    color: token('color.text'),
  };

  const handleHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = token('color.background.neutral.subtle.hovered');
  };
  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  // Clamp position to viewport so the menu is always visible
  const menuWidth = 160;
  const menuHeight = 120;
  const clampedX = Math.min(position.x, window.innerWidth - menuWidth - 8);
  const clampedY = Math.min(position.y, window.innerHeight - menuHeight - 8);

  return (
    <div
      data-context-menu
      className="fixed z-50 rounded-md py-1 min-w-[160px]"
      style={{
        left: Math.max(0, clampedX),
        top: Math.max(0, clampedY),
        backgroundColor: token('elevation.surface.overlay'),
        border: `1px solid ${token('color.border')}`,
        boxShadow: token('elevation.shadow.overlay'),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {!confirmingDelete ? (
        <>
          <button
            onClick={() => { onEdit(); onClose(); }}
            className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2"
            style={menuItemStyle}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
          >
            <EditIcon label="" size="small" />
            Edit
          </button>

          <button
            onClick={() => { onDuplicate(); onClose(); }}
            className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2"
            style={menuItemStyle}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
          >
            <CopyIcon label="" size="small" />
            Duplicate
          </button>

          <div className="my-0.5 mx-2" style={{ borderTop: `1px solid ${token('color.border')}` }} />

          <button
            onClick={() => setConfirmingDelete(true)}
            className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2"
            style={{ color: token('color.text.danger') }}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
          >
            <DeleteIcon label="" size="small" />
            Delete
          </button>
        </>
      ) : (
        <div className="px-3 py-2">
          <p className="text-xs font-medium mb-2" style={{ color: token('color.text') }}>
            Delete this worklog?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { onDelete(); }}
              className="px-2.5 py-1 text-xs font-medium rounded"
              style={{
                backgroundColor: token('color.background.danger.bold'),
                color: token('color.text.inverse'),
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = token('color.background.danger.bold.hovered'); }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = token('color.background.danger.bold'); }}
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="px-2.5 py-1 text-xs font-medium rounded"
              style={{
                backgroundColor: token('color.background.neutral'),
                color: token('color.text'),
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = token('color.background.neutral.hovered'); }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = token('color.background.neutral'); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
