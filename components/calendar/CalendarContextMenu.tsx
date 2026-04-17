'use client';

import React from 'react';
import Button from '@atlaskit/button/new';
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
  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 bg-white rounded-md border border-gray-200 shadow-lg py-1 min-w-[160px]"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => { onEdit(); onClose(); }}
        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <EditIcon label="" size="small" />
        Edit
      </button>

      <button
        onClick={() => { onDuplicate(); onClose(); }}
        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <CopyIcon label="" size="small" />
        Duplicate
      </button>

      <button
        onClick={() => { onDelete(); onClose(); }}
        className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
      >
        <DeleteIcon label="" size="small" />
        Delete
      </button>
    </div>
  );
}
