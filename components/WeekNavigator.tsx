'use client';

import { getWeekLabel } from '@/lib/date-utils';
import type { WeekRange } from '@/types/timesheet';

interface WeekNavigatorProps {
  weekRange: WeekRange;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function WeekNavigator({ weekRange, onPrevious, onNext, onToday }: WeekNavigatorProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          ← Prev
        </button>
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          This Week
        </button>
        <button
          onClick={onNext}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Next →
        </button>
      </div>
      <h2 className="text-lg font-semibold text-gray-800">
        {getWeekLabel(weekRange.start, weekRange.end)}
      </h2>
    </div>
  );
}
