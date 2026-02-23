import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import type { IEfficiencyStrategy } from './IEfficiencyStrategy';
import type { Unit } from '@/db/models/Unit';
import type { EfficiencyResult } from '../types';
import { KST } from '@/utils/kst';

dayjs.extend(timezone);

export class EfficiencyCalculator {
  constructor(private strategy: IEfficiencyStrategy) {}

  /**
   * Unit 목록에 대한 효율성 지표(OTDR, AOD)를 계산한다.
   * 완료 기준: statusCategory === 'done' && endDate(종료일) 존재
   */
  calculate(units: Unit[]): EfficiencyResult {
    // 완료된(done) + 종료일(endDate)이 있는 이슈만 대상
    const resolved = units.filter(
      (u) => u.statusCategory === 'done' && u.endDate,
    );
    const totalResolved = resolved.length;

    // dueDate가 있는 이슈만 OTDR/AOD 계산 대상
    const withDueDate = resolved.filter((u) => u.dueDate);
    const excludedNoDueDate = totalResolved - withDueDate.length;

    let onTimeCount = 0;
    let overdueCount = 0;
    let totalOverdueDays = 0;

    for (const unit of withDueDate) {
      const deadline = this.strategy.parseDeadline(unit.dueDate);
      if (!deadline) continue;

      // endDate(종료일)를 KST 해당일 23:59:59로 변환하여 비교
      const completion = dayjs.tz(`${unit.endDate} 23:59:59`, KST);

      if (this.strategy.isOnTime(completion, deadline)) {
        onTimeCount++;
      } else {
        overdueCount++;
        totalOverdueDays += this.strategy.getOverdueDays(completion, deadline);
      }
    }

    const resolvedWithDueDate = withDueDate.length;
    const otdr = resolvedWithDueDate > 0 ? onTimeCount / resolvedWithDueDate : 0;
    const aod = overdueCount > 0 ? totalOverdueDays / overdueCount : 0;

    return {
      totalResolved,
      resolvedWithDueDate,
      onTimeCount,
      overdueCount,
      otdr,
      aod,
      excludedNoDueDate,
    };
  }
}
