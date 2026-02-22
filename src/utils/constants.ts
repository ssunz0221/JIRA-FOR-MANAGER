/** JIRA API 페이징 기본 페이지 크기 */
export const JIRA_MAX_RESULTS = 50;

/** 기본 동기화 주기 (분) */
export const DEFAULT_SYNC_INTERVAL_MINUTES = 15;

/** chrome.runtime 메시지 타입 */
export const MSG = {
  SYNC_NOW: 'SYNC_NOW',
  GET_SYNC_STATUS: 'GET_SYNC_STATUS',
  SYNC_STATUS_CHANGED: 'SYNC_STATUS_CHANGED',
} as const;
