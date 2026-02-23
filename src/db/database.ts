import Dexie, { type Table } from 'dexie';
import type { Project } from './models/Project';
import type { Unit } from './models/Unit';
import type { Worker } from './models/Worker';
import type { Team } from './models/Team';
import type { Member } from './models/Member';
import type { UnitDueDateHistory } from './models/UnitDueDateHistory';

export class AppDatabase extends Dexie {
  projects!: Table<Project, string>;
  units!: Table<Unit, string>;
  workers!: Table<Worker, string>;
  teams!: Table<Team, number>;
  members!: Table<Member, string>;
  unitDueDateHistory!: Table<UnitDueDateHistory, number>;

  constructor() {
    super('JiraPmsDB');

    this.version(1).stores({
      projects: '&jiraKey, projectName, status, lastSyncedAt',
      units: '&jiraKey, projectKey, assigneeId, status, dueDate, resolutionDate, [projectKey+status]',
      workers: '&accountId, displayName',
    });

    this.version(2).stores({
      projects: '&jiraKey, projectName, status, lastSyncedAt',
      units: '&jiraKey, projectKey, assigneeId, status, dueDate, resolutionDate, [projectKey+status]',
      workers: '&accountId, displayName',
      teams: '++id, name',
      members: '&email, jiraAccountId, teamId',
    });

    this.version(3).stores({
      projects: '&jiraKey, projectName, status, lastSyncedAt',
      units: '&jiraKey, projectKey, assigneeId, status, dueDate, resolutionDate, [projectKey+status]',
      workers: '&accountId, displayName',
      teams: '++id, name',
      members: '&email, jiraAccountId, teamId',
      unitDueDateHistory: '++id, unitKey, detectedAt',
    });

    // v4: resolutionDate 인덱스 제거 (endDate로 대체), endDate 인덱스 추가
    this.version(4).stores({
      projects: '&jiraKey, projectName, status, lastSyncedAt',
      units: '&jiraKey, projectKey, assigneeId, status, dueDate, endDate, [projectKey+status]',
      workers: '&accountId, displayName',
      teams: '++id, name',
      members: '&email, jiraAccountId, teamId',
      unitDueDateHistory: '++id, unitKey, detectedAt',
    });

    // v5: parentKey 인덱스 추가 (서브태스크 지원)
    this.version(5).stores({
      projects: '&jiraKey, projectName, status, lastSyncedAt',
      units: '&jiraKey, projectKey, assigneeId, status, dueDate, endDate, parentKey, [projectKey+status]',
      workers: '&accountId, displayName',
      teams: '++id, name',
      members: '&email, jiraAccountId, teamId',
      unitDueDateHistory: '++id, unitKey, detectedAt',
    });

    // v6: storyPoints 필드 추가 (인덱스 불필요 — 집계 전용)
    this.version(6).stores({
      projects: '&jiraKey, projectName, status, lastSyncedAt',
      units: '&jiraKey, projectKey, assigneeId, status, dueDate, endDate, parentKey, [projectKey+status]',
      workers: '&accountId, displayName',
      teams: '++id, name',
      members: '&email, jiraAccountId, teamId',
      unitDueDateHistory: '++id, unitKey, detectedAt',
    });
  }
}

export const db = new AppDatabase();
