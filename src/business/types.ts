/** 프로젝트 메트릭 결과 */
export interface ProjectMetricResult {
  projectKey: string;
  projectName: string;
  totalIssues: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  /** 진행률 (0~100) */
  progressPercent: number;
}

/** 구성원(Member) 효율성 메트릭 결과 */
export interface MemberMetricResult {
  email: string;
  nickname: string;
  teamId?: number;
  teamName?: string;
  totalAssigned: number;
  totalResolved: number;
  /** 마감일 준수율 (0.0 ~ 1.0), dueDate 있는 완료 이슈 기준 */
  otdr: number;
  /** 평균 지연 일수 (0.0+), 지연된 이슈만 대상 */
  aod: number;
  /** 순위 (외부에서 정렬 후 부여) */
  rank?: number;
}

/** 팀별 효율성 메트릭 결과 */
export interface TeamMetricResult {
  teamId: number;
  teamName: string;
  memberCount: number;
  totalAssigned: number;
  totalResolved: number;
  /** 팀 전체 마감일 준수율 (0.0 ~ 1.0) */
  otdr: number;
  /** 팀 전체 평균 지연 일수 */
  aod: number;
}

/** (하위호환) 작업자 효율성 메트릭 결과 - Worker(JIRA) 기준 */
export interface WorkerMetricResult {
  accountId: string;
  displayName: string;
  totalAssigned: number;
  totalResolved: number;
  /** 마감일 준수율 (0.0 ~ 1.0), dueDate 있는 완료 이슈 기준 */
  otdr: number;
  /** 평균 지연 일수 (0.0+), 지연된 이슈만 대상 */
  aod: number;
  /** 순위 (외부에서 정렬 후 부여) */
  rank?: number;
}

/** 월별 개인 통계 */
export interface MonthlyPersonStat {
  month: string;              // YYYY-MM
  accountId: string;
  displayName: string;
  teamId?: number;
  teamName?: string;
  completedCount: number;     // 처리 건수 (서브태스크 중복제거)
  estimationTotal: number;    // SP/Estimate 합계 (집계 규칙 적용)
  otdr: number;
  aod: number;
}

/** 월별 팀 통계 */
export interface MonthlyTeamStat {
  month: string;
  teamId: number;
  teamName: string;
  completedCount: number;
  estimationTotal: number;
  otdr: number;
  aod: number;
}

/** 월별 전체 통계 */
export interface MonthlyTotalStat {
  month: string;
  completedCount: number;
  estimationTotal: number;
  otdr: number;
  aod: number;
}

/** 효율성 계산 결과 */
export interface EfficiencyResult {
  totalResolved: number;
  resolvedWithDueDate: number;
  onTimeCount: number;
  overdueCount: number;
  /** 마감일 준수율 (0.0 ~ 1.0) */
  otdr: number;
  /** 평균 지연 일수 */
  aod: number;
  /** dueDate 없이 완료된 이슈 수 */
  excludedNoDueDate: number;
}
