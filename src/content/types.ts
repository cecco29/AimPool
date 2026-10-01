import type { PocketId } from '../table/geometry';

export type Level = 'principiante' | 'intermedio' | 'avanzado';
/** Posición del centro de una bola en diamantes: x ∈ [0,8] (0 = cabecera), y ∈ [0,4]. */
export interface DiamondPos { x: number; y: number }
/** 'cue' es la blanca; '1'..'15' bolas objetivo. */
export interface BallLayout { balls: { id: string; at: DiamondPos }[] }
export interface GuideFlags { aimLine: boolean; ghostBall: boolean; contactPreview: boolean }
export interface TargetSpec { ball: string; pocket: PocketId }

/** Tiro fijo definido en contenido (independiente del tamaño de mesa). power en escala 0..1 del taco. */
export interface ShotSpec {
  aim: { ghostOf: string; pocket: PocketId } | { at: DiamondPos } | { azimuthDeg: number };
  power: number;
  spin?: { a: number; b: number };
  elevationDeg?: number;
}

export type TheoryBlock =
  | { kind: 'text'; md: string }
  | { kind: 'diagram'; setup: BallLayout; target?: TargetSpec; showGhost?: boolean; caption: string }
  | { kind: 'table'; headers: string[]; rows: string[][]; caption?: string };

export type EstimateAnswer =
  | { kind: 'choice'; options: string[]; correct: number }
  | { kind: 'cutAngle'; ball: string; pocket: PocketId; toleranceDeg: number };

export interface ShotGoal {
  pocketBall?: { ball: string; pocket?: PocketId };
  cueBallZone?: { center: DiamondPos; radius: number }; // radio en diamantes
  allowScratch?: boolean;
}

export interface VariationSpec { balls: string[]; jitter: number } // jitter en diamantes

export type Exercise =
  | { kind: 'estimate'; prompt: string; setup: BallLayout; answer: EstimateAnswer; explanation: string; target?: TargetSpec }
  | { kind: 'simShot'; prompt: string; setup: BallLayout; variation?: VariationSpec; goal: ShotGoal; attempts: number; showGuides: GuideFlags }
  | { kind: 'realTable'; setup: BallLayout; shots: number; instructions: string; diagnose: boolean; target?: TargetSpec };

export interface Lesson {
  id: string;
  level: Level;
  module: string;
  title: string;
  summary: string;
  prerequisites: string[];
  theory: TheoryBlock[];
  reliability?: { stars: 1 | 2 | 3; note: string };
  sources: { label: string; url?: string }[];
  exercises: Exercise[];
  passCriteria: { simulator: number; realTable: number };
}

export const DEFAULT_PASS = { simulator: 0.7, realTable: 0.6 };
