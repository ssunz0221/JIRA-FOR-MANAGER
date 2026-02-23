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
  /** 이슈 종료일 customfield_10918 (YYYY-MM-DD) */
  endDate?: string;
  /** JIRA 원본 마감일 (YYYY-MM-DD) */
  dueDate?: string;
  /** KST 변환된 마감일 (해당일 23:59:59 KST, ISO 8601) */
  dueDateKst?: string;
  /** 우선순위명 */
  priority?: string;
  /** 부모 이슈 키 (서브태스크인 경우) */
  parentKey?: string;
  /** 서브태스크 여부 */
  isSubtask?: boolean;
  /** Story Point 또는 Estimate 값 (SP: 원본, Estimate: 초→시간 변환) */
  storyPoints?: number;
  /** 이슈 유형 (예: "Story", "Task", "Bug") */
  issueType: string;
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 수정일 (ISO 8601) */
  updatedAt: string;
  /** 마지막 동기화 시각 (ISO 8601) */
  lastSyncedAt: string;
}
