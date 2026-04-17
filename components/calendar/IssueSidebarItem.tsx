'use client';

import React, { useState } from 'react';
import { token } from '@atlaskit/tokens';
import type { JiraIssue } from '@/src/types/jira';

interface IssueSidebarItemProps {
  issue: JiraIssue;
  isRecentlyUsed?: boolean;
}

export default function IssueSidebarItem({ issue, isRecentlyUsed = false }: IssueSidebarItemProps) {
  const [isHovered, setIsHovered] = useState(false);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="px-3 py-2 cursor-grab active:cursor-grabbing transition-colors"
      style={{
        borderBottom: `1px solid ${token('color.border')}`,
        backgroundColor: isHovered
          ? token('color.background.neutral.subtle.hovered')
          : isRecentlyUsed
            ? token('color.background.warning')
            : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: token('color.link') }}>{issue.key}</span>
        <span className="text-xs truncate" style={{ color: token('color.text.subtle') }}>{issue.fields.summary}</span>
      </div>
      {issue.fields.status && (
        <div className="mt-0.5 text-[10px]" style={{ color: token('color.text.disabled') }}>{issue.fields.status.name}</div>
      )}
    </div>
  );
}
