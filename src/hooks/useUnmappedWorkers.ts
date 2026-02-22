import { useState, useEffect, useCallback } from 'react';
import { identityMapper, type UnmappedWorker } from '@/services/identity/IdentityMapper';

export function useUnmappedWorkers() {
  const [unmappedWorkers, setUnmappedWorkers] = useState<UnmappedWorker[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const workers = await identityMapper.findUnmappedWorkers();
    setUnmappedWorkers(workers);
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

  return { unmappedWorkers, loading, refresh, mapToMember, registerAsMember };
}
