import { useState, type FormEvent } from 'react';
import type { JiraConfig } from '@/services/storage/ChromeStorageService';

interface Props {
  config: JiraConfig | null;
  onSave: (config: JiraConfig) => Promise<void>;
}

export function PatInputForm({ config, onSave }: Props) {
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? '');
  const [pat, setPat] = useState(config?.pat ?? '');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(config?.autoSyncEnabled !== false);
  const [syncInterval, setSyncInterval] = useState(config?.syncIntervalMinutes ?? 15);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // 도메인 권한 동적 요청
      const url = new URL(baseUrl);
      const origin = `${url.protocol}//${url.host}/*`;

      const granted = await chrome.permissions.request({
        origins: [origin],
      });

      if (!granted) {
        setMessage({ type: 'error', text: '호스트 권한이 거부되었습니다. JIRA API 호출을 위해 권한이 필요합니다.' });
        return;
      }

      await onSave({
        baseUrl: baseUrl.replace(/\/+$/, ''),
        pat,
        syncIntervalMinutes: syncInterval,
        autoSyncEnabled,
        epicLinkFieldId: config?.epicLinkFieldId,
        selectedProjectKeys: config?.selectedProjectKeys,
        estimationType: config?.estimationType,
        storyPointFieldId: config?.storyPointFieldId,
        estimateFieldId: config?.estimateFieldId,
      });
      setMessage({ type: 'success', text: '설정이 저장되었습니다.' });
    } catch (err) {
      setMessage({ type: 'error', text: `저장 실패: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">JIRA URL</label>
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://jira.example.com"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-jira-blue focus:outline-none focus:ring-1 focus:ring-jira-blue"
        />
        <p className="mt-1 text-xs text-gray-500">구축형 JIRA 서버 URL을 입력하세요</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Personal Access Token (PAT)</label>
        <input
          type="password"
          value={pat}
          onChange={(e) => setPat(e.target.value)}
          placeholder="PAT를 입력하세요"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-jira-blue focus:outline-none focus:ring-1 focus:ring-jira-blue"
        />
        <p className="mt-1 text-xs text-gray-500">JIRA 프로필 &gt; Personal Access Tokens에서 발급</p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={autoSyncEnabled}
            onChange={(e) => setAutoSyncEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-jira-blue focus:ring-jira-blue"
          />
          자동 동기화 사용
        </label>
      </div>

      <div className={autoSyncEnabled ? '' : 'opacity-50 pointer-events-none'}>
        <label className="block text-sm font-medium text-gray-700">자동 동기화 주기</label>
        <select
          value={syncInterval}
          onChange={(e) => setSyncInterval(Number(e.target.value))}
          disabled={!autoSyncEnabled}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-jira-blue focus:outline-none focus:ring-1 focus:ring-jira-blue disabled:bg-gray-100"
        >
          <option value={5}>5분</option>
          <option value={15}>15분</option>
          <option value={30}>30분</option>
          <option value={60}>1시간</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-jira-blue px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? '저장 중...' : '저장'}
      </button>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
