import { useState } from 'react';
import { useUnmappedWorkers } from '@/hooks/useUnmappedWorkers';
import { useMembers } from '@/hooks/useMembers';
import { useTeams } from '@/hooks/useTeams';
import type { UnmappedWorker } from '@/services/identity/IdentityMapper';

export function UnmappedWorkerList() {
  const { unmappedWorkers, excludedWorkers, loading, mapToMember, registerAsMember, excludeWorker, restoreWorker, refresh } = useUnmappedWorkers();
  const { members } = useMembers();
  const { teams } = useTeams();

  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState({ nickname: '', teamId: '' });
  const [showExcluded, setShowExcluded] = useState(false);

  const unmappedMembers = members.filter((m) => !m.jiraAccountId);

  const handleMapToExisting = async (workerAccountId: string, memberEmail: string) => {
    await mapToMember(workerAccountId, memberEmail);
  };

  const handleRegister = async (worker: UnmappedWorker) => {
    const nickname = registerForm.nickname.trim() || worker.displayName;
    await registerAsMember(worker, nickname, registerForm.teamId ? Number(registerForm.teamId) : undefined);
    setRegisteringId(null);
    setRegisterForm({ nickname: '', teamId: '' });
  };

  if (loading) {
    return <p className="text-sm text-gray-400">매핑 상태 확인 중...</p>;
  }

  if (unmappedWorkers.length === 0 && excludedWorkers.length === 0) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-700">모든 JIRA 작업자가 구성원으로 매핑되었습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 매핑 대기열 */}
      {unmappedWorkers.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">
              매핑 대기열
              <span className="ml-2 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                {unmappedWorkers.length}명
              </span>
            </h3>
            <button onClick={refresh} className="text-sm text-jira-blue hover:underline">새로고침</button>
          </div>

          <div className="divide-y divide-gray-100 rounded-md border border-orange-200 bg-orange-50">
            {unmappedWorkers.map((worker) => (
              <div key={worker.accountId} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{worker.displayName}</p>
                    <p className="text-xs text-gray-500">
                      {worker.email && <span className="mr-3">{worker.email}</span>}
                      <span className="text-gray-400">ID: {worker.accountId}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {unmappedMembers.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleMapToExisting(worker.accountId, e.target.value);
                          e.target.value = '';
                        }}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        defaultValue=""
                      >
                        <option value="" disabled>기존 구성원에 연결...</option>
                        {unmappedMembers.map((m) => (
                          <option key={m.email} value={m.email}>{m.nickname} ({m.email})</option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => {
                        setRegisteringId(registeringId === worker.accountId ? null : worker.accountId);
                        setRegisterForm({ nickname: worker.displayName, teamId: '' });
                      }}
                      className="rounded-md bg-jira-blue px-2 py-1 text-xs text-white hover:bg-blue-700"
                    >
                      신규 등록
                    </button>
                    <button
                      onClick={() => excludeWorker(worker.accountId)}
                      className="rounded-md bg-gray-400 px-2 py-1 text-xs text-white hover:bg-gray-500"
                    >
                      제외
                    </button>
                  </div>
                </div>

                {registeringId === worker.accountId && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={registerForm.nickname}
                      onChange={(e) => setRegisterForm({ ...registerForm, nickname: e.target.value })}
                      placeholder="닉네임"
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <select
                      value={registerForm.teamId}
                      onChange={(e) => setRegisterForm({ ...registerForm, teamId: e.target.value })}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="">팀 미배정</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRegister(worker)}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                    >
                      등록
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {unmappedWorkers.length === 0 && excludedWorkers.length > 0 && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">모든 JIRA 작업자가 구성원으로 매핑되었습니다.</p>
        </div>
      )}

      {/* 제외된 작업자 */}
      {excludedWorkers.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowExcluded(!showExcluded)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <span>제외된 작업자 ({excludedWorkers.length}명)</span>
            <span>{showExcluded ? '▲' : '▼'}</span>
          </button>

          {showExcluded && (
            <div className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200 bg-gray-50">
              {excludedWorkers.map((worker) => (
                <div key={worker.accountId} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{worker.displayName}</p>
                    <p className="text-xs text-gray-400">
                      {worker.email && <span className="mr-2">{worker.email}</span>}
                      ID: {worker.accountId}
                    </p>
                  </div>
                  <button
                    onClick={() => restoreWorker(worker.accountId)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    복원
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
