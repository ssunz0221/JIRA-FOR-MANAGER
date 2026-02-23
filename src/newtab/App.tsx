import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { SyncStatusBar } from '@/components/dashboard/SyncStatusBar';
import { StatsSummaryCard } from '@/components/dashboard/StatsSummaryCard';
import { ProjectSelector } from '@/components/dashboard/ProjectSelector';
import { ProjectProgressChart } from '@/components/dashboard/ProjectProgressChart';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { EpicDetailModal } from '@/components/dashboard/EpicDetailModal';
import { MemberRankingTable } from '@/components/dashboard/MemberRankingTable';
import { TeamEfficiencyChart } from '@/components/dashboard/TeamEfficiencyChart';
import { WorkerRankingTable } from '@/components/dashboard/WorkerRankingTable';
import { TeamManager } from '@/components/team/TeamManager';
import { MemberManager } from '@/components/team/MemberManager';
import { UnmappedWorkerList } from '@/components/team/UnmappedWorkerList';
import { useMetrics, type DateRange } from '@/hooks/useMetrics';
import { useChromeStorage } from '@/hooks/useChromeStorage';
import { db } from '@/db/database';
import clsx from 'clsx';

type Tab = 'dashboard' | 'team';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const [epicModal, setEpicModal] = useState<{ epicKey: string; epicName: string } | null>(null);

  const { config } = useChromeStorage();
  const { projectMetrics, workerMetrics, memberMetrics, teamMetrics, summary, isLoading } =
    useMetrics(dateRange);

  // 에픽 모달용: dateRange 필터 없이 해당 에픽의 전체 이슈
  const epicUnits = useLiveQuery<import('@/db/models/Unit').Unit[]>(
    async () => {
      if (!epicModal) return [];
      return db.units.where('projectKey').equals(epicModal.epicKey).toArray();
    },
    [epicModal?.epicKey],
  ) ?? [];

  const filteredProjectMetrics = selectedProjectKey
    ? projectMetrics.filter((p) => p.projectKey === selectedProjectKey)
    : projectMetrics;

  const tabClass = (tab: Tab) =>
    clsx(
      'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
      activeTab === tab
        ? 'border-jira-blue text-jira-blue'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
    );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-center justify-between py-4">
              <h1 className="text-xl font-bold text-jira-dark">JIRA PMS Dashboard</h1>
            </div>
            {/* Tabs */}
            <nav className="-mb-px flex gap-4">
              <button className={tabClass('dashboard')} onClick={() => setActiveTab('dashboard')}>
                대시보드
              </button>
              <button className={tabClass('team')} onClick={() => setActiveTab('team')}>
                구성원 관리
              </button>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
          {/* Sync Status (공통) */}
          <SyncStatusBar />

          {activeTab === 'dashboard' && (
            <>
              {/* 기간 필터 */}
              <DateRangeFilter value={dateRange} onChange={setDateRange} />

              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatsSummaryCard title="전체 프로젝트" value={summary.totalProjects} />
                    <StatsSummaryCard title="전체 이슈" value={summary.totalIssues} />
                    <StatsSummaryCard
                      title="평균 OTDR"
                      value={`${(summary.avgOtdr * 100).toFixed(1)}%`}
                      subtitle="마감일 준수율"
                    />
                    <StatsSummaryCard
                      title="평균 AOD"
                      value={`${summary.avgAod.toFixed(1)}일`}
                      subtitle="평균 지연 일수"
                    />
                  </div>

                  {/* Team Efficiency Chart */}
                  {teamMetrics.length > 0 && (
                    <section className="rounded-lg border border-gray-200 bg-white p-6">
                      <h2 className="mb-4 text-lg font-semibold text-gray-800">팀별 효율성</h2>
                      <TeamEfficiencyChart data={teamMetrics} />
                    </section>
                  )}

                  {/* Project Filter */}
                  <ProjectSelector
                    projects={projectMetrics}
                    selectedKey={selectedProjectKey}
                    onSelect={setSelectedProjectKey}
                  />

                  {/* Project Progress Chart */}
                  <section className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">프로젝트 진행률</h2>
                    <ProjectProgressChart
                      data={filteredProjectMetrics}
                      onEpicClick={(key, name) => setEpicModal({ epicKey: key, epicName: name })}
                    />
                  </section>

                  {/* Member/Worker Ranking */}
                  <section className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                      {memberMetrics.length > 0 ? '구성원 효율성 랭킹' : '작업자 효율성 랭킹'}
                    </h2>
                    {memberMetrics.length > 0 ? (
                      <MemberRankingTable data={memberMetrics} />
                    ) : (
                      <WorkerRankingTable data={workerMetrics} />
                    )}
                  </section>
                </>
              )}
            </>
          )}

          {activeTab === 'team' && (
            <div className="space-y-8">
              {/* 미매핑 작업자 알림 */}
              <section className="rounded-lg border border-gray-200 bg-white p-6">
                <UnmappedWorkerList />
              </section>

              {/* 팀 관리 */}
              <section className="rounded-lg border border-gray-200 bg-white p-6">
                <TeamManager />
              </section>

              {/* 구성원 관리 */}
              <section className="rounded-lg border border-gray-200 bg-white p-6">
                <MemberManager />
              </section>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-6 py-3 text-center text-xs text-gray-400">
          JIRA PMS Dashboard v1.0.0
        </footer>
      </div>

      {/* 에픽 상세 모달 */}
      {epicModal && (
        <EpicDetailModal
          epicKey={epicModal.epicKey}
          epicName={epicModal.epicName}
          units={epicUnits}
          baseUrl={config?.baseUrl ?? ''}
          onClose={() => setEpicModal(null)}
        />
      )}
    </ErrorBoundary>
  );
}
