'use client';

import { IconButton } from '@atlaskit/button/new';
import CrossIcon from '@atlaskit/icon/core/cross';
import DayCell from '@/components/DayCell';
import { formatHours } from '@/lib/worklog-aggregator';
import type { GridRow, GridCell, CellMutationState } from '@/types/timesheet';

interface TimesheetRowProps {
  row: GridRow;
  onRemove: (issueKey: string) => void;
  onSaveCell: (cell: GridCell, newHours: number) => void;
  getCellState: (issueKey: string, date: Date) => CellMutationState;
}

export default function TimesheetRow({ row, onRemove, onSaveCell, getCellState }: TimesheetRowProps) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* Issue info */}
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div>
            <span className="text-sm font-medium text-blue-600">{row.issue.key}</span>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">
              {row.issue.fields.summary}
            </p>
          </div>
          <IconButton
            icon={CrossIcon}
            label="Remove issue"
            onClick={() => onRemove(row.issue.key)}
            appearance="subtle"
            spacing="compact"
          />
        </div>
      </td>
      
      {/* 7 editable day cells */}
      {row.cells.map((cell, i) => (
        <DayCell
          key={i}
          cell={cell}
          mutationState={getCellState(cell.issueKey, cell.date)}
          onSave={onSaveCell}
        />
      ))}
      
      {/* Row total */}
      <td className="px-3 py-2 text-center text-sm font-semibold text-gray-900 bg-gray-50 tabular-nums">
        {formatHours(row.totalHours)}
      </td>
    </tr>
  );
}
