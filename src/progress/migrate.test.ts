import { expect, test } from 'vitest';
import { migrateSettings } from './migrate';
import { DEFAULT_SETTINGS } from './types';

test('existing users with history skip onboarding and keep table mode', () => {
  const m = migrateSettings({ ...DEFAULT_SETTINGS, hasTable: 'no', onboardingDone: false }, true);
  expect(m.onboardingDone).toBe(true);
  expect(m.hasTable).toBe('yes');
});
test('new users are left alone (same object)', () => {
  const s = { ...DEFAULT_SETTINGS };
  expect(migrateSettings(s, false)).toBe(s);
});
test('already onboarded users are left alone', () => {
  const s = { ...DEFAULT_SETTINGS, onboardingDone: true, hasTable: 'no' as const };
  expect(migrateSettings(s, true)).toBe(s);
});
