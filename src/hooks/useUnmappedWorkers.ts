import { useState, useEffect, useCallback } from 'react';
import { identityMapper, type UnmappedWorkerWithStatus } from '@/services/identity/IdentityMapper';

export function useUnmappedWorkers() {
  const [workers, setWorkers] = useState<UnmappedWorkerWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await identityMapper.findAllUnmappedOrExcludedWorkers();
    setWorkers(all);
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
    worker: UnmappedWorkerWithStatus,
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

  return { workers, loading, refresh, mapToMember, registerAsMember, excludeWorker, restoreWorker };
}
