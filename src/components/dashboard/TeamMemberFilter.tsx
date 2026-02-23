import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';

export interface MemberFilter {
  teamId?: number;
  memberAccountId?: string;
}

interface Props {
  value: MemberFilter;
  onChange: (filter: MemberFilter) => void;
}

export function TeamMemberFilter({ value, onChange }: Props) {
  const teams = useLiveQuery(() => db.teams.toArray());
  const members = useLiveQuery(() => db.members.toArray());

  // jiraAccountId가 있는 구성원만 (JIRA 매핑된 구성원)
  const mappedMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((m) => m.jiraAccountId);
  }, [members]);

  // 팀 선택 시 해당 팀 구성원만 필터
  const filteredMembers = useMemo(() => {
    if (!value.teamId) return mappedMembers;
    return mappedMembers.filter((m) => m.teamId === value.teamId);
  }, [mappedMembers, value.teamId]);

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value ? Number(e.target.value) : undefined;
    onChange({ teamId, memberAccountId: undefined });
  };

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const memberAccountId = e.target.value || undefined;
    onChange({ ...value, memberAccountId });
  };

  const handleReset = () => {
    onChange({ teamId: undefined, memberAccountId: undefined });
  };

  const isActive = value.teamId !== undefined || value.memberAccountId !== undefined;

  if (!teams || teams.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-600">구성원</span>
      <select
        value={value.teamId ?? ''}
        onChange={handleTeamChange}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
      >
        <option value="">전체 팀</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <select
        value={value.memberAccountId ?? ''}
        onChange={handleMemberChange}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
      >
        <option value="">전체 구성원</option>
        {filteredMembers.map((m) => (
          <option key={m.email} value={m.jiraAccountId!}>
            {m.nickname}
          </option>
        ))}
      </select>
      {isActive && (
        <button
          onClick={handleReset}
          className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
        >
          초기화
        </button>
      )}
    </div>
  );
}
