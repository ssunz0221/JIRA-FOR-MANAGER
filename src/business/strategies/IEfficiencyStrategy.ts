import type { Dayjs } from 'dayjs';

export interface IEfficiencyStrategy {
  /**
   * 마감일 문자열을 KST 기준 마감 시각으로 파싱한다.
   * dueDate가 없거나 유효하지 않으면 null을 반환한다.
   */
  parseDeadline(dueDate: string | undefined): Dayjs | null;

  /**
   * 해결일이 마감일 이내인지 판단한다.
   */
  isOnTime(resolutionDateKst: Dayjs, deadline: Dayjs): boolean;

  /**
   * 지연 일수를 계산한다. 기한 내이면 0.
   */
  getOverdueDays(resolutionDateKst: Dayjs, deadline: Dayjs): number;
}
