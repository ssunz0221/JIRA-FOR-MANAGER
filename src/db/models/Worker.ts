export interface Worker {
  /** JIRA accountId — Primary Key */
  accountId: string;
  /** 표시 이름 */
  displayName: string;
  /** 이메일 */
  email?: string;
  /** 아바타 URL */
  avatarUrl?: string;
  /** 활성 사용자 여부 */
  active: boolean;
  /** 마지막 동기화 시각 (ISO 8601) */
  lastSyncedAt: string;
}
