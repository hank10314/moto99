interface QueuedRequest {
  id?: number;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
  status: 'pending' | 'failed';
  error?: string;
}

const DB_NAME = 'vehicle-maintenance-pwa';
const DB_VERSION = 1;
const QUEUE_STORE = 'syncQueue';
const CACHE_STORE = 'cache';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(storeName: string, mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = callback(tx.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function enqueue(action: string, payload: Record<string, unknown>): Promise<void> {
  await withStore(QUEUE_STORE, 'readwrite', (store) =>
    store.add({ action, payload, createdAt: new Date().toISOString(), status: 'pending' } satisfies QueuedRequest)
  );
}

export async function listQueue(): Promise<QueuedRequest[]> {
  return withStore(QUEUE_STORE, 'readonly', (store) => store.getAll());
}

export async function removeQueued(id: number): Promise<void> {
  await withStore(QUEUE_STORE, 'readwrite', (store) => store.delete(id));
}

export async function markFailed(id: number, error: string): Promise<void> {
  const item = await withStore<QueuedRequest>(QUEUE_STORE, 'readonly', (store) => store.get(id));
  if (!item) return;
  await withStore(QUEUE_STORE, 'readwrite', (store) => store.put({ ...item, status: 'failed', error }));
}

export async function cacheValue<T>(key: string, value: T): Promise<void> {
  await withStore(CACHE_STORE, 'readwrite', (store) => store.put({ key, value, updatedAt: new Date().toISOString() }));
}

export async function getCachedValue<T>(key: string): Promise<T | null> {
  const row = await withStore<{ key: string; value: T }>(CACHE_STORE, 'readonly', (store) => store.get(key));
  return row?.value ?? null;
}

export type { QueuedRequest };
