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
    await this.runSync(() => this.adapter.fullSync(), 'Full');
  }

  async recentSync(): Promise<void> {
    await this.runSync(() => this.adapter.incrementalSync(), 'Recent');
  }

  private async runSync(
    syncFn: () => Promise<{ epicCount: number; issueCount: number; skipped?: boolean }>,
    label: string,
  ): Promise<void> {
    await syncStatusTracker.markSyncing();

    try {
      const result = await syncFn();

      if (result.skipped) {
        await syncStatusTracker.markError('동기화할 프로젝트가 선택되지 않았습니다. 설정에서 프로젝트를 선택해주세요.');
        console.warn(`[JIRA PMS] ${label} sync skipped: no projects selected`);
        return;
      }

      const { epicCount, issueCount } = result;

      // 동기화 후 이메일 기반 자동 매핑 시도
      const autoMapped = await identityMapper.autoMapByEmail();
      if (autoMapped > 0) {
        console.log(`[JIRA PMS] Auto-mapped ${autoMapped} workers to members by email`);
      }

      await syncStatusTracker.markSuccess(epicCount, issueCount);
      console.log(`[JIRA PMS] ${label} sync complete: ${epicCount} epics, ${issueCount} issues`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await syncStatusTracker.markError(message);
      console.error(`[JIRA PMS] ${label} sync failed:`, error);
      throw error;
    }
  }
}
