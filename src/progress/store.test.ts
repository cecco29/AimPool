import 'fake-indexeddb/auto';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createIdbStore, createMemoryStore, newId, openProgressStore } from './store';
import { DEFAULT_SETTINGS, SCHEMA_VERSION, type Attempt } from './types';

const attempt = (over: Partial<Attempt> = {}): Attempt => ({
  id: newId(), schemaVersion: SCHEMA_VERSION, lessonId: 'ghost-ball', exerciseIndex: 0,
  kind: 'simShot', success: true, createdAt: Date.now(), ...over,
});

afterEach(() => vi.unstubAllGlobals());

describe.each([
  ['memory', async () => createMemoryStore()],
  ['indexeddb', async () => createIdbStore(`test-${Math.random()}`)],
])('%s store', (_name, make) => {
  test('attempts round trip', async () => {
    const s = await make();
    await s.addAttempt(attempt({ success: false }));
    await s.addAttempt(attempt());
    const all = await s.listAttempts();
    expect(all).toHaveLength(2);
    expect(all.filter((a) => a.success)).toHaveLength(1);
  });
  test('table sessions round trip', async () => {
    const s = await make();
    await s.addTableSession({ id: newId(), schemaVersion: SCHEMA_VERSION, lessonId: 'x', exerciseIndex: 2, shots: [{ success: true }, { success: false, miss: 'fina' }], startedAt: 1, endedAt: 2 });
    expect((await s.listTableSessions())[0].shots[1].miss).toBe('fina');
  });
  test('settings default and save', async () => {
    const s = await make();
    expect(await s.getSettings()).toEqual(DEFAULT_SETTINGS);
    await s.saveSettings({ ...DEFAULT_SETTINGS, tableSize: '7ft' });
    expect((await s.getSettings()).tableSize).toBe('7ft');
  });
});

describe('openProgressStore', () => {
  test('uses IndexedDB when available', async () => {
    expect((await openProgressStore()).persistent).toBe(true);
  });
  test('falls back to memory when IndexedDB is missing', async () => {
    vi.stubGlobal('indexedDB', undefined);
    expect((await openProgressStore()).persistent).toBe(false);
  });
});
