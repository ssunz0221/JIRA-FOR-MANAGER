import type { Unit } from '@/db/models/Unit';
import type { Member } from '@/db/models/Member';
import type { Team } from '@/db/models/Team';
import type { MonthlyPersonStat, MonthlyTeamStat, MonthlyTotalStat } from '../types';
import { computePersonEstimations, computePersonCompletedCounts } from '../estimation/EstimationAggregator';
import { EfficiencyCalculator } from '../strategies/EfficiencyCalculator';
import { DueDateStrategy } from '../strategies/DueDateStrategy';

const calculator = new EfficiencyCalculator(new DueDateStrategy());

/** endDate의 YYYY-MM을 반환 */
function getMonth(endDate: string): string {
  return endDate.slice(0, 7); // "YYYY-MM"
}

/** Unit 목록을 endDate 기준 월별로 그룹화 */
function groupByMonth(units: Unit[]): Map<string, Unit[]> {
  const map = new Map<string, Unit[]>();
  for (const unit of units) {
    if (!unit.endDate) continue;
    const month = getMonth(unit.endDate);
    const list = map.get(month) ?? [];
    list.push(unit);
    map.set(month, list);
  }
  return map;
}

/** Unit 목록을 assigneeId 기준으로 그룹화 */
function groupByAssignee(units: Unit[]): Map<string, Unit[]> {
  const map = new Map<string, Unit[]>();
  for (const unit of units) {
    if (!unit.assigneeId) continue;
    const list = map.get(unit.assigneeId) ?? [];
    list.push(unit);
    map.set(unit.assigneeId, list);
  }
  return map;
}

export interface MonthlyStatsResult {
  personStats: MonthlyPersonStat[];
  teamStats: MonthlyTeamStat[];
  totalStats: MonthlyTotalStat[];
}

/**
 * 월별 통계를 계산한다.
 *
 * 계산 흐름:
 * 1. 완료(done + endDate)된 이슈를 월별로 그룹화
 * 2. 각 월에 대해 개인별 처리건수/estimation/OTDR/AOD 계산
 * 3. 개인별 통계를 팀별/전체로 집계
 */
export function calculateMonthlyStats(
  units: Unit[],
  members: Member[],
  teams: Team[],
): MonthlyStatsResult {
  // 완료 이슈만 대상
  const completedUnits = units.filter((u) => u.statusCategory === 'done' && u.endDate);

  // member 매핑: jiraAccountId → member info
  const memberMap = new Map(
    members
      .filter((m) => m.jiraAccountId)
      .map((m) => [m.jiraAccountId!, m]),
  );

  // team 매핑: teamId → team info
  const teamMap = new Map(teams.map((t) => [t.id!, t]));

  // 월별 그룹화
  const monthGroups = groupByMonth(completedUnits);

  const personStats: MonthlyPersonStat[] = [];
  const teamStatsMap = new Map<string, MonthlyTeamStat>(); // key: "month-teamId"
  const totalStatsMap = new Map<string, MonthlyTotalStat>(); // key: month

  // 각 월별 계산
  const sortedMonths = Array.from(monthGroups.keys()).sort();

  for (const month of sortedMonths) {
    const monthUnits = monthGroups.get(month) ?? [];

    // 개인별 처리건수 (중복제거)
    const personCounts = computePersonCompletedCounts(monthUnits);

    // 개인별 estimation
    const personEstimations = computePersonEstimations(monthUnits);

    // 개인별 OTDR/AOD - assignee 기준 그룹화
    const byAssignee = groupByAssignee(monthUnits);

    // 고유 accountId 수집
    const allAccountIds = new Set([
      ...personCounts.keys(),
      ...personEstimations.keys(),
      ...byAssignee.keys(),
    ]);

    // 월별 전체 집계 초기화
    let monthTotalCompleted = 0;
    let monthTotalEstimation = 0;

    for (const accountId of allAccountIds) {
      const completedCount = personCounts.get(accountId) ?? 0;
      const estimationTotal = personEstimations.get(accountId) ?? 0;

      // OTDR/AOD 계산
      const assigneeUnits = byAssignee.get(accountId) ?? [];
      const efficiency = calculator.calculate(assigneeUnits);

      // displayName 조회: member → unit의 assigneeName fallback
      const member = memberMap.get(accountId);
      const displayName =
        member?.nickname ??
        assigneeUnits[0]?.assigneeName ??
        accountId;
      const teamId = member?.teamId;
      const team = teamId ? teamMap.get(teamId) : undefined;

      const stat: MonthlyPersonStat = {
        month,
        accountId,
        displayName,
        teamId,
        teamName: team?.name,
        completedCount,
        estimationTotal,
        otdr: efficiency.otdr,
        aod: efficiency.aod,
      };

      personStats.push(stat);
      monthTotalCompleted += completedCount;
      monthTotalEstimation += estimationTotal;

      // 팀별 집계
      if (teamId && team) {
        const teamKey = `${month}-${teamId}`;
        const existing = teamStatsMap.get(teamKey);
        if (existing) {
          existing.completedCount += completedCount;
          existing.estimationTotal += estimationTotal;
        } else {
          teamStatsMap.set(teamKey, {
            month,
            teamId,
            teamName: team.name,
            completedCount,
            estimationTotal,
            otdr: 0, // 나중에 재계산
            aod: 0,
          });
        }
      }
    }

    // 월별 전체 통계
    const monthEfficiency = calculator.calculate(monthUnits);
    totalStatsMap.set(month, {
      month,
      completedCount: monthTotalCompleted,
      estimationTotal: monthTotalEstimation,
      otdr: monthEfficiency.otdr,
      aod: monthEfficiency.aod,
    });
  }

  // 팀별 OTDR/AOD 재계산 (팀 소속 이슈 전체 기준)
  for (const [, teamStat] of teamStatsMap) {
    const teamMemberIds = members
      .filter((m) => m.teamId === teamStat.teamId && m.jiraAccountId)
      .map((m) => m.jiraAccountId!);

    const monthUnits = monthGroups.get(teamStat.month) ?? [];
    const teamUnits = monthUnits.filter((u) => u.assigneeId && teamMemberIds.includes(u.assigneeId));
    const eff = calculator.calculate(teamUnits);
    teamStat.otdr = eff.otdr;
    teamStat.aod = eff.aod;
  }

  return {
    personStats,
    teamStats: Array.from(teamStatsMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month) || a.teamId - b.teamId,
    ),
    totalStats: Array.from(totalStatsMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    ),
  };
}
