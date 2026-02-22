import { db } from '../database';
import type { Worker } from '../models/Worker';
import type { IRepository } from './IRepository';

export class WorkerRepository implements IRepository<Worker> {
  async getAll(): Promise<Worker[]> {
    return db.workers.toArray();
  }

  async getByKey(accountId: string): Promise<Worker | undefined> {
    return db.workers.get(accountId);
  }

  async put(worker: Worker): Promise<void> {
    await db.workers.put(worker);
  }

  async bulkPut(workers: Worker[]): Promise<void> {
    await db.workers.bulkPut(workers);
  }

  async delete(accountId: string): Promise<void> {
    await db.workers.delete(accountId);
  }

  async clear(): Promise<void> {
    await db.workers.clear();
  }
}

export const workerRepository = new WorkerRepository();
