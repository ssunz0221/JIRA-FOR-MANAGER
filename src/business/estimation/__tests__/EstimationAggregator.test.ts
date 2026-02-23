import { describe, it, expect } from 'vitest';
import {
  computeEpicEstimation,
  computePersonEstimations,
  computePersonCompletedCounts,
} from '../EstimationAggregator';
import type { Unit } from '@/db/models/Unit';

/** 테스트용 Unit 헬퍼 */
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

describe('computeEpicEstimation', () => {
  it('standalone 이슈의 storyPoints 합계를 반환한다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', storyPoints: 3 }),
      makeUnit({ jiraKey: 'T-2', storyPoints: 5 }),
    ];
    expect(computeEpicEstimation(units)).toBe(8);
  });

  it('storyPoints가 없는 이슈는 0으로 처리한다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', storyPoints: 3 }),
      makeUnit({ jiraKey: 'T-2' }), // undefined
    ];
    expect(computeEpicEstimation(units)).toBe(3);
  });

  it('빈 배열이면 0을 반환한다', () => {
    expect(computeEpicEstimation([])).toBe(0);
  });

  it('모든 서브태스크에 SP가 있으면 서브태스크 합계를 사용한다 (부모 무시)', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', storyPoints: 10 }), // 부모 (무시됨)
      makeUnit({ jiraKey: 'T-1-1', parentKey: 'T-1', isSubtask: true, storyPoints: 3 }),
      makeUnit({ jiraKey: 'T-1-2', parentKey: 'T-1', isSubtask: true, storyPoints: 4 }),
    ];
    expect(computeEpicEstimation(units)).toBe(7); // 3+4, 부모의 10은 무시
  });

  it('서브태스크 일부에 SP가 없으면 부모 값을 사용한다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', storyPoints: 10 }), // 부모 값 사용
      makeUnit({ jiraKey: 'T-1-1', parentKey: 'T-1', isSubtask: true, storyPoints: 3 }),
      makeUnit({ jiraKey: 'T-1-2', parentKey: 'T-1', isSubtask: true }), // SP 없음
    ];
    expect(computeEpicEstimation(units)).toBe(10); // 부모 값
  });

  it('orphaned 서브태스크(부모 없음)는 standalone으로 처리한다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', storyPoints: 5 }),
      // T-99 부모는 units에 없음 → orphaned
      makeUnit({ jiraKey: 'T-99-1', parentKey: 'T-99', isSubtask: true, storyPoints: 2 }),
    ];
    expect(computeEpicEstimation(units)).toBe(7); // 5 + 2
  });

  it('복합 케이스: standalone + 서브태스크 있음 + orphaned', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', storyPoints: 5 }), // standalone
      makeUnit({ jiraKey: 'T-2', storyPoints: 10 }), // parent (all subs have SP)
      makeUnit({ jiraKey: 'T-2-1', parentKey: 'T-2', isSubtask: true, storyPoints: 4 }),
      makeUnit({ jiraKey: 'T-2-2', parentKey: 'T-2', isSubtask: true, storyPoints: 6 }),
      makeUnit({ jiraKey: 'T-3', storyPoints: 8 }), // parent (some subs lack SP)
      makeUnit({ jiraKey: 'T-3-1', parentKey: 'T-3', isSubtask: true, storyPoints: 2 }),
      makeUnit({ jiraKey: 'T-3-2', parentKey: 'T-3', isSubtask: true }), // no SP
      makeUnit({ jiraKey: 'T-99-1', parentKey: 'T-99', isSubtask: true, storyPoints: 1 }), // orphaned
    ];
    // standalone: 5
    // T-2 subs (all have SP): 4+6 = 10
    // T-3 (some subs lack SP): parent 8
    // orphaned: 1
    expect(computeEpicEstimation(units)).toBe(24);
  });
});

