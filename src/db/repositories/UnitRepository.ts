import Dexie from 'dexie';
import { db } from '../database';
import type { Unit } from '../models/Unit';
import type { IRepository } from './IRepository';

export class UnitRepository implements IRepository<Unit> {
  async getAll(): Promise<Unit[]> {
    return db.units.toArray();
  }

  async getByKey(jiraKey: string): Promise<Unit | undefined> {
    return db.units.get(jiraKey);
  }

  async put(unit: Unit): Promise<void> {
    await db.units.put(unit);
  }

  async bulkPut(units: Unit[]): Promise<void> {
    await db.units.bulkPut(units);
  }

  async delete(jiraKey: string): Promise<void> {
    await db.units.delete(jiraKey);
  }

  async clear(): Promise<void> {
    await db.units.clear();
  }

  async getByProjectKey(projectKey: string): Promise<Unit[]> {
    return db.units.where('projectKey').equals(projectKey).toArray();
  }

  async getByAssigneeId(assigneeId: string): Promise<Unit[]> {
    return db.units.where('assigneeId').equals(assigneeId).toArray();
  }

  async getResolvedByProjectKey(projectKey: string): Promise<Unit[]> {
    return db.units
      .where('[projectKey+status]')
      .between([projectKey, Dexie.minKey], [projectKey, Dexie.maxKey])
      .filter((unit) => unit.statusCategory === 'done')
      .toArray();
  }
}

export const unitRepository = new UnitRepository();
