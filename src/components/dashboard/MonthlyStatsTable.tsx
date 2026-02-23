import type { MonthlyPersonStat } from '@/business/types';

interface Props {
  data: MonthlyPersonStat[];
  estimationLabel: string;
}

export function MonthlyStatsTable({ data, estimationLabel }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-400">
        월별 통계 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 font-semibold text-gray-600">월</th>
            <th className="px-4 py-3 font-semibold text-gray-600">이름</th>
            <th className="px-4 py-3 font-semibold text-gray-600">팀</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">처리건수</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">{estimationLabel}</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">OTDR (%)</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">AOD (일)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={`${row.month}-${row.accountId}`}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="px-4 py-3 text-gray-600">{row.month}</td>
              <td className="px-4 py-3 text-gray-800">{row.displayName}</td>
              <td className="px-4 py-3 text-gray-600">{row.teamName ?? '-'}</td>
              <td className="px-4 py-3 text-right text-gray-600">{row.completedCount}</td>
              <td className="px-4 py-3 text-right text-gray-600">
                {row.estimationTotal > 0 ? row.estimationTotal.toFixed(1) : '-'}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`font-medium ${
                    row.otdr >= 0.8
                      ? 'text-green-600'
                      : row.otdr >= 0.5
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {(row.otdr * 100).toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`font-medium ${
                    row.aod <= 1
                      ? 'text-green-600'
                      : row.aod <= 3
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {row.aod.toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
