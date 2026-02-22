import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

export const KST = 'Asia/Seoul';

/**
 * "YYYY-MM-DD" 형식의 마감일을 KST 23:59:59로 변환한다.
 * @returns ISO 8601 문자열 (KST +09:00) 또는 dueDate가 없으면 null
 */
export function toKstEndOfDay(dueDate: string | undefined | null): string | null {
  if (!dueDate) return null;
  return dayjs.tz(`${dueDate} 23:59:59`, KST).format();
}

/**
 * ISO 8601 또는 임의 날짜 문자열을 KST 타임존으로 변환한다.
 * @returns ISO 8601 문자열 (KST +09:00) 또는 입력이 없으면 null
 */
export function toKst(dateString: string | undefined | null): string | null {
  if (!dateString) return null;
  return dayjs(dateString).tz(KST).format();
}

/**
 * KST 기준 현재 시각의 ISO 8601 문자열을 반환한다.
 */
export function nowKst(): string {
  return dayjs().tz(KST).format();
}

/**
 * dayjs 객체를 KST 타임존으로 생성한다.
 */
export function parseKst(dateString: string): dayjs.Dayjs {
  return dayjs(dateString).tz(KST);
}

/**
 * KST 23:59:59 마감일 dayjs 객체를 반환한다.
 * dueDate가 없으면 null.
 */
export function parseDeadlineKst(dueDate: string | undefined | null): dayjs.Dayjs | null {
  if (!dueDate) return null;
  return dayjs.tz(`${dueDate} 23:59:59`, KST);
}
