// Lightweight IndexedDB wrapper (no external deps) for offline-first kiosks.

export type IdKey = IDBValidKey;

const DB_NAME = "nexora.booth";
const DB_VERSION = 1;

const STORE_KV = "kv";
const STORE_ORDERS = "orders";
const STORE_PRINT_LOGS = "print_logs";

type KvRow = { key: string; value: unknown };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_ORDERS)) {
        const store = db.createObjectStore(STORE_ORDERS, { keyPath: "id" });
        store.createIndex("paymentRef", "paymentRef", { unique: true });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PRINT_LOGS)) {
        const store = db.createObjectStore(STORE_PRINT_LOGS, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
async function getDb() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function idbGetKv<T>(key: string): Promise<T | null> {
  const db = await getDb();
  const tx = db.transaction(STORE_KV, "readonly");
  const store = tx.objectStore(STORE_KV);
  const row = await reqToPromise(store.get(key) as IDBRequest<KvRow | undefined>);
  await txDone(tx);
  return (row?.value as T) ?? null;
}

export async function idbSetKv(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_KV, "readwrite");
  tx.objectStore(STORE_KV).put({ key, value } satisfies KvRow);
  await txDone(tx);
}

export async function idbDelKv(key: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_KV, "readwrite");
  tx.objectStore(STORE_KV).delete(key);
  await txDone(tx);
}

export async function idbAddRow<T extends { id: string }>(storeName: string, row: T): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).put(row);
  await txDone(tx);
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await getDb();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const res = await reqToPromise(store.getAll() as IDBRequest<T[]>);
  await txDone(tx);
  return res ?? [];
}

export async function idbClear(storeName: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).clear();
  await txDone(tx);
}

export async function idbDeleteOldest(storeName: string, keepLatest: number): Promise<void> {
  if (keepLatest <= 0) return;
  const db = await getDb();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  const rows = await reqToPromise(store.getAll() as IDBRequest<Array<{ id: string; createdAt?: string }>>);
  const sorted = (rows ?? []).slice().sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  const toDelete = sorted.slice(keepLatest);
  for (const row of toDelete) store.delete(row.id);
  await txDone(tx);
}

export const IDB_STORES = {
  kv: STORE_KV,
  orders: STORE_ORDERS,
  printLogs: STORE_PRINT_LOGS,
} as const;
