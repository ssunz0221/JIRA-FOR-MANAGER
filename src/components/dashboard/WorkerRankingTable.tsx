import type { WorkerMetricResult } from '@/business/types';

interface Props {
  data: WorkerMetricResult[];
}

export function WorkerRankingTable({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-400">
        작업자 데이터가 없습니다. 동기화를 먼저 실행해주세요.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 font-semibold text-gray-600">순위</th>
            <th className="px-4 py-3 font-semibold text-gray-600">이름</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">할당</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">완료</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">OTDR (%)</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">AOD (일)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((worker) => (
            <tr key={worker.accountId} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{worker.rank}</td>
              <td className="px-4 py-3 text-gray-800">{worker.displayName}</td>
              <td className="px-4 py-3 text-right text-gray-600">{worker.totalAssigned}</td>
              <td className="px-4 py-3 text-right text-gray-600">{worker.totalResolved}</td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`font-medium ${
                    worker.otdr >= 0.8
                      ? 'text-green-600'
                      : worker.otdr >= 0.5
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {(worker.otdr * 100).toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`font-medium ${
                    worker.aod <= 1
                      ? 'text-green-600'
                      : worker.aod <= 3
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {worker.aod.toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
