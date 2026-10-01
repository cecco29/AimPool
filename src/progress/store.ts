import { openDB } from 'idb';
import { DEFAULT_SETTINGS, type Attempt, type ProgressStore, type Settings, type TableSession } from './types';

export const newId = (): string => crypto.randomUUID();

export function createMemoryStore(): ProgressStore {
  const attempts: Attempt[] = [];
  const sessions: TableSession[] = [];
  let settings: Settings = { ...DEFAULT_SETTINGS };
  return {
    persistent: false,
    async addAttempt(a) { attempts.push(a); },
    async listAttempts() { return attempts.slice(); },
    async addTableSession(s) {
      const i = sessions.findIndex((x) => x.id === s.id);
      if (i >= 0) sessions[i] = s;
      else sessions.push(s);
    },
    async listTableSessions() { return sessions.slice(); },
    async getSettings() { return { ...settings }; },
    async saveSettings(s) { settings = { ...s }; },
  };
}

export async function createIdbStore(name = 'aimpool'): Promise<ProgressStore> {
  const db = await openDB(name, 1, {
    upgrade(d) {
      d.createObjectStore('attempts', { keyPath: 'id' }).createIndex('lessonId', 'lessonId');
      d.createObjectStore('tableSessions', { keyPath: 'id' }).createIndex('lessonId', 'lessonId');
      d.createObjectStore('settings');
    },
  });
  return {
    persistent: true,
    async addAttempt(a) { await db.put('attempts', a); },
    async listAttempts() { return (await db.getAll('attempts')) as Attempt[]; },
    async addTableSession(s) { await db.put('tableSessions', s); },
    async listTableSessions() { return (await db.getAll('tableSessions')) as TableSession[]; },
    async getSettings() {
      const s = (await db.get('settings', 'settings')) as Partial<Settings> | undefined;
      return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
    },
    async saveSettings(s) { await db.put('settings', s, 'settings'); },
  };
}

/** IndexedDB si está disponible; si no (modo privado, navegador viejo), memoria. */
export async function openProgressStore(): Promise<ProgressStore> {
  try {
    if (typeof indexedDB === 'undefined' || !indexedDB) throw new Error('IndexedDB no disponible');
    return await createIdbStore();
  } catch (err) {
    console.warn('[progress] usando almacenamiento en memoria:', err);
    return createMemoryStore();
  }
}
