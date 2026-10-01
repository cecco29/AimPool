import type { Ball, Shot, Timeline } from '../physics/types';
import type { PhysicsParams } from '../physics/params';
import { simulate } from '../physics/simulate';
import { buildTable, type TableSpec } from '../table/geometry';

export interface SimRequest { id: number; balls: Ball[]; shot: Shot; table: TableSpec; params: PhysicsParams }
export type SimResponse =
  | { id: number; ok: true; timeline: Timeline }
  | { id: number; ok: false; error: string };

export function runRequest(req: Omit<SimRequest, 'id'>): Timeline {
  return simulate(req.balls, req.shot, buildTable(req.table, req.params.R).boundary, req.params);
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (t: Timeline) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<SimResponse>) => {
      const job = pending.get(e.data.id);
      if (!job) return;
      pending.delete(e.data.id);
      if (e.data.ok) job.resolve(e.data.timeline);
      else job.reject(new Error(e.data.error));
    };
    worker.onerror = (e) => {
      for (const job of pending.values()) job.reject(new Error(e.message || 'Error en el worker de simulación'));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  }
  return worker;
}

export function simulateAsync(balls: Ball[], shot: Shot, table: TableSpec, params: PhysicsParams): Promise<Timeline> {
  const w = getWorker();
  if (!w) return Promise.resolve().then(() => runRequest({ balls, shot, table, params }));
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, balls, shot, table, params } satisfies SimRequest);
  });
}
