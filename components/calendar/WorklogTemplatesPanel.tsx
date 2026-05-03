'use client';

import React, { useState, useCallback } from 'react';
import { token } from '@atlaskit/tokens';
import Button, { IconButton } from '@atlaskit/button/new';
import Textfield from '@atlaskit/textfield';
import TrashIcon from '@atlaskit/icon/core/delete';
import type { WorklogTemplate } from '@/types/template';
import { loadTemplates, saveTemplates } from '@/types/template';

interface WorklogTemplatesPanelProps {
  onApplyTemplate: (template: WorklogTemplate) => void;
}

interface SaveFormState {
  name: string;
  issueKey: string;
  issueSummary: string;
  defaultHours: string;
}

const EMPTY_FORM: SaveFormState = {
  name: '',
  issueKey: '',
  issueSummary: '',
  defaultHours: '1',
};

export default function WorklogTemplatesPanel({ onApplyTemplate }: WorklogTemplatesPanelProps) {
  const [templates, setTemplates] = useState<WorklogTemplate[]>(() => loadTemplates());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SaveFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const persist = useCallback((updated: WorklogTemplate[]) => {
    setTemplates(updated);
    saveTemplates(updated);
  }, []);

  const handleDelete = useCallback((id: string) => {
    persist(templates.filter(t => t.id !== id));
  }, [templates, persist]);

  const handleSave = useCallback(() => {
    const issueKey = form.issueKey.trim().toUpperCase();
    const name = form.name.trim();
    const hours = parseFloat(form.defaultHours);

    if (!issueKey) { setFormError('Issue key is required'); return; }
    if (!name) { setFormError('Template name is required'); return; }
    if (isNaN(hours) || hours <= 0) { setFormError('Default hours must be a positive number'); return; }

    const template: WorklogTemplate = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      issueKey,
      issueSummary: form.issueSummary.trim(),
      defaultHours: hours,
    };

    persist([...templates, template]);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(false);
  }, [form, templates, persist]);

  const handleDragStart = useCallback((e: React.DragEvent, template: WorklogTemplate) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      issueKey: template.issueKey,
      issueSummary: template.issueSummary || template.issueKey,
      defaultDurationSeconds: Math.round(template.defaultHours * 3600),
    }));
    e.dataTransfer.effectAllowed = 'copy';

    const dragEl = document.createElement('div');
    dragEl.textContent = template.issueKey;
    dragEl.style.cssText =
      'position:absolute;top:-1000px;padding:4px 8px;background:#3b82f6;color:white;border-radius:4px;font-size:12px;font-weight:600;';
    document.body.appendChild(dragEl);
    e.dataTransfer.setDragImage(dragEl, 0, 0);
    requestAnimationFrame(() => document.body.removeChild(dragEl));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable template list */}
      <div className="flex-1 overflow-y-auto">
        {templates.length === 0 && !showForm && (
          <div className="px-3 py-8 text-center text-xs" style={{ color: token('color.text.disabled') }}>
            No templates yet. Save a template to quickly log recurring tasks.
          </div>
        )}

        {templates.map((template) => (
          <TemplateItem
            key={template.id}
            template={template}
            onApply={onApplyTemplate}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

      {/* Inline save form */}
      {showForm && (
        <div className="px-3 py-3 border-t" style={{
          borderColor: token('color.border'),
          backgroundColor: token('color.background.neutral.subtle'),
        }}>
          <p className="text-xs font-semibold mb-2" style={{ color: token('color.text') }}>New Template</p>

          <div className="flex flex-col gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wide mb-0.5 block" style={{ color: token('color.text.subtlest') }}>
                Template Name *
              </label>
              <Textfield
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm(f => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Daily standup"
                isCompact
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wide mb-0.5 block" style={{ color: token('color.text.subtlest') }}>
                Issue Key *
              </label>
              <Textfield
                value={form.issueKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm(f => ({ ...f, issueKey: e.target.value }))
                }
                placeholder="e.g. PROJ-123"
                isCompact
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wide mb-0.5 block" style={{ color: token('color.text.subtlest') }}>
                Summary (optional)
              </label>
              <Textfield
                value={form.issueSummary}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm(f => ({ ...f, issueSummary: e.target.value }))
                }
                placeholder="Short description"
                isCompact
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wide mb-0.5 block" style={{ color: token('color.text.subtlest') }}>
                Default Hours *
              </label>
              <Textfield
                value={form.defaultHours}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm(f => ({ ...f, defaultHours: e.target.value }))
                }
                placeholder="1"
                isCompact
                type="number"
              />
            </div>

            {formError && (
              <p className="text-[10px]" style={{ color: token('color.text.danger') }}>{formError}</p>
            )}

            <div className="flex gap-2">
              <Button appearance="primary" spacing="compact" onClick={handleSave}>
                Save
              </Button>
              <Button appearance="subtle" spacing="compact" onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
                setFormError(null);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {!showForm && (
        <div className="px-3 py-2" style={{
          borderTop: `1px solid ${token('color.border')}`,
          backgroundColor: token('color.background.neutral'),
        }}>
          <Button appearance="default" spacing="compact" onClick={() => setShowForm(true)}>
            + New Template
          </Button>
          <p className="mt-1.5 text-[10px] text-center" style={{ color: token('color.text.disabled') }}>
            Drag a template onto the calendar to log time
          </p>
        </div>
      )}
    </div>
  );
}

interface TemplateItemProps {
  template: WorklogTemplate;
  onApply: (t: WorklogTemplate) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, t: WorklogTemplate) => void;
}

function TemplateItem({ template, onApply, onDelete, onDragStart }: TemplateItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, template)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="px-3 py-2 cursor-grab active:cursor-grabbing"
      style={{
        borderBottom: `1px solid ${token('color.border')}`,
        backgroundColor: isHovered ? token('color.background.neutral.subtle.hovered') : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: token('color.link') }}>
              {template.issueKey}
            </span>
            <span className="text-[10px] font-medium truncate" style={{ color: token('color.text') }}>
              {template.name}
            </span>
          </div>
          {template.issueSummary && (
            <div className="text-[10px] truncate mt-0.5" style={{ color: token('color.text.subtle') }}>
              {template.issueSummary}
            </div>
          )}
          <div className="text-[10px] mt-0.5" style={{ color: token('color.text.disabled') }}>
            {template.defaultHours}h default
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            appearance="primary"
            spacing="compact"
            onClick={() => onApply(template)}
          >
            Log Today
          </Button>
          <IconButton
            icon={TrashIcon}
            label="Delete template"
            appearance="subtle"
            spacing="compact"
            onClick={() => onDelete(template.id)}
          />
        </div>
      </div>
    </div>
  );
}
