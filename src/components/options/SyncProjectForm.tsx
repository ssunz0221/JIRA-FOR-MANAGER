import { useState } from 'react';
import { JiraAdapter } from '@/services/jira/JiraAdapter';
import type { JiraConfig } from '@/services/storage/ChromeStorageService';
import type { JiraProjectItem } from '@/services/jira/types';

interface Props {
  config: JiraConfig;
  onSave: (config: JiraConfig) => Promise<void>;
}

export function SyncProjectForm({ config, onSave }: Props) {
  const [projects, setProjects] = useState<JiraProjectItem[]>([]);
  const [checked, setChecked] = useState<Set<string>>(
    new Set(config.selectedProjectKeys ?? []),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleLoad = async () => {
    if (!config.baseUrl || !config.pat) {
      setError('JIRA URL과 PAT를 먼저 저장해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const adapter = new JiraAdapter(config.baseUrl, config.pat);
      const list = await adapter.getProjects();
      setProjects(list);
      // 기존 선택 유지
      setChecked(new Set(config.selectedProjectKeys ?? []));
    } catch (e) {
      setError('프로젝트 목록을 불러오지 못했습니다. 연결 설정을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave({ ...config, selectedProjectKeys: Array.from(checked) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        동기화할 JIRA 프로젝트를 선택합니다. 선택하지 않으면 접근 가능한 모든 프로젝트를 동기화합니다.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={handleLoad}
          disabled={loading}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? '불러오는 중...' : '프로젝트 목록 불러오기'}
        </button>
        {config.selectedProjectKeys?.length ? (
          <span className="text-xs text-gray-400">
            현재 선택: {config.selectedProjectKeys.length}개 프로젝트
          </span>
        ) : (
          <span className="text-xs text-gray-400">현재: 전체 동기화</span>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {projects.length > 0 && (
        <>
          <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100">
            {projects.map((p) => (
              <label
                key={p.key}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={checked.has(p.key)}
                  onChange={() => toggle(p.key)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-mono text-gray-500 w-20 shrink-0">{p.key}</span>
                <span className="text-sm text-gray-800">{p.name}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : `선택 저장 (${checked.size}개)`}
            </button>
            {checked.size === 0 && (
              <span className="text-xs text-gray-400">0개 선택 시 전체 동기화</span>
            )}
            {saved && <span className="text-xs text-green-600">저장되었습니다.</span>}
          </div>
        </>
      )}
    </div>
  );
}
