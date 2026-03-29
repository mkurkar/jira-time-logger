'use client';

import { useState, useCallback } from 'react';
import { formatDateISO } from '@/lib/date-utils';

interface BulkEntry {
  id: string;
  issueKey: string;
  date: string; // YYYY-MM-DD
  hours: string;
  status: 'pending' | 'saving' | 'success' | 'error';
  error?: string;
}

interface BulkEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void; // Trigger data refetch
}

export default function BulkEntryModal({ isOpen, onClose, onComplete }: BulkEntryModalProps) {
  const [entries, setEntries] = useState<BulkEntry[]>([createEmptyEntry()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  function createEmptyEntry(): BulkEntry {
    return {
      id: crypto.randomUUID(),
      issueKey: '',
      date: formatDateISO(new Date()),
      hours: '',
      status: 'pending',
    };
  }

  const addRow = useCallback(() => {
    setEntries((prev) => [...prev, createEmptyEntry()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateEntry = useCallback((id: string, field: keyof BulkEntry, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  }, []);

  const submitAll = useCallback(async () => {
    // Filter valid entries
    const valid = entries.filter(
      (e) => e.issueKey.trim() && e.date && e.hours.trim() && parseFloat(e.hours) > 0,
    );
    if (valid.length === 0) return;

    setIsSubmitting(true);
    setProgress({ done: 0, total: valid.length });

    let completed = 0;
    const updatedEntries = [...entries];

    for (const entry of valid) {
      const idx = updatedEntries.findIndex((e) => e.id === entry.id);
      updatedEntries[idx] = { ...updatedEntries[idx], status: 'saving' };
      setEntries([...updatedEntries]);

      try {
        const hours = parseFloat(entry.hours);
        const timeSpentSeconds = Math.round(hours * 3600);
        const started = `${entry.date}T09:00:00.000+0000`;

        const res = await fetch('/api/worklogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issueKey: entry.issueKey.trim(),
            timeSpentSeconds,
            started,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed (${res.status})`);
        }

        updatedEntries[idx] = { ...updatedEntries[idx], status: 'success' };
      } catch (err) {
        updatedEntries[idx] = {
          ...updatedEntries[idx],
          status: 'error',
          error: (err as Error).message,
        };
      }

      completed++;
      setProgress({ done: completed, total: valid.length });
      setEntries([...updatedEntries]);
    }

    setIsSubmitting(false);
    onComplete();
  }, [entries, onComplete]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setEntries([createEmptyEntry()]);
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Bulk Time Entry</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {isSubmitting && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
              Saving... {progress.done}/{progress.total} entries
            </div>
          )}

          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="PROJ-123"
                  value={entry.issueKey}
                  onChange={(e) => updateEntry(entry.id, 'issueKey', e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 border rounded text-sm"
                />
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                  disabled={isSubmitting}
                  className="px-3 py-2 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Hours"
                  value={entry.hours}
                  onChange={(e) => updateEntry(entry.id, 'hours', e.target.value)}
                  disabled={isSubmitting}
                  className="w-20 px-3 py-2 border rounded text-sm text-center"
                />
                {/* Status indicator */}
                <span className="w-6 text-center">
                  {entry.status === 'saving' && '\u23F3'}
                  {entry.status === 'success' && '\u2705'}
                  {entry.status === 'error' && (
                    <span title={entry.error} className="cursor-help">{'\u274C'}</span>
                  )}
                </span>
                <button
                  onClick={() => removeRow(entry.id)}
                  disabled={isSubmitting || entries.length === 1}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addRow}
            disabled={isSubmitting}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            + Add another entry
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submitAll}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? `Saving ${progress.done}/${progress.total}...` : 'Submit All'}
          </button>
        </div>
      </div>
    </div>
  );
}
