import { useState } from 'react';
import { JiraApiClient } from '@/services/jira/JiraApiClient';
import type { JiraConfig } from '@/services/storage/ChromeStorageService';

interface Props {
  config: JiraConfig | null;
}

export function ConnectionTest({ config }: Props) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    if (!config?.baseUrl || !config?.pat) {
      setResult({ success: false, message: 'JIRA URL과 PAT를 먼저 입력하고 저장하세요.' });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const client = new JiraApiClient(config.baseUrl, config.pat);
      const user = await client.testConnection();
      setResult({
        success: true,
        message: `연결 성공! 사용자: ${user.displayName} (${user.emailAddress ?? user.name ?? ''})`,
      });
    } catch (err) {
      setResult({
        success: false,
        message: `연결 실패: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleTest}
        disabled={testing}
        className="rounded-md border border-jira-blue bg-white px-4 py-2 text-jira-blue hover:bg-jira-light disabled:opacity-50"
      >
        {testing ? '테스트 중...' : '연결 테스트'}
      </button>

      {result && (
        <div
          className={`rounded-md p-3 text-sm ${
            result.success
              ? 'border border-green-200 bg-green-50 text-green-700'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
