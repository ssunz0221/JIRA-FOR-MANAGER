import { db } from '../database';
import type { Team } from '../models/Team';

export class TeamRepository {
  async getAll(): Promise<Team[]> {
    return db.teams.toArray();
  }

  async getById(id: number): Promise<Team | undefined> {
    return db.teams.get(id);
  }

  async add(team: Omit<Team, 'id'>): Promise<number> {
    return db.teams.add(team as Team);
  }

  async update(id: number, changes: Partial<Team>): Promise<void> {
    await db.teams.update(id, changes);
  }

  async delete(id: number): Promise<void> {
    // 팀 삭제 시 소속 구성원의 teamId를 해제
    await db.members.where('teamId').equals(id).modify({ teamId: undefined });
    await db.teams.delete(id);
  }

  async clear(): Promise<void> {
    await db.teams.clear();
  }
}

export const teamRepository = new TeamRepository();
