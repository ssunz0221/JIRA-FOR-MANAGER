import type { JiraIssue } from './types';
import type { Project } from '@/db/models/Project';
import type { Unit } from '@/db/models/Unit';
import type { Worker } from '@/db/models/Worker';
import { toKstEndOfDay, toKst, nowKst } from '@/utils/kst';

/**
 * JIRA Epic 이슈를 Project 모델로 변환한다.
 */
export function mapEpicToProject(issue: JiraIssue): Project {
  const fields = issue.fields;
  return {
    jiraKey: issue.key,
    projectName: fields.summary,
    description: typeof fields.description === 'string' ? fields.description : undefined,
    status: fields.status.name,
    totalUnits: 0,
    completedUnits: 0,
    leadAccountId: getAssigneeId(fields),
    lastSyncedAt: nowKst(),
  };
}

/**
 * JIRA 이슈를 Unit 모델로 변환한다.
 */
export function mapIssueToUnit(issue: JiraIssue, epicKey: string): Unit {
  const fields = issue.fields;
  return {
    jiraKey: issue.key,
    projectKey: epicKey,
    summary: fields.summary,
    status: fields.status.name,
    statusCategory: fields.status.statusCategory.key,
    assigneeId: getAssigneeId(fields),
    assigneeName: fields.assignee?.displayName,
    startDate: (fields['customfield_10917'] as string | null | undefined) ?? undefined,
    dueDate: fields.duedate ?? undefined,
    endDate: (fields['customfield_10918'] as string | null | undefined) ?? undefined,
    resolutionDate: fields.resolutiondate ?? undefined,
    dueDateKst: toKstEndOfDay(fields.duedate) ?? undefined,
    resolutionDateKst: toKst(fields.resolutiondate) ?? undefined,
    priority: fields.priority?.name,
    issueType: fields.issuetype.name,
    createdAt: fields.created,
    updatedAt: fields.updated,
    lastSyncedAt: nowKst(),
  };
}

/**
 * JIRA 이슈에서 Worker 모델을 추출한다.
 * assignee가 없으면 null을 반환한다.
 */
export function extractWorker(issue: JiraIssue): Worker | null {
  const assignee = issue.fields.assignee;
  if (!assignee) return null;

  const id = getAssigneeId(issue.fields);
  if (!id) return null;

  return {
    accountId: id,
    displayName: assignee.displayName,
    email: assignee.emailAddress,
    avatarUrl: assignee.avatarUrls?.['48x48'],
    active: assignee.active,
    lastSyncedAt: nowKst(),
  };
}

/**
 * 구축형 JIRA는 accountId 대신 name 또는 key를 사용할 수 있다.
 * accountId > name > key 순서로 폴백한다.
 */
function getAssigneeId(fields: JiraIssue['fields']): string | undefined {
  const assignee = fields.assignee;
  if (!assignee) return undefined;
  return assignee.accountId ?? assignee.name ?? assignee.key ?? undefined;
}
