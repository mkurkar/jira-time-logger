'use client';

import Button, { IconButton } from '@atlaskit/button/new';
import ChevronLeftIcon from '@atlaskit/icon/core/chevron-left';
import ChevronRightIcon from '@atlaskit/icon/core/chevron-right';
import { token } from '@atlaskit/tokens';
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
        <IconButton
          icon={ChevronLeftIcon}
          label="Previous week"
          onClick={onPrevious}
          appearance="subtle"
        />
        <Button
          onClick={onToday}
          appearance="primary"
        >
          This Week
        </Button>
        <IconButton
          icon={ChevronRightIcon}
          label="Next week"
          onClick={onNext}
          appearance="subtle"
        />
      </div>
      <h2 className="text-lg font-semibold" style={{ color: token('color.text') }}>
        {getWeekLabel(weekRange.start, weekRange.end)}
      </h2>
    </div>
  );
}
