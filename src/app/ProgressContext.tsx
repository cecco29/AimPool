import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PARAMS, type PhysicsParams } from '../physics/params';
import { buildTable, type TableGeometry, type TableSpec } from '../table/geometry';
import { isUnlocked, LESSONS, lessonNeeds } from '../content/curriculum';
import { migrateSettings } from '../progress/migrate';
import { countsAsPassed, lessonStatus, type LessonStatus } from '../progress/status';
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
  status: (lesson: Lesson) => LessonStatus;
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
      const [raw, at, se] = await Promise.all([s.getSettings(), s.listAttempts(), s.listTableSessions()]);
      const st = migrateSettings(raw, at.length + se.length > 0);
      if (st !== raw) {
        try {
          await s.saveSettings(st);
        } catch (err) {
          console.warn('[progress] no se pudo guardar la migración; sigo con la configuración en memoria', err);
        }
      }
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
  const statusOf = useCallback(
    (l: Lesson, unlocked: boolean) => lessonStatus({
      stats: stats(l), crit: l.passCriteria, needs: lessonNeeds(l), hasTable: settings.hasTable,
      placementPassed: settings.placement?.passed.includes(l.id) ?? false, unlocked,
    }),
    [stats, settings.hasTable, settings.placement],
  );
  const passed = useMemo(
    () => new Set(LESSONS.filter((l) => countsAsPassed(statusOf(l, true), settings.hasTable, lessonNeeds(l))).map((l) => l.id)),
    [statusOf, settings.hasTable],
  );
  const status = useCallback(
    (l: Lesson) => statusOf(l, isUnlocked(l, passed, settings.ignoreLocks)),
    [statusOf, passed, settings.ignoreLocks],
  );

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
    tableSpec, params, geometry, passed, stats, status, recordAttempt, recordSession, updateSettings,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress debe usarse dentro de ProgressProvider');
  return v;
}
