import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { ProjectMetrics } from '@/business/metrics/ProjectMetrics';
import { WorkerMetrics } from '@/business/metrics/WorkerMetrics';
import { TeamMetrics } from '@/business/metrics/TeamMetrics';
import { nowKst } from '@/utils/kst';
import type {
  ProjectMetricResult,
  WorkerMetricResult,
  MemberMetricResult,
  TeamMetricResult,
} from '@/business/types';
import type { MemberFilter } from '@/components/dashboard/TeamMemberFilter';

const projectMetricsCalc = new ProjectMetrics();
const workerMetricsCalc = new WorkerMetrics();
const teamMetricsCalc = new TeamMetrics();

export interface DateRange {
  start: string;
  end: string;
}

export function useMetrics(dateRange?: DateRange, memberFilter?: MemberFilter) {
  const projects = useLiveQuery(() => db.projects.toArray());
  const units = useLiveQuery(() => db.units.toArray());
  const workers = useLiveQuery(() => db.workers.toArray());
  const members = useLiveQuery(() => db.members.toArray());
  const teams = useLiveQuery(() => db.teams.toArray());

  const isLoading =
    projects === undefined ||
    units === undefined ||
    workers === undefined ||
    members === undefined ||
    teams === undefined;

  // 제외 처리된 작업자의 accountId 집합
  const excludedWorkerIds = useMemo(() => {
    if (!workers) return new Set<string>();
    return new Set(workers.filter((w) => w.excluded).map((w) => w.accountId));
  }, [workers]);

  // 제외된 작업자의 이슈를 먼저 필터링
  const activeUnits = useMemo(() => {
    if (!units) return [];
    if (excludedWorkerIds.size === 0) return units;
    return units.filter((u) => !u.assigneeId || !excludedWorkerIds.has(u.assigneeId));
  }, [units, excludedWorkerIds]);

  // 기간 필터링: 이슈의 날짜(startDate, endDate, dueDate) 범위가 선택 기간과 겹치는지 검사
  // - 이슈에 날짜(startDate/endDate/dueDate)가 하나도 없으면 필터 활성화 시 제외
  // - 종료일(rangeEnd) 미입력 시 오늘(KST)을 상한으로 사용
  const filteredUnits = useMemo(() => {
    if (!dateRange?.start && !dateRange?.end) return activeUnits;

    const rangeStart = dateRange?.start || '';
    const rangeEnd = dateRange?.end || nowKst().slice(0, 10);

    return activeUnits.filter((u) => {
      // 이슈가 가진 모든 날짜를 수집
      const dates = [u.startDate, u.endDate, u.dueDate].filter(Boolean) as string[];

      // 날짜가 전혀 없는 이슈는 필터 활성화 시 제외
      if (dates.length === 0) return false;

      // 이슈의 날짜 범위: [가장 이른 날짜, 가장 늦은 날짜]
      const issueMin = dates.reduce((a, b) => (a < b ? a : b));
      const issueMax = dates.reduce((a, b) => (a > b ? a : b));

      // 구간 겹침 검사: issueMax >= rangeStart && issueMin <= rangeEnd
      if (rangeStart && issueMax < rangeStart) return false;
      if (issueMin > rangeEnd) return false;

      return true;
    });
  }, [activeUnits, dateRange]);

  // 구성원/팀 필터링:
  // - memberAccountId 지정 → 해당 assigneeId 이슈만
  // - teamId만 지정 → 해당 팀 전체 구성원의 accountId 집합으로 필터
  // - 서브태스크 규칙: 서브태스크가 매칭되면 부모 이슈도 포함
  const memberFilteredUnits = useMemo(() => {
    if (!memberFilter?.teamId && !memberFilter?.memberAccountId) return filteredUnits;

    let targetAccountIds: Set<string>;

    if (memberFilter.memberAccountId) {
      targetAccountIds = new Set([memberFilter.memberAccountId]);
    } else {
      // teamId만 지정: 해당 팀 구성원의 jiraAccountId 집합
      const teamMembers = members?.filter(
        (m) => m.teamId === memberFilter.teamId && m.jiraAccountId,
      ) ?? [];
      targetAccountIds = new Set(teamMembers.map((m) => m.jiraAccountId!));
    }

    if (targetAccountIds.size === 0) return filteredUnits;

    // 1차: 직접 매칭되는 이슈 찾기
    const directMatched = filteredUnits.filter(
      (u) => u.assigneeId && targetAccountIds.has(u.assigneeId),
    );

    // 2차: 매칭된 서브태스크의 부모 키 수집
    const matchedParentKeys = new Set<string>();
    for (const u of directMatched) {
      if (u.isSubtask && u.parentKey) {
        matchedParentKeys.add(u.parentKey);
      }
    }

    // 3차: 직접 매칭 + 부모 이슈 포함
    if (matchedParentKeys.size === 0) return directMatched;

    const directMatchedKeys = new Set(directMatched.map((u) => u.jiraKey));
    const parentUnits = filteredUnits.filter(
      (u) => matchedParentKeys.has(u.jiraKey) && !directMatchedKeys.has(u.jiraKey),
    );

    return [...directMatched, ...parentUnits];
  }, [filteredUnits, memberFilter, members]);

  const projectMetrics: ProjectMetricResult[] = useMemo(() => {
    if (!projects) return [];
    const all = projects.map((p) =>
      projectMetricsCalc.compute(p, memberFilteredUnits.filter((u) => u.projectKey === p.jiraKey)),
    );
    // 기간 필터 또는 구성원 필터가 활성화된 경우 해당 기간에 티켓이 없는 프로젝트 제외
    if (dateRange?.start || dateRange?.end || memberFilter?.teamId || memberFilter?.memberAccountId) {
      return all.filter((p) => p.totalIssues > 0);
    }
    return all;
  }, [projects, memberFilteredUnits, dateRange, memberFilter]);

  // JIRA Worker 기준 메트릭 (제외된 작업자는 이미 activeUnits에서 빠짐)
  const activeWorkers = useMemo(() => {
    if (!workers) return [];
    return workers.filter((w) => !w.excluded);
  }, [workers]);

  const workerMetrics: WorkerMetricResult[] = useMemo(() => {
    if (!activeWorkers.length || !memberFilteredUnits) return [];
    return workerMetricsCalc.computeAll(activeWorkers, memberFilteredUnits);
  }, [activeWorkers, memberFilteredUnits]);

  // 구성원(Member) 기준 메트릭 (팀 포함)
  const memberMetrics: MemberMetricResult[] = useMemo(() => {
    if (!members || !teams) return [];
    return teamMetricsCalc.computeMembers(members, teams, memberFilteredUnits);
  }, [members, teams, memberFilteredUnits]);

  // 팀별 집계 메트릭
  const teamMetrics: TeamMetricResult[] = useMemo(() => {
    if (!teams || !members) return [];
    return teamMetricsCalc.computeTeams(teams, members, memberFilteredUnits);
  }, [teams, members, memberFilteredUnits]);

  // 전체 요약 통계
  const summary = useMemo(() => {
    const totalProjects = projectMetrics.length;
    const totalIssues = projectMetrics.reduce((sum, p) => sum + p.totalIssues, 0);
    const metricsSource = memberMetrics.length > 0 ? memberMetrics : workerMetrics;
    const avgOtdr =
      metricsSource.length > 0
        ? metricsSource.reduce((sum, w) => sum + w.otdr, 0) / metricsSource.length
        : 0;
    const avgAod =
      metricsSource.length > 0
        ? metricsSource.reduce((sum, w) => sum + w.aod, 0) / metricsSource.length
        : 0;

    return { totalProjects, totalIssues, avgOtdr, avgAod };
  }, [projectMetrics, memberMetrics, workerMetrics]);

  return {
    projectMetrics,
    workerMetrics,
    memberMetrics,
    teamMetrics,
    summary,
    isLoading,
    filteredUnits: memberFilteredUnits,
  };
}
