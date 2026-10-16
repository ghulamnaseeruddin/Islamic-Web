// Saves surahs on this device (IndexedDB) so they can be read without internet.
import type { SurahData } from "@/lib/quran/api";

const DB = "noor-offline";
const STORE = "surahs";

export type OfflineSurah = { surah: number; data: SurahData; savedAt: number; translations: string[] };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "surah" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

export async function saveOffline(surah: number, data: SurahData, translations: string[]) {
  // audio links are not stored: only text and translations
  const slim: SurahData = { ...data, audio: {} };
  await run("readwrite", (s) => s.put({ surah, data: slim, savedAt: Date.now(), translations } satisfies OfflineSurah));
}

export async function getOffline(surah: number): Promise<OfflineSurah | null> {
  try {
    return ((await run("readonly", (s) => s.get(surah))) as OfflineSurah | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function listOffline(): Promise<OfflineSurah[]> {
  try {
    return ((await run("readonly", (s) => s.getAll())) as OfflineSurah[]) ?? [];
  } catch {
    return [];
  }
}

export async function removeOffline(surah: number) {
  await run("readwrite", (s) => s.delete(surah));
}
