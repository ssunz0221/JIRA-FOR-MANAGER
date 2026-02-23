/** JIRA REST API /rest/api/2/search 응답 */
export interface JiraSearchResponse {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
}

export interface JiraIssueFields {
  summary: string;
  description?: string | null;
  status: {
    name: string;
    statusCategory: {
      id: number;
      key: string;
      name: string;
    };
  };
  issuetype: {
    name: string;
    subtask: boolean;
  };
  assignee?: {
    key?: string;
    name?: string;
    accountId?: string;
    displayName: string;
    emailAddress?: string;
    avatarUrls?: Record<string, string>;
    active: boolean;
  } | null;
  reporter?: {
    key?: string;
    name?: string;
    accountId?: string;
    displayName: string;
  } | null;
  duedate?: string | null;
  resolutiondate?: string | null;
  priority?: {
    name: string;
  } | null;
  created: string;
  updated: string;
  /** 구축형 JIRA에서 Epic Link는 동적 커스텀 필드 */
  [key: string]: unknown;
}

/** JIRA REST API /rest/api/2/field 응답 항목 */
export interface JiraFieldDefinition {
  id: string;
  name: string;
  custom: boolean;
  schema?: {
    type: string;
    custom?: string;
  };
}

/** JIRA REST API /rest/api/2/myself 응답 */
export interface JiraMyselfResponse {
  key?: string;
  name?: string;
  accountId?: string;
  displayName: string;
  emailAddress?: string;
  active: boolean;
}

/** JIRA REST API /rest/api/2/project 응답 항목 */
export interface JiraProjectItem {
  key: string;
  name: string;
  projectTypeKey?: string;
}
