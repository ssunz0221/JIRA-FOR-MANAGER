import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { teamRepository } from '@/db/repositories/TeamRepository';

export function useTeams() {
  const teams = useLiveQuery(() => db.teams.toArray());

  const addTeam = async (name: string): Promise<number> => {
    return teamRepository.add({ name });
  };

  const updateTeam = async (id: number, name: string): Promise<void> => {
    await teamRepository.update(id, { name });
  };

  const deleteTeam = async (id: number): Promise<void> => {
    await teamRepository.delete(id);
  };

  return {
    teams: teams ?? [],
    isLoading: teams === undefined,
    addTeam,
    updateTeam,
    deleteTeam,
  };
}
