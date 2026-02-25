import { SyncService } from '@/services/sync/SyncService';
import { chromeStorageService } from '@/services/storage/ChromeStorageService';
import { syncStatusTracker } from '@/services/sync/SyncStatus';
import { MSG, DEFAULT_SYNC_INTERVAL_MINUTES } from '@/utils/constants';
import { db } from '@/db/database';

const ALARM_NAME = 'jira-sync';

console.log('[JIRA PMS] Service worker loaded');

// 설치 시 알람 등록 + 기본 팀 자동 생성
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[JIRA PMS] Extension installed');
  const config = await chromeStorageService.getConfig();
  setupAlarm(config.syncIntervalMinutes || DEFAULT_SYNC_INTERVAL_MINUTES);

  // 팀이 없으면 기본 팀 자동 생성
  const existingTeams = await db.teams.count();
  if (existingTeams === 0) {
    const defaultNames = config.defaultTeamNames ?? ['사업1팀', '사업2팀', '사업3팀', '사업4팀'];
    for (const name of defaultNames) {
      await db.teams.add({ name });
    }
    console.log(`[JIRA PMS] Created ${defaultNames.length} default teams`);
  }
});

// 확장 아이콘 클릭 시 대시보드 탭 열기
chrome.action.onClicked.addListener(async () => {
  const dashboardUrl = chrome.runtime.getURL('src/newtab/newtab.html');
  const tabs = await chrome.tabs.query({ url: dashboardUrl });

  if (tabs.length > 0 && tabs[0].id !== undefined) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    if (tabs[0].windowId !== undefined) {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: dashboardUrl });
  }
});

// 알람 이벤트 → 자동 동기화 (비활성화 설정 시 무시)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const config = await chromeStorageService.getConfig();
    if (config.autoSyncEnabled === false) return;
    await runSync('recent');
  }
});

// UI에서 보내는 메시지 처리
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MSG.SYNC_FULL) {
    runSync('full')
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }

  if (message.type === MSG.SYNC_RECENT || message.type === MSG.SYNC_NOW) {
    runSync('recent')
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
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

async function runSync(mode: 'full' | 'recent') {
  const config = await chromeStorageService.getConfig();
  if (!config.baseUrl || !config.pat) {
    console.warn('[JIRA PMS] Sync skipped: no JIRA config');
    return;
  }

  const syncService = new SyncService(config);
  if (mode === 'full') {
    await syncService.fullSync();
  } else {
    await syncService.recentSync();
  }
}
