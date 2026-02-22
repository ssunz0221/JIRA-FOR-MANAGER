import { useState, type FormEvent } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useTeams } from '@/hooks/useTeams';
import type { Member } from '@/db/models/Member';

export function MemberManager() {
  const { members, addMember, updateMember, deleteMember } = useMembers();
  const { teams } = useTeams();

  const [showForm, setShowForm] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', nickname: '', teamId: '' });

  const resetForm = () => {
    setForm({ email: '', nickname: '', teamId: '' });
    setShowForm(false);
    setEditingEmail(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const member: Member = {
      email: form.email.trim(),
      nickname: form.nickname.trim(),
      teamId: form.teamId ? Number(form.teamId) : undefined,
    };

    if (!member.email || !member.nickname) return;

    if (editingEmail) {
      // 이메일 변경 시 기존 삭제 후 재등록
      if (editingEmail !== member.email) {
        await deleteMember(editingEmail);
      }
      await updateMember(member);
    } else {
      await addMember(member);
    }
    resetForm();
  };

  const handleEdit = (member: Member) => {
    setEditingEmail(member.email);
    setForm({
      email: member.email,
      nickname: member.nickname,
      teamId: member.teamId?.toString() ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = async (email: string) => {
    if (!confirm('이 구성원을 삭제하시겠습니까?')) return;
    await deleteMember(email);
  };

  const getTeamName = (teamId?: number) => {
    if (!teamId) return '-';
    return teams.find((t) => t.id === teamId)?.name ?? '-';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">구성원 관리</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-jira-blue px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            구성원 추가
          </button>
        )}
      </div>

      {/* 추가/수정 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
                required
                disabled={!!editingEmail}
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">닉네임</label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="홍길동"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">팀</label>
              <select
                value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">미배정</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-jira-blue px-3 py-1.5 text-sm text-white hover:bg-blue-700">
              {editingEmail ? '수정' : '추가'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
              취소
            </button>
          </div>
        </form>
      )}

      {/* 구성원 목록 */}
      {members.length === 0 ? (
        <p className="text-sm text-gray-400">등록된 구성원이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2.5 font-semibold text-gray-600">이메일</th>
                <th className="px-4 py-2.5 font-semibold text-gray-600">닉네임</th>
                <th className="px-4 py-2.5 font-semibold text-gray-600">팀</th>
                <th className="px-4 py-2.5 font-semibold text-gray-600">JIRA 연결</th>
                <th className="px-4 py-2.5 font-semibold text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-800">{m.email}</td>
                  <td className="px-4 py-2.5 text-gray-800">{m.nickname}</td>
                  <td className="px-4 py-2.5 text-gray-600">{getTeamName(m.teamId)}</td>
                  <td className="px-4 py-2.5">
                    {m.jiraAccountId ? (
                      <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">연결됨</span>
                    ) : (
                      <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">미연결</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => handleEdit(m)} className="mr-2 text-sm text-gray-500 hover:text-jira-blue">수정</button>
                    <button onClick={() => handleDelete(m.email)} className="text-sm text-red-500 hover:text-red-700">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
