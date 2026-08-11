// IndexedDB helper to save video blobs securely on host's local browser storage

const DB_NAME = 'InterviewStudioRecordingsDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

export interface StoredRecordingRecord {
  id: string;
  roomId: string;
  title: string;
  candidateName: string;
  candidatePosition: string;
  createdAt: number;
  durationSeconds: number;
  fileSizeMB: number;
  resolution: string;
  mimeType: string;
  videoBlob: Blob;
  aiAnalysis?: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    score: number;
    recommendation: 'accepted' | 'rejected' | 'second_round';
  };
  evaluation?: {
    communication: number;
    technicalSkill: number;
    problemSolving: number;
    culturalFit: number;
    overallScore: number;
    notes: string;
  };
}

function openDB(): Promise<IDBDatabase> {
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
}

export async function saveRecordingToDB(record: StoredRecordingRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllRecordingsFromDB(): Promise<StoredRecordingRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const records = request.result as StoredRecordingRecord[];
      // Sort by newest first
      records.sort((a, b) => b.createdAt - a.createdAt);
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getRecordingById(id: string): Promise<StoredRecordingRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecordingFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateRecordingDetailsInDB(
  id: string,
  updates: Partial<StoredRecordingRecord>
): Promise<void> {
  const existing = await getRecordingById(id);
  if (!existing) return;

  const updatedRecord = { ...existing, ...updates };
  await saveRecordingToDB(updatedRecord);
}
