import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';

export function useWorkers() {
  const workers = useLiveQuery(() => db.workers.toArray());
  return { workers: workers ?? [], isLoading: workers === undefined };
}
