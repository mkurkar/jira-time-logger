'use client';

import React from 'react';
import type { CalendarSettings } from '@/types/calendar';

interface CalendarSettingsPopoverProps {
  settings: CalendarSettings;
  onSettingsChange: (settings: CalendarSettings) => void;
  onClose: () => void;
}

const SNAP_OPTIONS: CalendarSettings['snapMinutes'][] = [5, 10, 15, 30, 60];
const SLOT_OPTIONS: CalendarSettings['slotMinutes'][] = [15, 30, 60];

export default function CalendarSettingsPopover({
  settings,
  onSettingsChange,
  onClose,
}: CalendarSettingsPopoverProps) {
  const handleChange = (field: keyof CalendarSettings, value: number) => {
    const updated = { ...settings, [field]: value };

    // Enforce endHour > startHour
    if (field === 'startHour' && value >= settings.endHour) {
      updated.endHour = Math.min(value + 1, 24);
    }
    if (field === 'endHour' && value <= settings.startHour) {
      updated.startHour = Math.max(value - 1, 0);
    }

    onSettingsChange(updated);
  };

  // Build start hour options (0-12)
  const startHourOptions = Array.from({ length: 13 }, (_, i) => i);
  // Build end hour options (12-24)
  const endHourOptions = Array.from({ length: 13 }, (_, i) => i + 12);

  return (
    <div
      className="absolute right-4 top-full mt-1 w-64 bg-white rounded-lg border border-gray-200 shadow-lg z-50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Settings</h3>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          aria-label="Close settings"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {/* Snap granularity */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600">Snap to</label>
          <select
            value={settings.snapMinutes}
            onChange={(e) => handleChange('snapMinutes', Number(e.target.value))}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
          >
            {SNAP_OPTIONS.map((v) => (
              <option key={v} value={v}>{v} min</option>
            ))}
          </select>
        </div>

        {/* Start hour */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600">Start hour</label>
          <select
            value={settings.startHour}
            onChange={(e) => handleChange('startHour', Number(e.target.value))}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
          >
            {startHourOptions.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>

        {/* End hour */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600">End hour</label>
          <select
            value={settings.endHour}
            onChange={(e) => handleChange('endHour', Number(e.target.value))}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
          >
            {endHourOptions.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>

        {/* Slot display size */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600">Slot size</label>
          <select
            value={settings.slotMinutes}
            onChange={(e) => handleChange('slotMinutes', Number(e.target.value))}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
          >
            {SLOT_OPTIONS.map((v) => (
              <option key={v} value={v}>{v} min</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
