import { useState } from 'react';
import type { JiraConfig } from '@/services/storage/ChromeStorageService';
import { useTeams } from '@/hooks/useTeams';

interface Props {
  config: JiraConfig;
  onSave: (config: JiraConfig) => Promise<void>;
}

const INITIAL_DEFAULT_TEAMS = ['사업1팀', '사업2팀', '사업3팀', '사업4팀'];

export function DefaultTeamsForm({ config, onSave }: Props) {
  const { teams, addTeam } = useTeams();
  const [names, setNames] = useState(
    (config.defaultTeamNames ?? INITIAL_DEFAULT_TEAMS).join(', '),
  );
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveNames = async () => {
    const parsed = names.split(',').map((n) => n.trim()).filter(Boolean);
    await onSave({ ...config, defaultTeamNames: parsed });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCreateDefaults = async () => {
    setCreating(true);
    const parsed = names.split(',').map((n) => n.trim()).filter(Boolean);
    const existingNames = new Set(teams.map((t) => t.name));
    for (const name of parsed) {
      if (!existingNames.has(name)) {
        await addTeam(name);
      }
    }
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        기본 팀 이름을 쉼표(,)로 구분하여 입력합니다. &quot;기본 팀 생성&quot; 버튼을 누르면 아직 생성되지 않은 팀만 추가됩니다.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={names}
          onChange={(e) => setNames(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-jira-blue focus:outline-none focus:ring-1 focus:ring-jira-blue"
          placeholder="사업1팀, 사업2팀, ..."
        />
        <button
          onClick={handleSaveNames}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          이름 저장
        </button>
      </div>
      {saved && <span className="text-xs text-green-600">저장되었습니다.</span>}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCreateDefaults}
          disabled={creating}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? '생성 중...' : '기본 팀 생성'}
        </button>
        <span className="text-xs text-gray-400">
          현재 {teams.length}개 팀 등록됨
        </span>
      </div>
    </div>
  );
}
