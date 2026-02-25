import { useSync } from '@/hooks/useSync';

export function SyncStatusBar() {
  const { syncStatus, triggering, triggerFullSync, triggerRecentSync } = useSync();

  const isSyncing = syncStatus.status === 'syncing' || triggering;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex-1">
        {syncStatus.status === 'success' && syncStatus.lastSyncedAt && (
          <span className="text-sm text-gray-600">
            마지막 동기화: {new Date(syncStatus.lastSyncedAt).toLocaleString('ko-KR')}
            {syncStatus.syncedEpics !== undefined && (
              <span className="ml-2 text-gray-400">
                ({syncStatus.syncedEpics}개 에픽, {syncStatus.syncedIssues}개 이슈)
              </span>
            )}
          </span>
        )}
        {syncStatus.status === 'error' && (
          <span className="text-sm text-red-600">
            동기화 오류: {syncStatus.errorMessage}
          </span>
        )}
        {syncStatus.status === 'idle' && (
          <span className="text-sm text-gray-400">동기화된 적 없음</span>
        )}
        {syncStatus.status === 'syncing' && (
          <span className="text-sm text-jira-blue">동기화 중...</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={triggerRecentSync}
          disabled={isSyncing}
          className="flex items-center gap-2 rounded-md bg-jira-blue px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSyncing && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {isSyncing ? '동기화 중...' : '최근 동기화'}
        </button>
        <button
          onClick={triggerFullSync}
          disabled={isSyncing}
          className="rounded-md bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
        >
          전체 동기화
        </button>
      </div>
    </div>
  );
}
