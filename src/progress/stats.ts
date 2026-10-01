import type { Attempt, TableSession } from './types';

export interface LessonStats {
  simAttempts: number;
  simSuccess: number;
  simRate: number | null;
  tableShots: number;
  tableSuccess: number;
  tableRate: number | null;
  passed: boolean;
}

export function lessonStats(
  lessonId: string,
  crit: { simulator: number; realTable: number },
  attempts: Attempt[],
  sessions: TableSession[],
  needs: { sim: boolean; table: boolean },
): LessonStats {
  const mine = attempts.filter((a) => a.lessonId === lessonId);
  const simSuccess = mine.filter((a) => a.success).length;
  const shots = sessions.filter((s) => s.lessonId === lessonId).flatMap((s) => s.shots);
  const tableSuccess = shots.filter((s) => s.success).length;
  const simRate = mine.length ? simSuccess / mine.length : null;
  const tableRate = shots.length ? tableSuccess / shots.length : null;
  const simOk = !needs.sim || (simRate !== null && simRate >= crit.simulator);
  const tableOk = !needs.table || (tableRate !== null && tableRate >= crit.realTable);
  return { simAttempts: mine.length, simSuccess, simRate, tableShots: shots.length, tableSuccess, tableRate, passed: simOk && tableOk };
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Días consecutivos con actividad, terminando hoy o ayer (si hoy todavía no practicaste). */
export function computeStreak(timestamps: number[], now: number): number {
  const days = new Set(timestamps.map(dayKey));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
