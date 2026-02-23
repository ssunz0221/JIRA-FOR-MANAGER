import { JiraApiClient } from './JiraApiClient';
import type { JiraIssue, JiraFieldDefinition, JiraProjectItem } from './types';
import { mapEpicToProject, mapIssueToUnit, extractWorker, type EstimationConfig } from './JiraDataMapper';
import { projectRepository } from '@/db/repositories/ProjectRepository';
import { unitRepository } from '@/db/repositories/UnitRepository';
import { workerRepository } from '@/db/repositories/WorkerRepository';
import { chromeStorageService } from '@/services/storage/ChromeStorageService';
import { JIRA_MAX_RESULTS } from '@/utils/constants';
import { nowKst } from '@/utils/kst';
import { db } from '@/db/database';
import type { Project } from '@/db/models/Project';
import type { Unit } from '@/db/models/Unit';
import type { Worker } from '@/db/models/Worker';
import type { UnitDueDateHistory } from '@/db/models/UnitDueDateHistory';

const EPIC_FIELDS = ['summary', 'description', 'status', 'assignee', 'issuetype'];
const ISSUE_FIELDS = [
  'summary', 'status', 'assignee', 'duedate',
  'issuetype', 'priority', 'created', 'updated',
  'parent',
  'customfield_10917', // Start date (시작일)
  'customfield_10918', // End date (종료일)
];

export class JiraAdapter {
  private client: JiraApiClient;
  /** 동기화 중 사용할 동적 이슈 필드 목록 */
  private dynamicIssueFields: string[] = [...ISSUE_FIELDS];
  /** 동기화 중 사용할 estimation 설정 */
  private estimationConfig: EstimationConfig = {};

  constructor(baseUrl: string, pat: string) {
    this.client = new JiraApiClient(baseUrl, pat);
  }

  /** 연결 테스트 */
  async testConnection() {
    return this.client.testConnection();
  }

  /** 접근 가능한 JIRA 프로젝트 목록 조회 */
  async getProjects(): Promise<JiraProjectItem[]> {
    return this.client.getProjects();
  }

  /**
   * Epic Link 커스텀 필드 ID를 자동 감지하여 반환한다.
   * 이미 캐싱된 값이 있으면 그것을 사용한다.
   */
  async detectEpicLinkFieldId(): Promise<string | null> {
    const config = await chromeStorageService.getConfig();
    if (config.epicLinkFieldId) return config.epicLinkFieldId;

    const fields: JiraFieldDefinition[] = await this.client.getFields();
    const epicLinkField = fields.find(
      (f) =>
        f.custom &&
        (f.name === 'Epic Link' ||
          f.schema?.custom === 'com.pyxis.greenhopper.jira:gh-epic-link'),
    );

    if (epicLinkField) {
      await chromeStorageService.saveConfig({
        ...config,
        epicLinkFieldId: epicLinkField.id,
      });
      return epicLinkField.id;
    }

    return null;
  }

  /**
   * Story Point 커스텀 필드 ID를 자동 감지하여 반환한다.
   */
  async detectStoryPointFieldId(): Promise<string | null> {
    const config = await chromeStorageService.getConfig();
    if (config.storyPointFieldId) return config.storyPointFieldId;

    const fields: JiraFieldDefinition[] = await this.client.getFields();
    const spField = fields.find(
      (f) =>
        f.custom &&
        (f.name === 'Story Points' ||
          f.name === 'Story point estimate'),
    );

    if (spField) {
      await chromeStorageService.saveConfig({
        ...config,
        storyPointFieldId: spField.id,
      });
      return spField.id;
    }

    return null;
  }

  /**
   * 선택된 프로젝트의 Epic을 페이징하여 가져온다.
   * 프로젝트가 선택되지 않으면 빈 배열을 반환한다.
   */
  async fetchAllEpics(): Promise<JiraIssue[]> {
    const config = await chromeStorageService.getConfig();
    const keys = config.selectedProjectKeys;
    if (!keys?.length) return [];
    const jql = `project in (${keys.join(',')}) AND issuetype = Epic ORDER BY key ASC`;
    return this.fetchAllPages(jql, EPIC_FIELDS);
  }

  /**
   * 특정 Epic에 연결된 모든 이슈를 가져온다.
   * Epic Link 커스텀 필드 또는 parent 필드를 사용한다.
   */
  async fetchIssuesByEpic(epicKey: string, epicLinkFieldId: string | null): Promise<JiraIssue[]> {
    let jql: string;
    if (epicLinkFieldId) {
      jql = `cf[${epicLinkFieldId.replace('customfield_', '')}] = ${epicKey} ORDER BY key ASC`;
    } else {
      jql = `parent = ${epicKey} ORDER BY key ASC`;
    }
    return this.fetchAllPages(jql, this.dynamicIssueFields);
  }

  /**
   * 부모 이슈 키 목록으로 서브태스크를 일괄 조회한다.
   * JQL 길이 제한을 방지하기 위해 100개 단위로 청크 분할한다.
   */
  async fetchSubtasksByParentKeys(parentKeys: string[]): Promise<JiraIssue[]> {
    if (parentKeys.length === 0) return [];

    const chunkSize = 100;
    const allSubtasks: JiraIssue[] = [];

    for (let i = 0; i < parentKeys.length; i += chunkSize) {
      const chunk = parentKeys.slice(i, i + chunkSize);
      const jql = `parent in (${chunk.join(',')}) AND issuetype in subtaskIssueTypes() ORDER BY key ASC`;
      const subtasks = await this.fetchAllPages(jql, this.dynamicIssueFields);
      allSubtasks.push(...subtasks);
    }

    return allSubtasks;
  }

