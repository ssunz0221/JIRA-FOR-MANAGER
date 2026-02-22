import type { Unit } from '@/db/models/Unit';
import type { Worker } from '@/db/models/Worker';
import type { WorkerMetricResult } from '../types';
import { EfficiencyCalculator } from '../strategies/EfficiencyCalculator';
import { DueDateStrategy } from '../strategies/DueDateStrategy';

const calculator = new EfficiencyCalculator(new DueDateStrategy());

export class WorkerMetrics {
  /**
   * 모든 작업자에 대한 효율성 메트릭을 계산하고 OTDR 내림차순 랭킹을 부여한다.
   */
  computeAll(workers: Worker[], allUnits: Unit[]): WorkerMetricResult[] {
    const results: WorkerMetricResult[] = workers.map((worker) => {
      const assignedUnits = allUnits.filter((u) => u.assigneeId === worker.accountId);
      const efficiency = calculator.calculate(assignedUnits);

      return {
        accountId: worker.accountId,
        displayName: worker.displayName,
        totalAssigned: assignedUnits.length,
        totalResolved: efficiency.totalResolved,
        otdr: efficiency.otdr,
        aod: efficiency.aod,
      };
    });

    // OTDR 내림차순, 동률 시 AOD 오름차순으로 정렬 후 순위 부여
    results.sort((a, b) => {
      if (b.otdr !== a.otdr) return b.otdr - a.otdr;
      return a.aod - b.aod;
    });

    results.forEach((r, i) => {
      r.rank = i + 1;
    });

    return results;
  }
}
