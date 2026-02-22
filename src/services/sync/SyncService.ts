import { JiraAdapter } from '@/services/jira/JiraAdapter';
import { identityMapper } from '@/services/identity/IdentityMapper';
import { syncStatusTracker } from './SyncStatus';
import type { JiraConfig } from '@/services/storage/ChromeStorageService';

export class SyncService {
  private adapter: JiraAdapter;

  constructor(config: JiraConfig) {
    this.adapter = new JiraAdapter(config.baseUrl, config.pat);
  }

  async fullSync(): Promise<void> {
    await syncStatusTracker.markSyncing();

    try {
      const { epicCount, issueCount } = await this.adapter.fullSync();

      // 동기화 후 이메일 기반 자동 매핑 시도
      const autoMapped = await identityMapper.autoMapByEmail();
      if (autoMapped > 0) {
        console.log(`[JIRA PMS] Auto-mapped ${autoMapped} workers to members by email`);
      }

      await syncStatusTracker.markSuccess(epicCount, issueCount);
      console.log(`[JIRA PMS] Sync complete: ${epicCount} epics, ${issueCount} issues`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await syncStatusTracker.markError(message);
      console.error('[JIRA PMS] Sync failed:', error);
      throw error;
    }
  }
}
