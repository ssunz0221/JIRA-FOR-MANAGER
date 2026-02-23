import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { calculateMonthlyStats } from '../MonthlyStatsCalculator';
import type { Unit } from '@/db/models/Unit';
import type { Member } from '@/db/models/Member';
import type { Team } from '@/db/models/Team';

// dayjs 플러그인 초기화 (EfficiencyCalculator에서 필요)
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

function makeUnit(overrides: Partial<Unit> & Pick<Unit, 'jiraKey'>): Unit {
  return {
    projectKey: 'EPIC-1',
    summary: 'test',
    status: 'Done',
    statusCategory: 'done',
    issueType: 'Task',
    createdAt: '2025-01-01T00:00:00.000+09:00',
    updatedAt: '2025-01-01T00:00:00.000+09:00',
    lastSyncedAt: '2025-01-01T00:00:00.000+09:00',
    ...overrides,
  };
}

const TEAM_A: Team = { id: 1, name: 'Team Alpha' };
const TEAM_B: Team = { id: 2, name: 'Team Beta' };

function makeMember(overrides: Partial<Member> & Pick<Member, 'email'>): Member {
  return {
    nickname: overrides.email.split('@')[0],
    ...overrides,
  };
}

describe('calculateMonthlyStats', () => {
  it('빈 배열이면 빈 결과를 반환한다', () => {
    const result = calculateMonthlyStats([], [], []);
    expect(result.personStats).toEqual([]);
    expect(result.teamStats).toEqual([]);
    expect(result.totalStats).toEqual([]);
  });

  it('미완료 이슈는 통계에 포함되지 않는다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', statusCategory: 'indeterminate', assigneeId: 'u1' }),
      makeUnit({ jiraKey: 'T-2', statusCategory: 'new', assigneeId: 'u2' }),
    ];
    const result = calculateMonthlyStats(units, [], []);
    expect(result.personStats).toEqual([]);
    expect(result.totalStats).toEqual([]);
  });

  it('완료 이슈를 endDate 기준 월별로 그룹한다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'u1' }),
      makeUnit({ jiraKey: 'T-2', statusCategory: 'done', endDate: '2025-01-20', assigneeId: 'u1' }),
      makeUnit({ jiraKey: 'T-3', statusCategory: 'done', endDate: '2025-02-05', assigneeId: 'u1' }),
    ];
    const result = calculateMonthlyStats(units, [], []);

    expect(result.totalStats).toHaveLength(2);
    expect(result.totalStats[0].month).toBe('2025-01');
    expect(result.totalStats[1].month).toBe('2025-02');
    expect(result.totalStats[0].completedCount).toBe(2);
    expect(result.totalStats[1].completedCount).toBe(1);
  });

  it('개인별 통계를 올바르게 계산한다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'u1', storyPoints: 3 }),
      makeUnit({ jiraKey: 'T-2', statusCategory: 'done', endDate: '2025-01-15', assigneeId: 'u2', storyPoints: 5 }),
    ];
    const members: Member[] = [
      makeMember({ email: 'alice@test.com', jiraAccountId: 'u1', nickname: 'Alice', teamId: 1 }),
      makeMember({ email: 'bob@test.com', jiraAccountId: 'u2', nickname: 'Bob', teamId: 1 }),
    ];
    const teams: Team[] = [TEAM_A];

    const result = calculateMonthlyStats(units, members, teams);

    expect(result.personStats).toHaveLength(2);
    const aliceStat = result.personStats.find((s) => s.accountId === 'u1');
    const bobStat = result.personStats.find((s) => s.accountId === 'u2');

    expect(aliceStat).toBeDefined();
    expect(aliceStat!.month).toBe('2025-01');
    expect(aliceStat!.displayName).toBe('Alice');
    expect(aliceStat!.completedCount).toBe(1);
    expect(aliceStat!.estimationTotal).toBe(3);
    expect(aliceStat!.teamName).toBe('Team Alpha');

    expect(bobStat!.completedCount).toBe(1);
    expect(bobStat!.estimationTotal).toBe(5);
  });

  it('팀별 통계를 집계한다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'u1', storyPoints: 3 }),
      makeUnit({ jiraKey: 'T-2', statusCategory: 'done', endDate: '2025-01-15', assigneeId: 'u2', storyPoints: 5 }),
      makeUnit({ jiraKey: 'T-3', statusCategory: 'done', endDate: '2025-01-20', assigneeId: 'u3', storyPoints: 2 }),
    ];
    const members: Member[] = [
      makeMember({ email: 'a@t.com', jiraAccountId: 'u1', nickname: 'A', teamId: 1 }),
      makeMember({ email: 'b@t.com', jiraAccountId: 'u2', nickname: 'B', teamId: 1 }),
      makeMember({ email: 'c@t.com', jiraAccountId: 'u3', nickname: 'C', teamId: 2 }),
    ];
    const teams: Team[] = [TEAM_A, TEAM_B];

    const result = calculateMonthlyStats(units, members, teams);

    expect(result.teamStats).toHaveLength(2);
    const teamAStat = result.teamStats.find((s) => s.teamId === 1);
    const teamBStat = result.teamStats.find((s) => s.teamId === 2);

    expect(teamAStat!.completedCount).toBe(2);
    expect(teamAStat!.estimationTotal).toBe(8); // 3+5
    expect(teamBStat!.completedCount).toBe(1);
    expect(teamBStat!.estimationTotal).toBe(2);
  });

  it('endDate 없는 완료 이슈는 제외된다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', statusCategory: 'done', assigneeId: 'u1' }), // endDate 없음
      makeUnit({ jiraKey: 'T-2', statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'u1' }),
    ];
    const result = calculateMonthlyStats(units, [], []);
    expect(result.totalStats).toHaveLength(1);
    expect(result.totalStats[0].completedCount).toBe(1);
  });

  it('OTDR을 올바르게 계산한다 (dueDate 기준)', () => {
    const units: Unit[] = [
      // 기한 내 완료 (endDate <= dueDate)
      makeUnit({
        jiraKey: 'T-1', statusCategory: 'done', endDate: '2025-01-08',
        dueDate: '2025-01-10', assigneeId: 'u1',
      }),
      // 기한 초과 (endDate > dueDate)
      makeUnit({
        jiraKey: 'T-2', statusCategory: 'done', endDate: '2025-01-15',
        dueDate: '2025-01-10', assigneeId: 'u1',
      }),
    ];
    const result = calculateMonthlyStats(units, [], []);

    // OTDR = 1/2 = 0.5
    expect(result.totalStats[0].otdr).toBe(0.5);
  });

  it('월이 정렬되어 반환된다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', statusCategory: 'done', endDate: '2025-03-10', assigneeId: 'u1' }),
      makeUnit({ jiraKey: 'T-2', statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'u1' }),
      makeUnit({ jiraKey: 'T-3', statusCategory: 'done', endDate: '2025-02-10', assigneeId: 'u1' }),
    ];
    const result = calculateMonthlyStats(units, [], []);
    expect(result.totalStats.map((s) => s.month)).toEqual(['2025-01', '2025-02', '2025-03']);
  });
});
