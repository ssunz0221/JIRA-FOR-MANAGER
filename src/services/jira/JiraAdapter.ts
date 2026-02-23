import { JiraApiClient } from './JiraApiClient';
import type { JiraIssue, JiraFieldDefinition, JiraProjectItem } from './types';
import { mapEpicToProject, mapIssueToUnit, extractWorker } from './JiraDataMapper';
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
  'summary', 'status', 'assignee', 'duedate', 'resolutiondate',
  'issuetype', 'priority', 'created', 'updated',
];

export class JiraAdapter {
  private client: JiraApiClient;

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
   * 선택된 프로젝트(또는 전체)의 Epic을 페이징하여 가져온다.
   */
  async fetchAllEpics(): Promise<JiraIssue[]> {
    const config = await chromeStorageService.getConfig();
    const keys = config.selectedProjectKeys;
    const jql = keys?.length
      ? `project in (${keys.join(',')}) AND issuetype = Epic ORDER BY key ASC`
      : `issuetype = Epic ORDER BY key ASC`;
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
    return this.fetchAllPages(jql, ISSUE_FIELDS);
  }

  /**
   * 전체 동기화를 실행한다.
   * @returns 동기화된 Epic/Issue 수
   */
  async fullSync(): Promise<{ epicCount: number; issueCount: number }> {
    const epicLinkFieldId = await this.detectEpicLinkFieldId();

    // 1. Epic 가져오기
    const epicIssues = await this.fetchAllEpics();
    const projects: Project[] = epicIssues.map(mapEpicToProject);

    // 2. 각 Epic별 하위 이슈 가져오기
    const allUnits: Unit[] = [];
    const workerMap = new Map<string, Worker>();

    for (const epic of epicIssues) {
      try {
        const issues = await this.fetchIssuesByEpic(epic.key, epicLinkFieldId);
        const units = issues.map((issue) => mapIssueToUnit(issue, epic.key));
        allUnits.push(...units);

        // Worker 추출
        for (const issue of issues) {
          const worker = extractWorker(issue);
          if (worker) {
            workerMap.set(worker.accountId, worker);
          }
        }

        // Project의 totalUnits/completedUnits 업데이트
        const project = projects.find((p) => p.jiraKey === epic.key);
        if (project) {
          project.totalUnits = units.length;
          project.completedUnits = units.filter((u) => u.statusCategory === 'done').length;
        }
      } catch (error) {
        console.error(`[JIRA PMS] Failed to sync issues for epic ${epic.key}:`, error);
        // 개별 Epic 실패 시 다음 Epic으로 계속 진행
      }
    }

    // 3. dueDate 변경 이력 감지
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

    // 4. DB에 일괄 적재
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
