import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { ProjectMetrics } from '@/business/metrics/ProjectMetrics';
import { WorkerMetrics } from '@/business/metrics/WorkerMetrics';
import { TeamMetrics } from '@/business/metrics/TeamMetrics';
import type {
  ProjectMetricResult,
  WorkerMetricResult,
  MemberMetricResult,
  TeamMetricResult,
} from '@/business/types';

const projectMetricsCalc = new ProjectMetrics();
const workerMetricsCalc = new WorkerMetrics();
const teamMetricsCalc = new TeamMetrics();

export function useMetrics() {
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

  const projectMetrics: ProjectMetricResult[] = useMemo(() => {
    if (!projects || !units) return [];
    return projects.map((p) =>
      projectMetricsCalc.compute(p, units.filter((u) => u.projectKey === p.jiraKey)),
    );
  }, [projects, units]);

  // JIRA Worker 기준 메트릭 (하위호환)
  const workerMetrics: WorkerMetricResult[] = useMemo(() => {
    if (!workers || !units) return [];
    return workerMetricsCalc.computeAll(workers, units);
  }, [workers, units]);

  // 구성원(Member) 기준 메트릭 (팀 포함)
  const memberMetrics: MemberMetricResult[] = useMemo(() => {
    if (!members || !teams || !units) return [];
    return teamMetricsCalc.computeMembers(members, teams, units);
  }, [members, teams, units]);

  // 팀별 집계 메트릭
  const teamMetrics: TeamMetricResult[] = useMemo(() => {
    if (!teams || !members || !units) return [];
    return teamMetricsCalc.computeTeams(teams, members, units);
  }, [teams, members, units]);

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
