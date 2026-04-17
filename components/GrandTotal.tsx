'use client';

import { token } from '@atlaskit/tokens';
import { formatHours } from '@/lib/worklog-aggregator';

interface GrandTotalProps {
  columnTotals: number[];
  grandTotal: number;
}

export default function GrandTotal({ columnTotals, grandTotal }: GrandTotalProps) {
  return (
    <tr
      className="font-semibold"
      style={{
        backgroundColor: token('color.background.neutral'),
        borderTop: `2px solid ${token('color.border.bold')}`,
      }}
    >
      <td className="px-3 py-2 text-sm" style={{ color: token('color.text.subtle') }}>Daily Total</td>
      {columnTotals.map((total, i) => (
        <td key={i} className="px-3 py-2 text-center text-sm tabular-nums" style={{ color: token('color.text') }}>
          {formatHours(total)}
        </td>
      ))}
      <td
        className="px-3 py-2 text-center text-sm font-bold tabular-nums"
        style={{ color: token('color.text'), backgroundColor: token('color.background.neutral.hovered') }}
      >
        {formatHours(grandTotal)}
      </td>
    </tr>
  );
}
