import { describe, expect, test } from 'vitest';
import { computeStreak, lessonStats } from './stats';
import type { Attempt, TableSession } from './types';

const DAY = 86_400_000;
const now = new Date(2026, 9, 1, 12).getTime();
const a = (success: boolean, lessonId = 'L'): Attempt => ({ id: Math.random().toString(), schemaVersion: 1, lessonId, exerciseIndex: 0, kind: 'simShot', success, createdAt: now });
const sess = (hits: boolean[], lessonId = 'L'): TableSession => ({ id: Math.random().toString(), schemaVersion: 1, lessonId, exerciseIndex: 1, shots: hits.map((success) => ({ success })), startedAt: now, endedAt: now });
const crit = { simulator: 0.7, realTable: 0.6 };
const needs = { sim: true, table: true };

describe('lessonStats', () => {
  test('rates and pass', () => {
    const s = lessonStats('L', crit, [a(true), a(true), a(true), a(false), a(true, 'other')], [sess([true, true, false])], needs);
    expect(s.simRate).toBeCloseTo(0.75);
    expect(s.tableRate).toBeCloseTo(2 / 3);
    expect(s.passed).toBe(true);
  });
  test('no data → null rates, not passed', () => {
    const s = lessonStats('L', crit, [], [], needs);
    expect(s.simRate).toBeNull();
    expect(s.passed).toBe(false);
  });
  test('below threshold does not pass', () => {
    expect(lessonStats('L', crit, [a(true), a(false)], [sess([true])], needs).passed).toBe(false);
  });
  test('lesson without table exercises only needs the simulator', () => {
    expect(lessonStats('L', crit, [a(true)], [], { sim: true, table: false }).passed).toBe(true);
  });
});

describe('computeStreak', () => {
  test('consecutive days ending today', () => {
    expect(computeStreak([now, now - DAY, now - 2 * DAY], now)).toBe(3);
  });
  test('streak still alive if the last activity was yesterday', () => {
    expect(computeStreak([now - DAY, now - 2 * DAY], now)).toBe(2);
  });
  test('broken streak', () => {
    expect(computeStreak([now - 3 * DAY], now)).toBe(0);
  });
  test('several entries the same day count once', () => {
    expect(computeStreak([now, now - 1000], now)).toBe(1);
  });
});
