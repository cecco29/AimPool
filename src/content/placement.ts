import type { Exercise } from './types';

export interface PlacementItem { lessonId: string; exercise: Extract<Exercise, { kind: 'estimate' | 'predict' }> }

const GB = { balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] };

/** Ordenados por dificultad. El 2b agrega los ítems de las lecciones nuevas. */
export const PLACEMENT: PlacementItem[] = [
  {
    lessonId: 'ghost-ball',
    exercise: {
      kind: 'estimate', prompt: 'Para meter la 1 en la tronera marcada, ¿dónde tiene que estar la blanca en el instante del choque?',
      setup: GB, target: { ball: '1', pocket: 'c84' },
      answer: { kind: 'choice', options: ['Tocando el punto de la 1 que mira a la tronera', 'A una bola de distancia de la 1, sobre la línea tronera → bola 1', 'Pegada al costado de la 1 que mira a la blanca'], correct: 1 },
      explanation: 'Es la bola fantasma: sobre la prolongación de la línea tronera → bola, a una bola de distancia.',
    },
  },
  {
    lessonId: 'ghost-ball',
    exercise: {
      kind: 'estimate', prompt: 'Estimá el ángulo de corte de este tiro (en grados).',
      setup: { balls: [{ id: 'cue', at: { x: 2, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] },
      answer: { kind: 'cutAngle', ball: '1', pocket: 'c84', toleranceDeg: 7 },
      explanation: 'El corte es el ángulo entre la línea blanca → fantasma y la línea bola → tronera.',
    },
  },
];

export function scorePlacement(items: PlacementItem[], answers: boolean[]): string[] {
  const ok = new Map<string, boolean>();
  items.forEach((it, i) => ok.set(it.lessonId, (ok.get(it.lessonId) ?? true) && answers[i] === true));
  return [...ok].filter(([, v]) => v).map(([k]) => k);
}
