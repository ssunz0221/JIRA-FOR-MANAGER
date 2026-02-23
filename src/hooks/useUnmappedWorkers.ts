import { useState, useEffect, useCallback } from 'react';
import { identityMapper, type UnmappedWorker } from '@/services/identity/IdentityMapper';

export function useUnmappedWorkers() {
  const [unmappedWorkers, setUnmappedWorkers] = useState<UnmappedWorker[]>([]);
  const [excludedWorkers, setExcludedWorkers] = useState<UnmappedWorker[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [unmapped, excluded] = await Promise.all([
      identityMapper.findUnmappedWorkers(),
      identityMapper.findExcludedWorkers(),
    ]);
    setUnmappedWorkers(unmapped);
    setExcludedWorkers(excluded);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mapToMember = async (workerAccountId: string, memberEmail: string) => {
    await identityMapper.mapWorkerToMember(workerAccountId, memberEmail);
    await refresh();
  };

  const registerAsMember = async (
    worker: UnmappedWorker,
    nickname: string,
    teamId?: number,
  ) => {
    await identityMapper.registerWorkerAsMember(worker, nickname, teamId);
    await refresh();
  };

  const excludeWorker = async (accountId: string) => {
    await identityMapper.excludeWorker(accountId);
    await refresh();
  };

  const restoreWorker = async (accountId: string) => {
    await identityMapper.restoreWorker(accountId);
    await refresh();
  };

  return { unmappedWorkers, excludedWorkers, loading, refresh, mapToMember, registerAsMember, excludeWorker, restoreWorker };
}
