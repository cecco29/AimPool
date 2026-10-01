import type { Settings } from './types';

/** Quien ya practicó antes de que existiera el onboarding no ve la bienvenida y conserva el modo con mesa. */
export function migrateSettings(s: Settings, hasHistory: boolean): Settings {
  return !s.onboardingDone && hasHistory ? { ...s, onboardingDone: true, hasTable: 'yes' } : s;
}
