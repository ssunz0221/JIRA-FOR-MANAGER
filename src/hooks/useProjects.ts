import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';

export function useProjects() {
  const projects = useLiveQuery(() => db.projects.toArray());
  return { projects: projects ?? [], isLoading: projects === undefined };
}
