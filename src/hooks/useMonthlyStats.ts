import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { calculateMonthlyStats, type MonthlyStatsResult } from '@/business/metrics/MonthlyStatsCalculator';
import type { Unit } from '@/db/models/Unit';
import type { MemberFilter } from '@/components/dashboard/TeamMemberFilter';

export function useMonthlyStats(
  filteredUnits: Unit[],
  memberFilter?: MemberFilter,
): MonthlyStatsResult & { isLoading: boolean } {
  const members = useLiveQuery(() => db.members.toArray());
  const teams = useLiveQuery(() => db.teams.toArray());

  const isLoading = members === undefined || teams === undefined;

  const result = useMemo(() => {
    if (!members || !teams) {
      return { personStats: [], teamStats: [], totalStats: [] };
    }
    return calculateMonthlyStats(filteredUnits, members, teams);
  }, [filteredUnits, members, teams]);

  // memberFilter에 따라 표시할 데이터를 필터링
  const filtered = useMemo(() => {
    if (!memberFilter?.teamId && !memberFilter?.memberAccountId) {
      return result;
    }

    if (memberFilter.memberAccountId) {
      return {
        personStats: result.personStats.filter(
          (s) => s.accountId === memberFilter.memberAccountId,
        ),
        teamStats: [],
        totalStats: [],
      };
    }

    // 팀 필터
    return {
      personStats: result.personStats.filter(
        (s) => s.teamId === memberFilter.teamId,
      ),
      teamStats: result.teamStats.filter(
        (s) => s.teamId === memberFilter.teamId,
      ),
      totalStats: [],
    };
  }, [result, memberFilter]);

  return { ...filtered, isLoading };
}
