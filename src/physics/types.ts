import type { Vec3 } from './vec';

export type Motion = 'stationary' | 'spinning' | 'sliding' | 'rolling' | 'airborne' | 'pocketed';

export interface Ball {
  id: string; // 'cue' = blanca; '1'..'15' = bolas objetivo
  r: Vec3; // posición del centro (m)
  v: Vec3; // velocidad (m/s)
  w: Vec3; // velocidad angular (rad/s)
  motion: Motion;
  pocket?: string; // id de tronera si motion === 'pocketed'
}

/** Banda recta: la nariz va de p1 a p2; n es la normal unitaria que apunta hacia la superficie de juego. */
export interface Segment { id: string; p1: Vec3; p2: Vec3; n: Vec3 }
/** Mandíbula redondeada de tronera (círculo en el plano xy). */
export interface Circle { id: string; c: Vec3; radius: number }
/** Línea de captura: la bola cuyo centro la cruza moviéndose contra n queda embocada. */
export interface PocketMouth { id: string; p1: Vec3; p2: Vec3; n: Vec3 }
export interface Boundary { segments: Segment[]; jaws: Circle[]; pockets: PocketMouth[] }

export interface Shot {
  cueBallId: string;
  azimuth: number; // dirección del taco en el plano (rad)
  elevation: number; // elevación del taco (rad), 0 = nivelado
  a: number; // punto de contacto lateral, normalizado por R (+ = derecha)
  b: number; // punto de contacto vertical, normalizado por R (+ = arriba)
  cueSpeed: number; // velocidad del taco (m/s)
}

export type EventKind = 'strike' | 'ballBall' | 'cushion' | 'jaw' | 'pocket' | 'table' | 'transition';
export interface SimEvent { t: number; kind: EventKind; ids: string[]; target?: string; balls: Ball[] }
export interface Timeline { events: SimEvent[]; duration: number; truncated: boolean; miscue: boolean }
