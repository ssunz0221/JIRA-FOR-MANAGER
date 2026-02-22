export interface Project {
  /** Epic 키 (예: "PROJ-1") — Primary Key */
  jiraKey: string;
  /** Epic 이름 (summary) */
  projectName: string;
  /** Epic 설명 */
  description?: string;
  /** JIRA 상태명 (예: "To Do", "In Progress", "Done") */
  status: string;
  /** 하위 이슈 총 수 (캐시) */
  totalUnits: number;
  /** 완료된 하위 이슈 수 (캐시) */
  completedUnits: number;
  /** Epic 담당자 accountId */
  leadAccountId?: string;
  /** 마지막 동기화 시각 (ISO 8601) */
  lastSyncedAt: string;
}
