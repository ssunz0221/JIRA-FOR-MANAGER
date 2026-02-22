import type { Unit } from '@/db/models/Unit';
import type { Member } from '@/db/models/Member';
import type { Team } from '@/db/models/Team';
import type { MemberMetricResult, TeamMetricResult } from '../types';
import { EfficiencyCalculator } from '../strategies/EfficiencyCalculator';
import { DueDateStrategy } from '../strategies/DueDateStrategy';

const calculator = new EfficiencyCalculator(new DueDateStrategy());

export class TeamMetrics {
  /**
   * 모든 구성원에 대한 효율성 메트릭을 계산한다.
   * JIRA assigneeId가 매핑된 구성원만 이슈를 집계한다.
   */
  computeMembers(members: Member[], teams: Team[], allUnits: Unit[]): MemberMetricResult[] {
    const teamMap = new Map(teams.map((t) => [t.id!, t.name]));

    const results: MemberMetricResult[] = members
      .filter((m) => m.jiraAccountId) // JIRA 연결된 구성원만
      .map((member) => {
        const assignedUnits = allUnits.filter((u) => u.assigneeId === member.jiraAccountId);
        const efficiency = calculator.calculate(assignedUnits);

        return {
          email: member.email,
          nickname: member.nickname,
          teamId: member.teamId,
          teamName: member.teamId ? teamMap.get(member.teamId) : undefined,
          totalAssigned: assignedUnits.length,
          totalResolved: efficiency.totalResolved,
          otdr: efficiency.otdr,
          aod: efficiency.aod,
        };
      });

    // OTDR 내림차순, 동률 시 AOD 오름차순
    results.sort((a, b) => {
      if (b.otdr !== a.otdr) return b.otdr - a.otdr;
      return a.aod - b.aod;
    });
    results.forEach((r, i) => { r.rank = i + 1; });

    return results;
  }

  /**
   * 팀별 효율성 집계를 계산한다.
   * 각 팀 소속 구성원의 이슈를 합산하여 팀 단위 OTDR/AOD를 산출한다.
   */
  computeTeams(teams: Team[], members: Member[], allUnits: Unit[]): TeamMetricResult[] {
    return teams.map((team) => {
      const teamMembers = members.filter((m) => m.teamId === team.id && m.jiraAccountId);
      const jiraIds = new Set(teamMembers.map((m) => m.jiraAccountId!));

      // 팀 소속 구성원에게 할당된 모든 이슈
      const teamUnits = allUnits.filter((u) => u.assigneeId && jiraIds.has(u.assigneeId));
      const efficiency = calculator.calculate(teamUnits);

      return {
        teamId: team.id!,
        teamName: team.name,
        memberCount: teamMembers.length,
        totalAssigned: teamUnits.length,
        totalResolved: efficiency.totalResolved,
        otdr: efficiency.otdr,
        aod: efficiency.aod,
      };
    });
  }
}
