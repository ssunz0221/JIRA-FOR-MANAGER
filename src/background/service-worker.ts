import { SyncService } from '@/services/sync/SyncService';
import { chromeStorageService } from '@/services/storage/ChromeStorageService';
import { syncStatusTracker } from '@/services/sync/SyncStatus';
import { MSG, DEFAULT_SYNC_INTERVAL_MINUTES } from '@/utils/constants';

const ALARM_NAME = 'jira-sync';

console.log('[JIRA PMS] Service worker loaded');

// 설치 시 알람 등록
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[JIRA PMS] Extension installed');
  const config = await chromeStorageService.getConfig();
  setupAlarm(config.syncIntervalMinutes || DEFAULT_SYNC_INTERVAL_MINUTES);
});

// 알람 이벤트 → 자동 동기화
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await runSync();
  }
});

// UI에서 보내는 메시지 처리
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MSG.SYNC_NOW) {
    runSync()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true; // 비동기 응답을 위해 true 반환
  }

  if (message.type === MSG.GET_SYNC_STATUS) {
    syncStatusTracker
      .getStatus()
      .then((status) => sendResponse(status));
    return true;
  }
});

function setupAlarm(intervalMinutes: number) {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: Math.max(1, intervalMinutes),
  });
}

async function runSync() {
  const config = await chromeStorageService.getConfig();
  if (!config.baseUrl || !config.pat) {
    console.warn('[JIRA PMS] Sync skipped: no JIRA config');
    return;
  }

  const syncService = new SyncService(config);
  await syncService.fullSync();
}
