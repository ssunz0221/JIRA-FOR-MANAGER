import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import type { IEfficiencyStrategy } from './IEfficiencyStrategy';
import { KST } from '@/utils/kst';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

export class DueDateStrategy implements IEfficiencyStrategy {
  /**
   * "YYYY-MM-DD" → KST 해당일 23:59:59
   * dueDate가 없으면 null 반환 (OTDR/AOD 계산에서 제외)
   */
  parseDeadline(dueDate: string | undefined): Dayjs | null {
    if (!dueDate) return null;
    const parsed = dayjs.tz(`${dueDate} 23:59:59`, KST);
    return parsed.isValid() ? parsed : null;
  }

  isOnTime(resolutionDateKst: Dayjs, deadline: Dayjs): boolean {
    return resolutionDateKst.isSameOrBefore(deadline);
  }

  getOverdueDays(resolutionDateKst: Dayjs, deadline: Dayjs): number {
    if (this.isOnTime(resolutionDateKst, deadline)) return 0;
    // KST 기준 날짜 단위 차이 계산
    const resolutionDay = resolutionDateKst.tz(KST).startOf('day');
    const deadlineDay = deadline.tz(KST).startOf('day');
    return resolutionDay.diff(deadlineDay, 'day');
  }
}
