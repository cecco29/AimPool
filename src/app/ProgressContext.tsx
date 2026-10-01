import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PARAMS, type PhysicsParams } from '../physics/params';
import { buildTable, type TableGeometry, type TableSpec } from '../table/geometry';
import { LESSONS, lessonNeeds } from '../content/curriculum';
import type { Lesson } from '../content/types';
import { newId, openProgressStore } from '../progress/store';
import { lessonStats, type LessonStats } from '../progress/stats';
import { type Attempt, DEFAULT_SETTINGS, type ProgressStore, SCHEMA_VERSION, type Settings, type TableSession } from '../progress/types';
import { settingsToTableSpec } from './config';

export interface ProgressValue {
  ready: boolean;
  persistent: boolean;
  settings: Settings;
  attempts: Attempt[];
  sessions: TableSession[];
  tableSpec: TableSpec;
  params: PhysicsParams;
  geometry: TableGeometry;
  passed: Set<string>;
  stats: (lesson: Lesson) => LessonStats;
  recordAttempt: (a: Omit<Attempt, 'id' | 'schemaVersion' | 'createdAt'>) => Promise<void>;
  /** Inserta o actualiza (por id) una sesión en la mesa real. */
  recordSession: (s: Omit<TableSession, 'schemaVersion'>) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

const Ctx = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children, storeFactory = openProgressStore }: {
  children: ReactNode; storeFactory?: () => Promise<ProgressStore>;
}) {
  const [store, setStore] = useState<ProgressStore | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [sessions, setSessions] = useState<TableSession[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await storeFactory();
      const [st, at, se] = await Promise.all([s.getSettings(), s.listAttempts(), s.listTableSessions()]);
      if (!alive) return;
      setSettings(st);
      setAttempts(at);
      setSessions(se);
      setStore(s);
    })().catch((err) => console.error('[progress] no se pudo abrir el almacenamiento', err));
    return () => { alive = false; };
  }, [storeFactory]);

  const tableSpec = useMemo(() => settingsToTableSpec(settings), [settings]);
  const params = useMemo<PhysicsParams>(() => ({ ...DEFAULT_PARAMS, ...settings.physicsOverrides }), [settings]);
  const geometry = useMemo(() => buildTable(tableSpec, params.R), [tableSpec, params.R]);
  const stats = useCallback(
    (l: Lesson) => lessonStats(l.id, l.passCriteria, attempts, sessions, lessonNeeds(l)),
    [attempts, sessions],
  );
  const passed = useMemo(() => new Set(LESSONS.filter((l) => stats(l).passed).map((l) => l.id)), [stats]);

  const recordAttempt = useCallback<ProgressValue['recordAttempt']>(async (a) => {
    const full: Attempt = { ...a, id: newId(), schemaVersion: SCHEMA_VERSION, createdAt: Date.now() };
    setAttempts((x) => [...x, full]);
    try { await store?.addAttempt(full); } catch (err) { console.error('[progress] addAttempt', err); }
  }, [store]);

  const recordSession = useCallback<ProgressValue['recordSession']>(async (s) => {
    const full: TableSession = { ...s, schemaVersion: SCHEMA_VERSION };
    setSessions((x) => [...x.filter((y) => y.id !== full.id), full]);
    try { await store?.addTableSession(full); } catch (err) { console.error('[progress] addTableSession', err); }
  }, [store]);

  const updateSettings = useCallback<ProgressValue['updateSettings']>(async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try { await store?.saveSettings(next); } catch (err) { console.error('[progress] saveSettings', err); }
  }, [settings, store]);

  const value: ProgressValue = {
    ready: store !== null, persistent: store?.persistent ?? true, settings, attempts, sessions,
    tableSpec, params, geometry, passed, stats, recordAttempt, recordSession, updateSettings,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress debe usarse dentro de ProgressProvider');
  return v;
}
