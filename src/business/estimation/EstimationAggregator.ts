import type { Unit } from '@/db/models/Unit';

/**
 * 에픽 수준 estimation 집계 규칙:
 * 1. 서브태스크 없는 이슈 → 이슈 자체의 storyPoints
 * 2. 서브태스크 있는 이슈:
 *    a. 모든 서브태스크에 storyPoints가 있으면 → 서브태스크 합계 (부모 값 무시)
 *    b. 일부라도 없으면 → 부모 이슈의 storyPoints
 */

interface ParentInfo {
  unit: Unit;
  subtasks: Unit[];
}

/** 부모-서브태스크 구조를 생성한다. */
function buildParentMap(units: Unit[]): { standalone: Unit[]; parents: ParentInfo[] } {
  const parentMap = new Map<string, ParentInfo>();
  const subtaskSet = new Set<string>();

  // 1) 부모 이슈 수집
  for (const unit of units) {
    if (!unit.isSubtask) {
      parentMap.set(unit.jiraKey, { unit, subtasks: [] });
    }
  }

  // 2) 서브태스크를 부모에 연결 (부모가 없는 orphaned 서브태스크는 standalone 취급)
  const orphanedSubtasks: Unit[] = [];
  for (const unit of units) {
    if (unit.isSubtask && unit.parentKey) {
      const parent = parentMap.get(unit.parentKey);
      if (parent) {
        parent.subtasks.push(unit);
        subtaskSet.add(unit.jiraKey);
      } else {
        orphanedSubtasks.push(unit);
      }
    }
  }

  // standalone = 서브태스크 없는 부모 이슈 + orphaned 서브태스크
  const standalone: Unit[] = [...orphanedSubtasks];
  const parents: ParentInfo[] = [];

  for (const info of parentMap.values()) {
    if (info.subtasks.length === 0) {
      standalone.push(info.unit);
    } else {
      parents.push(info);
    }
  }

  return { standalone, parents };
}

/** 에픽 전체 estimation 합계를 계산한다. */
export function computeEpicEstimation(units: Unit[]): number {
  const { standalone, parents } = buildParentMap(units);

  let total = 0;

  // standalone 이슈
  for (const unit of standalone) {
    total += unit.storyPoints ?? 0;
  }

  // 서브태스크 있는 부모
  for (const { unit: parent, subtasks } of parents) {
    const allHavePoints = subtasks.every((s) => s.storyPoints != null);
    if (allHavePoints) {
      total += subtasks.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
    } else {
      total += parent.storyPoints ?? 0;
    }
  }

  return total;
}

/**
 * 개인별 estimation 합계를 계산한다.
 *
 * 분배 로직:
 * - 서브태스크 없는 이슈 → 이슈 assignee에게 귀속
 * - 서브태스크 전체에 값 있으면 → 각 서브태스크 assignee에게 해당 값 귀속
 * - 서브태스크 일부에 값 없으면 → 부모 assignee에게 부모 값 귀속
 */
export function computePersonEstimations(units: Unit[]): Map<string, number> {
  const { standalone, parents } = buildParentMap(units);
  const personMap = new Map<string, number>();

  const addTo = (accountId: string | undefined, value: number) => {
    if (!accountId || value === 0) return;
    personMap.set(accountId, (personMap.get(accountId) ?? 0) + value);
  };

  // standalone 이슈
  for (const unit of standalone) {
    addTo(unit.assigneeId, unit.storyPoints ?? 0);
  }

  // 서브태스크 있는 부모
  for (const { unit: parent, subtasks } of parents) {
    const allHavePoints = subtasks.every((s) => s.storyPoints != null);
    if (allHavePoints) {
      for (const sub of subtasks) {
        addTo(sub.assigneeId, sub.storyPoints ?? 0);
      }
    } else {
      addTo(parent.assigneeId, parent.storyPoints ?? 0);
    }
  }

  return personMap;
}

/**
 * 처리 건수를 중복제거하여 계산한다.
 *
 * 규칙:
 * - 완료(done + endDate)된 이슈만 대상
 * - 같은 endDate에 부모 이슈 + 서브태스크 모두 완료 → 서브태스크만 카운트
 *
 * @returns 개인별 완료 건수 맵 (accountId → count)
 */
export function computePersonCompletedCounts(units: Unit[]): Map<string, number> {
  const completedUnits = units.filter((u) => u.statusCategory === 'done' && u.endDate);
  const { standalone, parents } = buildParentMap(completedUnits);

  const personMap = new Map<string, number>();

  const addCount = (accountId: string | undefined, count: number) => {
    if (!accountId) return;
    personMap.set(accountId, (personMap.get(accountId) ?? 0) + count);
  };

  // standalone 완료 이슈
  for (const unit of standalone) {
    addCount(unit.assigneeId, 1);
  }

  // 서브태스크 있는 부모 (buildParentMap에 완료 이슈만 전달되므로 subtasks도 모두 완료 상태)
  for (const { unit: parent, subtasks } of parents) {
    if (subtasks.length > 0) {
      // 부모와 동일 endDate의 서브태스크가 있으면 → 서브태스크만 카운트 (부모 무시)
      const sameDateSubs = subtasks.filter((s) => s.endDate === parent.endDate);
      if (sameDateSubs.length > 0) {
        for (const sub of subtasks) {
          addCount(sub.assigneeId, 1);
        }
      } else {
        // endDate가 다른 경우 → 부모 + 서브태스크 각각 카운트
        addCount(parent.assigneeId, 1);
        for (const sub of subtasks) {
          addCount(sub.assigneeId, 1);
        }
      }
    } else {
      // 서브태스크 없이 부모만 (standalone과 동일하지만 parents에 분류된 경우)
      addCount(parent.assigneeId, 1);
    }
  }

  return personMap;
}
