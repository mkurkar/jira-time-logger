'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Button from '@atlaskit/button/new';
import Textfield from '@atlaskit/textfield';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import type { CalendarEvent } from '@/types/calendar';

interface EditWorklogModalProps {
  isOpen: boolean;
  calendarEvent: CalendarEvent | null;
  onClose: () => void;
  onSaved: () => void;
}

function toJiraDatetime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  const tzOffset = -date.getTimezoneOffset();
  const sign = tzOffset >= 0 ? '+' : '-';
  const absOffset = Math.abs(tzOffset);
  const tzH = pad(Math.floor(absOffset / 60));
  const tzM = pad(absOffset % 60);
  return `${y}-${mo}-${d}T${h}:${mi}:${s}.${ms}${sign}${tzH}${tzM}`;
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

  const showModal = isOpen && calendarEvent !== null;

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
        issueKey: calendarEvent!.issueKey,
        worklogId: calendarEvent!.id,
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
    <ModalTransition>
      {showModal && (
        <Modal onClose={onClose} width="medium">
          <ModalHeader>
            <ModalTitle>Edit Worklog</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium text-blue-600">{calendarEvent!.issueKey}</span>{' '}
              {calendarEvent!.issueSummary}
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
                  <Textfield
                    type="date"
                    value={date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <Textfield
                    type="time"
                    value={time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                <Textfield
                  type="number"
                  value={hours}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHours(e.target.value)}
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
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={onClose}
              appearance="subtle"
              isDisabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              appearance="primary"
              isDisabled={isSaving}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
}
