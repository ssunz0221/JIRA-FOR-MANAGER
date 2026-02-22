import { useState, useCallback, useEffect } from 'react';
import { MSG } from '@/utils/constants';
import type { SyncStatusData } from '@/services/storage/ChromeStorageService';

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatusData>({ status: 'idle' });
  const [triggering, setTriggering] = useState(false);

  const refreshStatus = useCallback(() => {
    chrome.runtime.sendMessage({ type: MSG.GET_SYNC_STATUS }, (response) => {
      if (response) setSyncStatus(response);
    });
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const triggerSync = useCallback(async () => {
    setTriggering(true);
    try {
      await chrome.runtime.sendMessage({ type: MSG.SYNC_NOW });
    } finally {
      setTriggering(false);
      refreshStatus();
    }
  }, [refreshStatus]);

  return { syncStatus, triggering, triggerSync, refreshStatus };
}
