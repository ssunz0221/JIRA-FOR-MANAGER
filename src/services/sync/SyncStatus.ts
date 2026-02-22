import { chromeStorageService, type SyncStatusData } from '@/services/storage/ChromeStorageService';
import { nowKst } from '@/utils/kst';

export class SyncStatusTracker {
  async markSyncing(): Promise<void> {
    await chromeStorageService.setSyncStatus({
      status: 'syncing',
    });
  }

  async markSuccess(epicCount: number, issueCount: number): Promise<void> {
    const now = nowKst();
    await chromeStorageService.setSyncStatus({
      status: 'success',
      lastSyncedAt: now,
      syncedEpics: epicCount,
      syncedIssues: issueCount,
    });
    await chromeStorageService.setLastSyncTime(now);
  }

  async markError(errorMessage: string): Promise<void> {
    await chromeStorageService.setSyncStatus({
      status: 'error',
      errorMessage,
    });
  }

  async getStatus(): Promise<SyncStatusData> {
    return chromeStorageService.getSyncStatus();
  }
}

export const syncStatusTracker = new SyncStatusTracker();
