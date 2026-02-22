export interface Member {
  /** 이메일 — Primary Key */
  email: string;
  /** JIRA accountId (구축형에서는 name/key일 수 있음) */
  jiraAccountId?: string;
  /** 닉네임 (관리자가 지정) */
  nickname: string;
  /** 소속 팀 ID (FK → teams.id) */
  teamId?: number;
}
