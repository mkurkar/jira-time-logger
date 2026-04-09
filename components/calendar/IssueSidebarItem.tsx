'use client';

import React from 'react';
import type { JiraIssue } from '@/src/types/jira';

interface IssueSidebarItemProps {
  issue: JiraIssue;
  isRecentlyUsed?: boolean;
}

export default function IssueSidebarItem({ issue, isRecentlyUsed = false }: IssueSidebarItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      issueKey: issue.key,
      issueSummary: issue.fields.summary,
    }));
    e.dataTransfer.effectAllowed = 'copy';

    // Create a custom drag image
    const dragEl = document.createElement('div');
    dragEl.textContent = issue.key;
    dragEl.style.cssText = 'position:absolute;top:-1000px;padding:4px 8px;background:#3b82f6;color:white;border-radius:4px;font-size:12px;font-weight:600;';
    document.body.appendChild(dragEl);
    e.dataTransfer.setDragImage(dragEl, 0, 0);
    // Cleanup after a tick
    requestAnimationFrame(() => document.body.removeChild(dragEl));
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`
        px-3 py-2 cursor-grab active:cursor-grabbing
        border-b border-gray-100 hover:bg-blue-50 transition-colors
        ${isRecentlyUsed ? 'bg-amber-50/50' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">{issue.key}</span>
        <span className="text-xs text-gray-600 truncate">{issue.fields.summary}</span>
      </div>
      {issue.fields.status && (
        <div className="mt-0.5 text-[10px] text-gray-400">{issue.fields.status.name}</div>
      )}
    </div>
  );
}
