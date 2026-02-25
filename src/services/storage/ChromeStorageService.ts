export interface JiraConfig {
  baseUrl: string;
  pat: string;
  syncIntervalMinutes: number;
  epicLinkFieldId?: string;
  selectedProjectKeys?: string[];
  /** 'storyPoint' | 'estimate' | undefined(미사용) */
  estimationType?: 'storyPoint' | 'estimate';
  /** Story Point 커스텀 필드 ID (예: customfield_10016) */
  storyPointFieldId?: string;
  /** Estimate 커스텀 필드 ID (비어있으면 timetracking.originalEstimate 사용) */
  estimateFieldId?: string;
  /** 기본 팀 이름 목록 */
  defaultTeamNames?: string[];
  /** 자동 동기화 활성화 여부 (기본: true) */
  autoSyncEnabled?: boolean;
}

const STORAGE_KEYS = {
  CONFIG: 'jira_config',
  LAST_SYNC: 'last_sync_time',
  SYNC_STATUS: 'sync_status',
} as const;

const DEFAULT_CONFIG: JiraConfig = {
  baseUrl: '',
  pat: '',
  syncIntervalMinutes: 15,
};

export class ChromeStorageService {
  async getConfig(): Promise<JiraConfig> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CONFIG);
    return result[STORAGE_KEYS.CONFIG] ?? { ...DEFAULT_CONFIG };
  }

  async saveConfig(config: JiraConfig): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.CONFIG]: config });
  }

  async getLastSyncTime(): Promise<string | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.LAST_SYNC);
    return result[STORAGE_KEYS.LAST_SYNC] ?? null;
  }

  async setLastSyncTime(time: string): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.LAST_SYNC]: time });
  }

  async getSyncStatus(): Promise<SyncStatusData> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SYNC_STATUS);
    return result[STORAGE_KEYS.SYNC_STATUS] ?? { status: 'idle' };
  }

  async setSyncStatus(status: SyncStatusData): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_STATUS]: status });
  }
}

export interface SyncStatusData {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncedAt?: string;
  errorMessage?: string;
  syncedEpics?: number;
  syncedIssues?: number;
}

export const chromeStorageService = new ChromeStorageService();