describe('computePersonEstimations', () => {
  it('standalone 이슈의 SP를 assignee에게 귀속시킨다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', storyPoints: 3, assigneeId: 'user-A' }),
      makeUnit({ jiraKey: 'T-2', storyPoints: 5, assigneeId: 'user-B' }),
      makeUnit({ jiraKey: 'T-3', storyPoints: 2, assigneeId: 'user-A' }),
    ];
    const result = computePersonEstimations(units);
    expect(result.get('user-A')).toBe(5); // 3+2
    expect(result.get('user-B')).toBe(5);
  });

  it('서브태스크 전부 SP 있으면 각 서브태스크 assignee에게 귀속', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', storyPoints: 10, assigneeId: 'lead' }),
      makeUnit({ jiraKey: 'T-1-1', parentKey: 'T-1', isSubtask: true, storyPoints: 3, assigneeId: 'user-A' }),
      makeUnit({ jiraKey: 'T-1-2', parentKey: 'T-1', isSubtask: true, storyPoints: 7, assigneeId: 'user-B' }),
    ];
    const result = computePersonEstimations(units);
    expect(result.get('user-A')).toBe(3);
    expect(result.get('user-B')).toBe(7);
    expect(result.has('lead')).toBe(false); // 부모 assignee에는 귀속되지 않음
  });

  it('서브태스크 일부 SP 없으면 부모 assignee에게 귀속', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', storyPoints: 10, assigneeId: 'lead' }),
      makeUnit({ jiraKey: 'T-1-1', parentKey: 'T-1', isSubtask: true, storyPoints: 3, assigneeId: 'user-A' }),
      makeUnit({ jiraKey: 'T-1-2', parentKey: 'T-1', isSubtask: true, assigneeId: 'user-B' }), // SP 없음
    ];
    const result = computePersonEstimations(units);
    expect(result.get('lead')).toBe(10);
    expect(result.has('user-A')).toBe(false);
    expect(result.has('user-B')).toBe(false);
  });

  it('assigneeId 없는 이슈는 무시한다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', storyPoints: 5 }), // no assigneeId
    ];
    const result = computePersonEstimations(units);
    expect(result.size).toBe(0);
  });
});

describe('computePersonCompletedCounts', () => {
  it('standalone 완료 이슈를 assignee별로 카운트한다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'user-A' }),
      makeUnit({ jiraKey: 'T-2', statusCategory: 'done', endDate: '2025-01-11', assigneeId: 'user-A' }),
      makeUnit({ jiraKey: 'T-3', statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'user-B' }),
    ];
    const result = computePersonCompletedCounts(units);
    expect(result.get('user-A')).toBe(2);
    expect(result.get('user-B')).toBe(1);
  });

  it('미완료 이슈는 제외한다', () => {
    const units: Unit[] = [
      makeUnit({ jiraKey: 'T-1', statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'user-A' }),
      makeUnit({ jiraKey: 'T-2', statusCategory: 'indeterminate', assigneeId: 'user-A' }), // 진행중
      makeUnit({ jiraKey: 'T-3', statusCategory: 'done', assigneeId: 'user-B' }), // endDate 없음
    ];
    const result = computePersonCompletedCounts(units);
    expect(result.get('user-A')).toBe(1);
    expect(result.has('user-B')).toBe(false);
  });

  it('부모와 서브태스크 같은 날 완료 → 서브태스크만 카운트', () => {
    const units: Unit[] = [
      makeUnit({
        jiraKey: 'T-1', statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'lead',
      }),
      makeUnit({
        jiraKey: 'T-1-1', parentKey: 'T-1', isSubtask: true,
        statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'user-A',
      }),
      makeUnit({
        jiraKey: 'T-1-2', parentKey: 'T-1', isSubtask: true,
        statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'user-B',
      }),
    ];
    const result = computePersonCompletedCounts(units);
    expect(result.get('user-A')).toBe(1);
    expect(result.get('user-B')).toBe(1);
    expect(result.has('lead')).toBe(false); // 부모는 카운트되지 않음
  });

  it('부모와 서브태스크 다른 날 완료 → 둘 다 카운트', () => {
    const units: Unit[] = [
      makeUnit({
        jiraKey: 'T-1', statusCategory: 'done', endDate: '2025-01-15', assigneeId: 'lead',
      }),
      makeUnit({
        jiraKey: 'T-1-1', parentKey: 'T-1', isSubtask: true,
        statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'user-A',
      }),
    ];
    const result = computePersonCompletedCounts(units);
    expect(result.get('lead')).toBe(1);
    expect(result.get('user-A')).toBe(1);
  });

  it('orphaned 서브태스크도 카운트된다', () => {
    const units: Unit[] = [
      makeUnit({
        jiraKey: 'T-99-1', parentKey: 'T-99', isSubtask: true,
        statusCategory: 'done', endDate: '2025-01-10', assigneeId: 'user-A',
      }),
    ];
    const result = computePersonCompletedCounts(units);
    expect(result.get('user-A')).toBe(1);
  });

  it('빈 배열이면 빈 맵을 반환한다', () => {
    const result = computePersonCompletedCounts([]);
    expect(result.size).toBe(0);
  });
});
