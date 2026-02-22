import { db } from '../database';
import type { Member } from '../models/Member';

export class MemberRepository {
  async getAll(): Promise<Member[]> {
    return db.members.toArray();
  }

  async getByEmail(email: string): Promise<Member | undefined> {
    return db.members.get(email);
  }

  async getByJiraAccountId(jiraAccountId: string): Promise<Member | undefined> {
    return db.members.where('jiraAccountId').equals(jiraAccountId).first();
  }

  async getByTeamId(teamId: number): Promise<Member[]> {
    return db.members.where('teamId').equals(teamId).toArray();
  }

  async getUnmapped(): Promise<Member[]> {
    return db.members
      .filter((m) => !m.jiraAccountId)
      .toArray();
  }

  async put(member: Member): Promise<void> {
    await db.members.put(member);
  }

  async bulkPut(members: Member[]): Promise<void> {
    await db.members.bulkPut(members);
  }

  async delete(email: string): Promise<void> {
    await db.members.delete(email);
  }

  async clear(): Promise<void> {
    await db.members.clear();
  }
}

export const memberRepository = new MemberRepository();
