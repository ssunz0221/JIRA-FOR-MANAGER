/** JIRA API 페이징 기본 페이지 크기 */
export const JIRA_MAX_RESULTS = 50;

/** 기본 동기화 주기 (분) */
export const DEFAULT_SYNC_INTERVAL_MINUTES = 15;

/** 에픽이 없는 이슈를 묶는 가상 에픽 키 */
export const NO_EPIC_KEY = '__NO_EPIC__';

/** chrome.runtime 메시지 타입 */
export const MSG = {
  SYNC_NOW: 'SYNC_NOW',
  SYNC_FULL: 'SYNC_FULL',
  SYNC_RECENT: 'SYNC_RECENT',
  GET_SYNC_STATUS: 'GET_SYNC_STATUS',
  SYNC_STATUS_CHANGED: 'SYNC_STATUS_CHANGED',
} as const;
