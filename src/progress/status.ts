import type { LessonStats } from './stats';
import type { Settings } from './types';

export type LessonStatus = 'passedTable' | 'passedSim' | 'passedPlacement' | 'inProgress' | 'new' | 'locked';

export interface StatusInput {
  stats: LessonStats;
  crit: { simulator: number; realTable: number };
  needs: { sim: boolean; table: boolean };
  hasTable: Settings['hasTable'];
  placementPassed: boolean;
  unlocked: boolean;
}

export function lessonStatus({ stats, crit, needs, hasTable, placementPassed, unlocked }: StatusInput): LessonStatus {
  const simOk = needs.sim && stats.simRate !== null && stats.simRate >= crit.simulator;
  const tableOk = needs.table && stats.tableRate !== null && stats.tableRate >= crit.realTable;
  if (hasTable !== 'no' && tableOk && (simOk || !needs.sim)) return 'passedTable';
  if (simOk && !(hasTable === 'yes' && needs.table)) return 'passedSim';
  if (placementPassed) return 'passedPlacement';
  if (!unlocked) return 'locked';
  return stats.simAttempts + stats.tableShots > 0 ? 'inProgress' : 'new';
}

export const isPassed = (s: LessonStatus): boolean => s === 'passedTable' || s === 'passedSim' || s === 'passedPlacement';

/** Para desbloquear: una lección solo de mesa no bloquea a quien no tiene mesa. */
export function countsAsPassed(s: LessonStatus, hasTable: Settings['hasTable'], needs: { sim: boolean; table: boolean }): boolean {
  return isPassed(s) || (hasTable === 'no' && !needs.sim);
}
