import { describe, expect, test } from 'vitest';
import { countsAsPassed, isPassed, lessonStatus, type StatusInput } from './status';
import type { LessonStats } from './stats';

const stats = (simRate: number | null, tableRate: number | null): LessonStats => ({
  simAttempts: simRate === null ? 0 : 10, simSuccess: 0, simRate,
  tableShots: tableRate === null ? 0 : 10, tableSuccess: 0, tableRate, passed: false,
});
const base: StatusInput = {
  stats: stats(null, null), crit: { simulator: 0.7, realTable: 0.6 }, needs: { sim: true, table: true },
  hasTable: 'yes', placementPassed: false, unlocked: true,
};

describe('lessonStatus', () => {
  test('with a table, simulator alone is not enough', () => {
    expect(lessonStatus({ ...base, stats: stats(0.9, null) })).toBe('inProgress');
    expect(lessonStatus({ ...base, stats: stats(0.9, 0.7) })).toBe('passedTable');
  });
  test('sometimes / no table: simulator is enough; table adds the badge', () => {
    expect(lessonStatus({ ...base, hasTable: 'sometimes', stats: stats(0.9, null) })).toBe('passedSim');
    expect(lessonStatus({ ...base, hasTable: 'no', stats: stats(0.9, null) })).toBe('passedSim');
    expect(lessonStatus({ ...base, hasTable: 'sometimes', stats: stats(0.9, 0.7) })).toBe('passedTable');
    expect(lessonStatus({ ...base, hasTable: 'no', stats: stats(0.9, 0.7) })).toBe('passedSim');
  });
  test('placement, locked, new, in progress', () => {
    expect(lessonStatus({ ...base, placementPassed: true })).toBe('passedPlacement');
    expect(lessonStatus({ ...base, unlocked: false })).toBe('locked');
    expect(lessonStatus(base)).toBe('new');
    expect(lessonStatus({ ...base, stats: stats(0.2, null) })).toBe('inProgress');
  });
  test('a lesson without table exercises passes on the simulator even with a table', () => {
    expect(lessonStatus({ ...base, needs: { sim: true, table: false }, stats: stats(0.9, null) })).toBe('passedSim');
  });
});

describe('countsAsPassed', () => {
  test('passed statuses count', () => {
    expect(isPassed('passedSim')).toBe(true);
    expect(isPassed('inProgress')).toBe(false);
  });
  test('a table-only lesson never blocks someone without a table', () => {
    expect(countsAsPassed('new', 'no', { sim: false, table: true })).toBe(true);
    expect(countsAsPassed('new', 'yes', { sim: false, table: true })).toBe(false);
  });
});
