'use client';

import { formatHours } from '@/lib/worklog-aggregator';

interface GrandTotalProps {
  columnTotals: number[];
  grandTotal: number;
}

export default function GrandTotal({ columnTotals, grandTotal }: GrandTotalProps) {
  return (
    <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
      <td className="px-3 py-2 text-sm text-gray-700">Daily Total</td>
      {columnTotals.map((total, i) => (
        <td key={i} className="px-3 py-2 text-center text-sm tabular-nums text-gray-900">
          {formatHours(total)}
        </td>
      ))}
      <td className="px-3 py-2 text-center text-sm font-bold text-gray-900 bg-gray-200 tabular-nums">
        {formatHours(grandTotal)}
      </td>
    </tr>
  );
}
