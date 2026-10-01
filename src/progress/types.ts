import type { TableSize } from '../table/geometry';
import type { PhysicsParams } from '../physics/params';

export const SCHEMA_VERSION = 1;

export interface Attempt {
  id: string;
  schemaVersion: number;
  lessonId: string;
  exerciseIndex: number;
  kind: 'estimate' | 'simShot';
  success: boolean;
  detail?: string;
  createdAt: number;
}

export interface TableShot { success: boolean; miss?: 'fina' | 'gruesa' }

export interface TableSession {
  id: string;
  schemaVersion: number;
  lessonId: string;
  exerciseIndex: number;
  shots: TableShot[];
  startedAt: number;
  endedAt: number;
}

export interface Settings {
  tableSize: TableSize;
  cornerMouthIn: number;
  sideMouthIn: number;
  ignoreLocks: boolean;
  showGuidesByDefault: boolean;
  physicsOverrides?: Partial<PhysicsParams>;
}

export const DEFAULT_SETTINGS: Settings = {
  tableSize: '9ft',
  cornerMouthIn: 4.5,
  sideMouthIn: 5,
  ignoreLocks: false,
  showGuidesByDefault: true,
};

export interface ProgressStore {
  persistent: boolean;
  addAttempt(a: Attempt): Promise<void>;
  listAttempts(): Promise<Attempt[]>;
  /** Inserta o reemplaza (por id) una sesión en la mesa real. */
  addTableSession(s: TableSession): Promise<void>;
  listTableSessions(): Promise<TableSession[]>;
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
}
