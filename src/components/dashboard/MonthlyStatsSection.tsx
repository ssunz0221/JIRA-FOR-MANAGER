import { useState, useMemo } from 'react';
import type { Unit } from '@/db/models/Unit';
import type { MemberFilter } from './TeamMemberFilter';
import { useMonthlyStats } from '@/hooks/useMonthlyStats';
import { EstimationInfoBanner } from './EstimationInfoBanner';
import { MonthlyTotalChart, MonthlyTeamChart, MonthlyPersonChart } from './MonthlyChart';
import { MonthlyStatsTable } from './MonthlyStatsTable';
import clsx from 'clsx';

interface Props {
  filteredUnits: Unit[];
  memberFilter?: MemberFilter;
  estimationType?: 'storyPoint' | 'estimate';
}

export function MonthlyStatsSection({ filteredUnits, memberFilter, estimationType }: Props) {
  const { personStats, teamStats, totalStats, isLoading } = useMonthlyStats(
    filteredUnits,
    memberFilter,
  );
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  if (isLoading) return null;

  const hasData = personStats.length > 0 || teamStats.length > 0 || totalStats.length > 0;
  if (!hasData) return null;

  const estimationLabel = estimationType === 'storyPoint' ? 'SP' : estimationType === 'estimate' ? '추정치(h)' : 'SP';

  // 표시 모드 결정
  const isPersonFilter = !!memberFilter?.memberAccountId;
  const isTeamFilter = !!memberFilter?.teamId && !isPersonFilter;
  const isAllFilter = !isPersonFilter && !isTeamFilter;

  // 월 목록 추출 (정렬)
  const availableMonths = useMemo(() => {
    const months = new Set(personStats.map((s) => s.month));
    return Array.from(months).sort();
  }, [personStats]);

  // 선택된 월로 필터링
  const filteredPersonStats = useMemo(() => {
    if (!selectedMonth) return personStats;
    return personStats.filter((s) => s.month === selectedMonth);
  }, [personStats, selectedMonth]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">
          월별 통계
          {isPersonFilter && personStats[0] && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              - {personStats[0].displayName}
            </span>
          )}
          {isTeamFilter && teamStats[0] && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              - {teamStats[0].teamName}
            </span>
          )}
        </h2>
      </div>

      <div className="space-y-6 p-6">
        {/* 집계 규칙 안내 */}
        <EstimationInfoBanner estimationType={estimationType} />

        {/* 전체 필터: 전체 총합 차트 */}
        {isAllFilter && totalStats.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">전체 월별 추이</h3>
            <MonthlyTotalChart data={totalStats} estimationLabel={estimationLabel} />
          </div>
        )}

        {/* 전체 필터: 팀별 차트 */}
        {isAllFilter && teamStats.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">팀별 월별 추이</h3>
            <MonthlyTeamChart data={teamStats} estimationLabel={estimationLabel} />
          </div>
        )}

        {/* 팀 필터: 팀 총합 차트 */}
        {isTeamFilter && teamStats.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">팀 월별 추이</h3>
            <MonthlyTeamChart data={teamStats} estimationLabel={estimationLabel} />
          </div>
        )}

        {/* 개인 필터: 개인 차트 */}
        {isPersonFilter && personStats.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">개인 월별 추이</h3>
            <MonthlyPersonChart data={personStats} estimationLabel={estimationLabel} />
          </div>
        )}

        {/* 인원별 테이블 (월 선택 탭 포함) */}
        {personStats.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-sm font-semibold text-gray-700">인원별 상세</h3>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedMonth(null)}
                  className={clsx(
                    'rounded px-2 py-1 text-xs font-medium transition-colors',
                    !selectedMonth
                      ? 'bg-jira-blue text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  전체
                </button>
                {availableMonths.map((month) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={clsx(
                      'rounded px-2 py-1 text-xs font-medium transition-colors',
                      selectedMonth === month
                        ? 'bg-jira-blue text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
            <MonthlyStatsTable data={filteredPersonStats} estimationLabel={estimationLabel} />
          </div>
        )}
      </div>
    </section>
  );
}
