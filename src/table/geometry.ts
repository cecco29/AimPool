import type { Boundary, Circle, PocketMouth, Segment } from '../physics/types';
import { add, scale, sub, unit, type Vec3 } from '../physics/vec';

export type TableSize = '7ft' | '8ft' | '9ft';
/** Troneras nombradas por su coordenada en diamantes: c = esquina, s = media. */
export type PocketId = 'c00' | 'c04' | 'c80' | 'c84' | 's40' | 's44';
export const POCKET_IDS: PocketId[] = ['c00', 'c04', 'c80', 'c84', 's40', 's44'];

export const TABLE_DIMENSIONS: Record<TableSize, { length: number; width: number }> = {
  '9ft': { length: 2.54, width: 1.27 },
  '8ft': { length: 2.3368, width: 1.1684 },
  '7ft': { length: 1.9812, width: 0.9906 },
};

export interface TableSpec { size: TableSize; cornerMouth: number; sideMouth: number }
export const DEFAULT_TABLE_SPEC: TableSpec = { size: '9ft', cornerMouth: 0.1143, sideMouth: 0.127 };

const CORNER_JAW_RADIUS = 0.021;
const SIDE_JAW_RADIUS = 0.008;
/** Los diamantes (sights) están 3 11/16" detrás de la nariz de la banda (WPA). */
export const SIGHT_OFFSET = 0.0937;

export interface TableGeometry {
  spec: TableSpec;
  length: number;
  width: number;
  diamond: number;
  boundary: Boundary;
  /** Centro de la boca de cada tronera (punto al que se apunta). */
  pocketCenters: Record<PocketId, Vec3>;
}

export function buildTable(spec: TableSpec, R: number): TableGeometry {
  const { length: L, width: W } = TABLE_DIMENSIONS[spec.size];
  const k = spec.cornerMouth / Math.SQRT2;
  const sh = spec.sideMouth / 2;
  const C = CORNER_JAW_RADIUS;
  const S = SIDE_JAW_RADIUS;
  const segments: Segment[] = [];
  const jaws: Circle[] = [];

  const rail = (id: string, p1: Vec3, p2: Vec3, n: Vec3, r1: number, r2: number) => {
    segments.push({ id, p1, p2, n });
    jaws.push({ id: `${id}:a`, c: sub(p1, scale(n, r1)), radius: r1 });
    jaws.push({ id: `${id}:b`, c: sub(p2, scale(n, r2)), radius: r2 });
  };
  rail('y0-head', [k, 0, 0], [L / 2 - sh, 0, 0], [0, 1, 0], C, S);
  rail('y0-foot', [L / 2 + sh, 0, 0], [L - k, 0, 0], [0, 1, 0], S, C);
  rail('y4-head', [k, W, 0], [L / 2 - sh, W, 0], [0, -1, 0], C, S);
  rail('y4-foot', [L / 2 + sh, W, 0], [L - k, W, 0], [0, -1, 0], S, C);
  rail('x0', [0, k, 0], [0, W - k, 0], [1, 0, 0], C, C);
  rail('x8', [L, k, 0], [L, W - k, 0], [-1, 0, 0], C, C);

  const mouth = (id: PocketId, a: Vec3, b: Vec3, n: Vec3): PocketMouth => {
    const dir = unit(sub(b, a));
    const back = scale(n, -0.5 * R);
    return { id, p1: add(sub(a, scale(dir, R)), back), p2: add(add(b, scale(dir, R)), back), n };
  };
  const d = Math.SQRT1_2;
  const pockets: PocketMouth[] = [
    mouth('c00', [k, 0, 0], [0, k, 0], [d, d, 0]),
    mouth('c04', [0, W - k, 0], [k, W, 0], [d, -d, 0]),
    mouth('c80', [L - k, 0, 0], [L, k, 0], [-d, d, 0]),
    mouth('c84', [L, W - k, 0], [L - k, W, 0], [-d, -d, 0]),
    mouth('s40', [L / 2 - sh, 0, 0], [L / 2 + sh, 0, 0], [0, 1, 0]),
    mouth('s44', [L / 2 - sh, W, 0], [L / 2 + sh, W, 0], [0, -1, 0]),
  ];
  const pocketCenters: Record<PocketId, Vec3> = {
    c00: [k / 2, k / 2, 0],
    c04: [k / 2, W - k / 2, 0],
    c80: [L - k / 2, k / 2, 0],
    c84: [L - k / 2, W - k / 2, 0],
    s40: [L / 2, 0, 0],
    s44: [L / 2, W, 0],
  };
  return { spec, length: L, width: W, diamond: L / 8, boundary: { segments, jaws, pockets }, pocketCenters };
}

export const diamondToPoint = (g: TableGeometry, x: number, y: number, z = 0): Vec3 => [x * g.diamond, y * g.diamond, z];
export const pointToDiamond = (g: TableGeometry, p: Vec3): { x: number; y: number } => ({ x: p[0] / g.diamond, y: p[1] / g.diamond });
