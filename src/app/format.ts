import type { Level } from '../content/types';

export const pct = (rate: number | null): string => (rate === null ? '—' : `${Math.round(rate * 100)}%`);

export const LEVEL_LABEL: Record<Level, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};
export const LEVELS: Level[] = ['principiante', 'intermedio', 'avanzado'];
