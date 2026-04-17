/**
 * Utility for light IndexedDB management to share alarm data between 
 * the main thread and the Service Worker.
 */

const DB_NAME = 'OrganiCesarDB';
const STORE_NAME = 'alarms';
const DB_VERSION = 1;

export interface AlarmData {
  id: string;
  titulo: string;
  descricao: string;
  hora: string; // HH:mm
  som: number;
  ativo: boolean;
  diasSemana: number[];
  excecoes: string[];
  dataLimite: string;
  dataCriacao: string;
}

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const syncAlarms = async (alarms: AlarmData[]) => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  // Clear existing to ensure fresh sync
  await new Promise<void>((resolve, reject) => {
    const clearReq = store.clear();
    clearReq.onsuccess = () => resolve();
    clearReq.onerror = () => reject(clearReq.error);
  });

  // Add new ones
  for (const alarm of alarms) {
    store.add(alarm);
  }

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllAlarms = async (): Promise<AlarmData[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
