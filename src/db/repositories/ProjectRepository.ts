import { db } from '../database';
import type { Project } from '../models/Project';
import type { IRepository } from './IRepository';

export class ProjectRepository implements IRepository<Project> {
  async getAll(): Promise<Project[]> {
    return db.projects.toArray();
  }

  async getByKey(jiraKey: string): Promise<Project | undefined> {
    return db.projects.get(jiraKey);
  }

  async put(project: Project): Promise<void> {
    await db.projects.put(project);
  }

  async bulkPut(projects: Project[]): Promise<void> {
    await db.projects.bulkPut(projects);
  }

  async delete(jiraKey: string): Promise<void> {
    await db.projects.delete(jiraKey);
  }

  async clear(): Promise<void> {
    await db.projects.clear();
  }

  async getByStatus(status: string): Promise<Project[]> {
    return db.projects.where('status').equals(status).toArray();
  }
}

export const projectRepository = new ProjectRepository();
