export interface IRepository<T> {
  getAll(): Promise<T[]>;
  getByKey(key: string): Promise<T | undefined>;
  put(item: T): Promise<void>;
  bulkPut(items: T[]): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
