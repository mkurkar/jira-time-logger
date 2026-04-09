'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { CalendarEvent } from '@/types/calendar';

interface EditWorklogModalProps {
  isOpen: boolean;
  calendarEvent: CalendarEvent | null;
  onClose: () => void;
  onSaved: () => void;
}

function toJiraDatetime(date: Date): string {
  const iso = date.toISOString();
  return iso.replace('Z', '+0000');
}

export default function EditWorklogModal({ isOpen, calendarEvent, onClose, onSaved }: EditWorklogModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [hours, setHours] = useState('');
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate fields when event changes
  useEffect(() => {
    if (calendarEvent) {
      setDate(format(calendarEvent.start, 'yyyy-MM-dd'));
      setTime(format(calendarEvent.start, 'HH:mm'));
      const durationHours = (calendarEvent.end.getTime() - calendarEvent.start.getTime()) / (1000 * 60 * 60);
      setHours(String(Math.round(durationHours * 100) / 100));
      setComment('');
      setError(null);
    }
  }, [calendarEvent]);

  if (!isOpen || !calendarEvent) return null;

  const handleSave = async () => {
    const numHours = parseFloat(hours);
    if (isNaN(numHours) || numHours <= 0) {
      setError('Please enter a valid duration');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const startedDate = new Date(`${date}T${time}:00`);
      const timeSpentSeconds = Math.round(numHours * 3600);

      const body: Record<string, unknown> = {
        issueKey: calendarEvent.issueKey,
        worklogId: calendarEvent.id,
        timeSpentSeconds,
        started: toJiraDatetime(startedDate),
      };
      if (comment.trim()) {
        body.comment = comment.trim();
      }

      const res = await fetch('/api/worklogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to update (${res.status})`);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Edit Worklog</h3>
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-medium text-blue-600">{calendarEvent.issueKey}</span>{' '}
          {calendarEvent.issueSummary}
        </p>

        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0.25"
              step="0.25"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Add a note..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
