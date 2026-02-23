import { describe, it, expect, vi } from 'vitest';
import { mapIssueToUnit, type EstimationConfig } from '../JiraDataMapper';
import type { JiraIssue } from '../types';

// nowKst/toKstEndOfDay를 고정값으로 mock (importOriginal로 나머지 export 보존)
vi.mock('@/utils/kst', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/kst')>();
  return {
    ...actual,
    toKstEndOfDay: (d: string | null | undefined) => (d ? `${d}T23:59:59+09:00` : null),
    nowKst: () => '2025-01-01T00:00:00+09:00',
  };
});

function makeJiraIssue(overrides: Record<string, unknown> = {}): JiraIssue {
  return {
    id: '1',
    key: 'TEST-1',
    self: 'http://jira.example.com/rest/api/2/issue/1',
    fields: {
      summary: 'Test issue',
      status: {
        name: 'Done',
        statusCategory: { key: 'done' },
      },
      assignee: null,
      issuetype: { name: 'Task', subtask: false },
      priority: { name: 'Medium' },
      duedate: null,
      created: '2025-01-01T00:00:00.000+09:00',
      updated: '2025-01-01T00:00:00.000+09:00',
      ...overrides,
    } as JiraIssue['fields'],
  };
}

describe('mapIssueToUnit - storyPoints extraction', () => {
  it('estimationConfig 없으면 storyPoints는 undefined', () => {
    const issue = makeJiraIssue();
    const unit = mapIssueToUnit(issue, 'EPIC-1');
    expect(unit.storyPoints).toBeUndefined();
  });

  it('storyPoint 타입 + fieldId가 있으면 해당 필드에서 추출', () => {
    const issue = makeJiraIssue({ customfield_10016: 5 });
    const config: EstimationConfig = { type: 'storyPoint', fieldId: 'customfield_10016' };
    const unit = mapIssueToUnit(issue, 'EPIC-1', undefined, config);
    expect(unit.storyPoints).toBe(5);
  });

  it('storyPoint 타입이지만 필드값이 숫자가 아니면 undefined', () => {
    const issue = makeJiraIssue({ customfield_10016: 'not a number' });
    const config: EstimationConfig = { type: 'storyPoint', fieldId: 'customfield_10016' };
    const unit = mapIssueToUnit(issue, 'EPIC-1', undefined, config);
    expect(unit.storyPoints).toBeUndefined();
  });

  it('storyPoint 타입이지만 fieldId가 없으면 undefined', () => {
    const issue = makeJiraIssue({ customfield_10016: 5 });
    const config: EstimationConfig = { type: 'storyPoint', fieldId: null };
    const unit = mapIssueToUnit(issue, 'EPIC-1', undefined, config);
    expect(unit.storyPoints).toBeUndefined();
  });

  it('estimate 타입 + 커스텀 필드ID → 초를 시간으로 변환', () => {
    const issue = makeJiraIssue({ customfield_12345: 7200 }); // 2시간 = 7200초
    const config: EstimationConfig = { type: 'estimate', fieldId: 'customfield_12345' };
    const unit = mapIssueToUnit(issue, 'EPIC-1', undefined, config);
    expect(unit.storyPoints).toBe(2); // 7200/3600
  });

  it('estimate 타입 + fieldId null → timetracking에서 추출', () => {
    const issue = makeJiraIssue({
      timetracking: { originalEstimateSeconds: 10800 }, // 3시간
    });
    const config: EstimationConfig = { type: 'estimate', fieldId: null };
    const unit = mapIssueToUnit(issue, 'EPIC-1', undefined, config);
    expect(unit.storyPoints).toBe(3);
  });

  it('estimate 타입 + timetracking 없으면 undefined', () => {
    const issue = makeJiraIssue();
    const config: EstimationConfig = { type: 'estimate', fieldId: null };
    const unit = mapIssueToUnit(issue, 'EPIC-1', undefined, config);
    expect(unit.storyPoints).toBeUndefined();
  });

  it('isSubtask 플래그를 올바르게 설정한다', () => {
    const subtask = makeJiraIssue({
      issuetype: { name: 'Sub-task', subtask: true },
      parent: { id: '99', key: 'TEST-99' },
    });
    const unit = mapIssueToUnit(subtask, 'EPIC-1');
    expect(unit.isSubtask).toBe(true);
    expect(unit.parentKey).toBe('TEST-99');
  });

  it('parentKey를 매개변수로 전달하면 해당 값을 사용한다', () => {
    const issue = makeJiraIssue({
      issuetype: { name: 'Sub-task', subtask: true },
      parent: { id: '99', key: 'TEST-99' },
    });
    const unit = mapIssueToUnit(issue, 'EPIC-1', 'OVERRIDE-1');
    expect(unit.parentKey).toBe('OVERRIDE-1');
  });

  it('startDate/endDate 커스텀 필드를 매핑한다', () => {
    const issue = makeJiraIssue({
      customfield_10917: '2025-01-01',
      customfield_10918: '2025-01-31',
    });
    const unit = mapIssueToUnit(issue, 'EPIC-1');
    expect(unit.startDate).toBe('2025-01-01');
    expect(unit.endDate).toBe('2025-01-31');
  });
});
