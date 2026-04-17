'use client';

import React from 'react';
import { token } from '@atlaskit/tokens';
import Select from '@atlaskit/select';
import { IconButton } from '@atlaskit/button/new';
import CrossIcon from '@atlaskit/icon/core/cross';
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
  const startHourOptions = Array.from({ length: 13 }, (_, i) => ({
    label: `${String(i).padStart(2, '0')}:00`,
    value: i,
  }));
  // Build end hour options (12-24)
  const endHourOptions = Array.from({ length: 13 }, (_, i) => ({
    label: `${String(i + 12).padStart(2, '0')}:00`,
    value: i + 12,
  }));

  const snapOptions = SNAP_OPTIONS.map((v) => ({ label: `${v} min`, value: v }));
  const slotOptions = SLOT_OPTIONS.map((v) => ({ label: `${v} min`, value: v }));

  return (
    <div
      className="absolute right-4 top-full mt-1 w-64 rounded-lg z-50 p-4"
      style={{
        backgroundColor: token('elevation.surface.overlay'),
        border: `1px solid ${token('color.border')}`,
        boxShadow: token('elevation.shadow.overlay'),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: token('color.text') }}>Settings</h3>
        <IconButton
          icon={CrossIcon}
          label="Close settings"
          onClick={onClose}
          appearance="subtle"
          spacing="compact"
        />
      </div>

      <div className="space-y-3">
        {/* Snap granularity */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs flex-shrink-0" style={{ color: token('color.text.subtle') }}>Snap to</label>
          <div style={{ width: 120 }}>
            <Select
              options={snapOptions}
              value={snapOptions.find((o) => o.value === settings.snapMinutes)}
              onChange={(opt: { label: string; value: number } | null) => opt && handleChange('snapMinutes', opt.value)}
              spacing="compact"
              menuPlacement="auto"
            />
          </div>
        </div>

        {/* Start hour */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs flex-shrink-0" style={{ color: token('color.text.subtle') }}>Start hour</label>
          <div style={{ width: 120 }}>
            <Select
              options={startHourOptions}
              value={startHourOptions.find((o) => o.value === settings.startHour)}
              onChange={(opt: { label: string; value: number } | null) => opt && handleChange('startHour', opt.value)}
              spacing="compact"
              menuPlacement="auto"
            />
          </div>
        </div>

        {/* End hour */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs flex-shrink-0" style={{ color: token('color.text.subtle') }}>End hour</label>
          <div style={{ width: 120 }}>
            <Select
              options={endHourOptions}
              value={endHourOptions.find((o) => o.value === settings.endHour)}
              onChange={(opt: { label: string; value: number } | null) => opt && handleChange('endHour', opt.value)}
              spacing="compact"
              menuPlacement="auto"
            />
          </div>
        </div>

        {/* Slot display size */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs flex-shrink-0" style={{ color: token('color.text.subtle') }}>Slot size</label>
          <div style={{ width: 120 }}>
            <Select
              options={slotOptions}
              value={slotOptions.find((o) => o.value === settings.slotMinutes)}
              onChange={(opt: { label: string; value: number } | null) => opt && handleChange('slotMinutes', opt.value)}
              spacing="compact"
              menuPlacement="auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