  /**
   * 전체 동기화를 실행한다.
   * 프로젝트가 선택되지 않으면 skipped를 반환한다.
   * @returns 동기화된 Epic/Issue 수 또는 skipped
   */
  async fullSync(): Promise<{ epicCount: number; issueCount: number; skipped?: boolean }> {
    const epicLinkFieldId = await this.detectEpicLinkFieldId();

    // estimation 설정 로드 및 동적 필드 구성
    const config = await chromeStorageService.getConfig();
    this.dynamicIssueFields = [...ISSUE_FIELDS];
    this.estimationConfig = {};

    if (config.estimationType === 'storyPoint' && config.storyPointFieldId) {
      this.dynamicIssueFields.push(config.storyPointFieldId);
      this.estimationConfig = { type: 'storyPoint', fieldId: config.storyPointFieldId };
    } else if (config.estimationType === 'estimate') {
      if (config.estimateFieldId) {
        this.dynamicIssueFields.push(config.estimateFieldId);
      } else {
        this.dynamicIssueFields.push('timetracking');
      }
      this.estimationConfig = { type: 'estimate', fieldId: config.estimateFieldId ?? null };
    }

    // 1. Epic 가져오기 (선택된 프로젝트 없으면 빈 배열)
    const epicIssues = await this.fetchAllEpics();
    if (epicIssues.length === 0) {
      return { epicCount: 0, issueCount: 0, skipped: true };
    }

    const projects: Project[] = epicIssues.map(mapEpicToProject);

    // 2. 각 Epic별 하위 이슈 가져오기
    const allUnits: Unit[] = [];
    const workerMap = new Map<string, Worker>();
    const parentIssueKeys: string[] = [];

    for (const epic of epicIssues) {
      try {
        const issues = await this.fetchIssuesByEpic(epic.key, epicLinkFieldId);
        const units = issues.map((issue) => mapIssueToUnit(issue, epic.key, undefined, this.estimationConfig));
        allUnits.push(...units);

        // 서브태스크가 아닌 이슈 키 수집 (서브태스크 조회용)
        for (const unit of units) {
          if (!unit.isSubtask) {
            parentIssueKeys.push(unit.jiraKey);
          }
        }

        // Worker 추출
        for (const issue of issues) {
          const worker = extractWorker(issue);
          if (worker) {
            workerMap.set(worker.accountId, worker);
          }
        }

        // Project의 totalUnits/completedUnits 업데이트 (서브태스크 제외)
        const project = projects.find((p) => p.jiraKey === epic.key);
        if (project) {
          project.totalUnits = units.filter((u) => !u.isSubtask).length;
          project.completedUnits = units.filter((u) => !u.isSubtask && u.statusCategory === 'done').length;
        }
      } catch (error) {
        console.error(`[JIRA PMS] Failed to sync issues for epic ${epic.key}:`, error);
      }
    }

    // 3. 서브태스크 일괄 조회
    try {
      const subtaskIssues = await this.fetchSubtasksByParentKeys(parentIssueKeys);
      // 부모 이슈의 epicKey 매핑
      const unitEpicMap = new Map(allUnits.map((u) => [u.jiraKey, u.projectKey]));

      for (const subtask of subtaskIssues) {
        const parentKey = subtask.fields.parent?.key;
        const epicKey = parentKey ? unitEpicMap.get(parentKey) : undefined;
        if (epicKey) {
          allUnits.push(mapIssueToUnit(subtask, epicKey, parentKey, this.estimationConfig));
        }

        // Worker 추출
        const worker = extractWorker(subtask);
        if (worker) {
          workerMap.set(worker.accountId, worker);
        }
      }
    } catch (error) {
      console.error('[JIRA PMS] Failed to fetch subtasks:', error);
    }

    // 4. dueDate 변경 이력 감지
    const existingUnits = await unitRepository.getAll();
    const existingMap = new Map(existingUnits.map((u) => [u.jiraKey, u.dueDate ?? '']));
    const histories: UnitDueDateHistory[] = [];
    const now = nowKst();

    for (const unit of allUnits) {
      const prev = existingMap.get(unit.jiraKey);
      if (prev !== undefined && prev !== (unit.dueDate ?? '')) {
        histories.push({
          unitKey: unit.jiraKey,
          previousDueDate: prev,
          newDueDate: unit.dueDate ?? '',
          detectedAt: now,
        });
      }
    }
    if (histories.length > 0) {
      await db.unitDueDateHistory.bulkAdd(histories);
    }

    // 5. DB에 일괄 적재
    await projectRepository.bulkPut(projects);
    await unitRepository.bulkPut(allUnits);
    await workerRepository.bulkPut(Array.from(workerMap.values()));

    return { epicCount: projects.length, issueCount: allUnits.length };
  }

  /**
   * JQL 검색 결과를 모든 페이지에 걸쳐 가져온다.
   */
  private async fetchAllPages(jql: string, fields: string[]): Promise<JiraIssue[]> {
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    let total = Infinity;

    while (startAt < total) {
      const response = await this.client.search(jql, fields, startAt, JIRA_MAX_RESULTS);
      total = response.total;
      allIssues.push(...response.issues);
      startAt += response.issues.length;

      // 빈 응답 시 안전 중단
      if (response.issues.length === 0) break;
    }

    return allIssues;
  }
}
