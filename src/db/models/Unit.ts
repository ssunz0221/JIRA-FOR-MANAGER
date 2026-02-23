export interface Unit {
  /** Issue 키 (예: "PROJ-42") — Primary Key */
  jiraKey: string;
  /** 부모 Epic 키 (Foreign Reference) */
  projectKey: string;
  /** 이슈 제목 */
  summary: string;
  /** JIRA 상태명 */
  status: string;
  /** 상태 카테고리: "new" | "indeterminate" | "done" */
  statusCategory: string;
  /** 담당자 accountId (Foreign Reference) */
  assigneeId?: string;
  /** 담당자 표시 이름 (비정규화) */
  assigneeName?: string;
  /** 이슈 시작일 customfield_10917 (YYYY-MM-DD) */
  startDate?: string;
  /** JIRA 원본 마감일 customfield_duedate (YYYY-MM-DD) */
  dueDate?: string;
  /** 이슈 종료일 customfield_10918 (YYYY-MM-DD) — dueDate 없을 때 대체 사용 */
  endDate?: string;
  /** JIRA 원본 해결일 (ISO 8601) */
  resolutionDate?: string;
  /** KST 변환된 마감일 (해당일 23:59:59 KST, ISO 8601) */
  dueDateKst?: string;
  /** KST 변환된 해결일 (ISO 8601) */
  resolutionDateKst?: string;
  /** 우선순위명 */
  priority?: string;
  /** 이슈 유형 (예: "Story", "Task", "Bug") */
  issueType: string;
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 수정일 (ISO 8601) */
  updatedAt: string;
  /** 마지막 동기화 시각 (ISO 8601) */
  lastSyncedAt: string;
}
