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

const projectMetricsCalc = new ProjectMetrics();
const workerMetricsCalc = new WorkerMetrics();
const teamMetricsCalc = new TeamMetrics();

export interface DateRange {
  start: string;
  end: string;
}

export function useMetrics(dateRange?: DateRange) {
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

  // 기간 필터링: 이슈의 [startDate, effectiveEndDate] 구간과 선택 기간의 겹침 검사
  // - 이슈 시작: customfield_10917 (startDate)
  // - 이슈 종료: dueDate 우선, 없으면 customfield_10918 (endDate) 대체
  // - 종료일(rangeEnd) 미입력 시 오늘(KST)을 상한으로 사용
  // - 이슈에 날짜가 전혀 없으면 항상 포함 (무기한 작업)
  const filteredUnits = useMemo(() => {
    if (!units) return [];
    if (!dateRange?.start && !dateRange?.end) return units;
    const rangeEnd = dateRange?.end || nowKst().slice(0, 10);
    const rangeStart = dateRange?.start || '';
    return units.filter((u) => {
      const issueStart = u.startDate;
      const issueEnd = u.dueDate ?? u.endDate;
      // 날짜 정보가 전혀 없으면 항상 포함
      if (!issueStart && !issueEnd) return true;
      // rangeStart가 지정된 경우: issueEnd < rangeStart 이면 제외
      if (rangeStart && issueEnd && issueEnd < rangeStart) return false;
      // rangeEnd는 항상 존재 (미입력 시 오늘): issueStart > rangeEnd 이면 제외
      if (issueStart && issueStart > rangeEnd) return false;
      return true;
    });
  }, [units, dateRange]);

  const projectMetrics: ProjectMetricResult[] = useMemo(() => {
    if (!projects || !filteredUnits) return [];
    return projects.map((p) =>
      projectMetricsCalc.compute(p, filteredUnits.filter((u) => u.projectKey === p.jiraKey)),
    );
  }, [projects, filteredUnits]);

  // JIRA Worker 기준 메트릭 (하위호환)
  const workerMetrics: WorkerMetricResult[] = useMemo(() => {
    if (!workers || !filteredUnits) return [];
    return workerMetricsCalc.computeAll(workers, filteredUnits);
  }, [workers, filteredUnits]);

  // 구성원(Member) 기준 메트릭 (팀 포함)
  const memberMetrics: MemberMetricResult[] = useMemo(() => {
    if (!members || !teams || !filteredUnits) return [];
    return teamMetricsCalc.computeMembers(members, teams, filteredUnits);
  }, [members, teams, filteredUnits]);

  // 팀별 집계 메트릭
  const teamMetrics: TeamMetricResult[] = useMemo(() => {
    if (!teams || !members || !filteredUnits) return [];
    return teamMetricsCalc.computeTeams(teams, members, filteredUnits);
  }, [teams, members, filteredUnits]);

  // 전체 요약 통계 (구성원 기준으로 변경)
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
  };
}
