import { useState, type FormEvent } from 'react';
import { useTeams } from '@/hooks/useTeams';

export function TeamManager() {
  const { teams, addTeam, updateTeam, deleteTeam } = useTeams();
  const [newTeamName, setNewTeamName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const name = newTeamName.trim();
    if (!name) return;
    await addTeam(name);
    setNewTeamName('');
  };

  const handleUpdate = async (id: number) => {
    const name = editingName.trim();
    if (!name) return;
    await updateTeam(id, name);
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 팀을 삭제하시겠습니까? 소속 구성원의 팀 배정이 해제됩니다.')) return;
    await deleteTeam(id);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800">팀 관리</h3>

      {/* 팀 추가 폼 */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="새 팀 이름"
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-jira-blue focus:outline-none focus:ring-1 focus:ring-jira-blue"
        />
        <button
          type="submit"
          className="rounded-md bg-jira-blue px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          추가
        </button>
      </form>

      {/* 팀 목록 */}
      {teams.length === 0 ? (
        <p className="text-sm text-gray-400">등록된 팀이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
          {teams.map((team) => (
            <li key={team.id} className="flex items-center gap-2 px-4 py-2.5">
              {editingId === team.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdate(team.id!)}
                    className="text-sm text-jira-blue hover:underline"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800">{team.name}</span>
                  <button
                    onClick={() => { setEditingId(team.id!); setEditingName(team.name); }}
                    className="text-sm text-gray-500 hover:text-jira-blue"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(team.id!)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
