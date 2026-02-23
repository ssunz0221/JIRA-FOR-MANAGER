import type {
  JiraSearchResponse,
  JiraFieldDefinition,
  JiraMyselfResponse,
  JiraProjectItem,
} from './types';

export class JiraApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: string,
  ) {
    super(`JIRA API Error ${statusCode}: ${body}`);
    this.name = 'JiraApiError';
  }
}

export class JiraApiClient {
  constructor(
    private baseUrl: string,
    private pat: string,
  ) {}

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`/rest/api/2${path}`, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.pat}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new JiraApiError(response.status, await response.text());
    }

    return response.json() as Promise<T>;
  }

  /** 연결 테스트: /rest/api/2/myself */
  async testConnection(): Promise<JiraMyselfResponse> {
    return this.request<JiraMyselfResponse>('/myself');
  }

  /** JQL 검색 (단일 페이지) */
  async search(
    jql: string,
    fields: string[],
    startAt: number = 0,
    maxResults: number = 50,
  ): Promise<JiraSearchResponse> {
    return this.request<JiraSearchResponse>('/search', {
      jql,
      fields: fields.join(','),
      startAt: String(startAt),
      maxResults: String(maxResults),
    });
  }

  /** 필드 목록 조회 (Epic Link 커스텀 필드 감지용) */
  async getFields(): Promise<JiraFieldDefinition[]> {
    return this.request<JiraFieldDefinition[]>('/field');
  }

  /** 접근 가능한 JIRA 프로젝트 목록 조회 */
  async getProjects(): Promise<JiraProjectItem[]> {
    return this.request<JiraProjectItem[]>('/project');
  }
}
