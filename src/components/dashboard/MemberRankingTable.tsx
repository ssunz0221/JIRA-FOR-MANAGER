import type { MemberMetricResult } from '@/business/types';

interface Props {
  data: MemberMetricResult[];
}

export function MemberRankingTable({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-400">
        구성원 데이터가 없습니다. 구성원을 등록하고 JIRA 계정을 매핑해주세요.
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
            <th className="px-4 py-3 font-semibold text-gray-600">팀</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">할당</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">완료</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">OTDR (%)</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">AOD (일)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((member) => (
            <tr key={member.email} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{member.rank}</td>
              <td className="px-4 py-3 text-gray-800">{member.nickname}</td>
              <td className="px-4 py-3 text-gray-600">{member.teamName ?? '-'}</td>
              <td className="px-4 py-3 text-right text-gray-600">{member.totalAssigned}</td>
              <td className="px-4 py-3 text-right text-gray-600">{member.totalResolved}</td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`font-medium ${
                    member.otdr >= 0.8
                      ? 'text-green-600'
                      : member.otdr >= 0.5
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {(member.otdr * 100).toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`font-medium ${
                    member.aod <= 1
                      ? 'text-green-600'
                      : member.aod <= 3
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {member.aod.toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
