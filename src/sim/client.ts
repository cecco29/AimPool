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
let workerBroken = false;
let nextId = 1;
const pending = new Map<number, { resolve: (t: Timeline) => void; reject: (e: Error) => void; req: Omit<SimRequest, 'id'> }>();

function getWorker(): Worker | null {
  if (workerBroken || typeof Worker === 'undefined') return null;
  if (!worker) {
    try {
      worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    } catch (err) {
      console.warn('[sim] no hay worker; simulo en el hilo principal', err);
      workerBroken = true;
      return null;
    }
    worker.onmessage = (e: MessageEvent<SimResponse>) => {
      const job = pending.get(e.data.id);
      if (!job) return;
      pending.delete(e.data.id);
      if (e.data.ok) job.resolve(e.data.timeline);
      else job.reject(new Error(e.data.error));
    };
    worker.onerror = (e) => {
      console.warn('[sim] el worker falló; sigo en el hilo principal:', e.message);
      workerBroken = true;
      worker?.terminate();
      worker = null;
      for (const [id, job] of pending) {
        pending.delete(id);
        try {
          job.resolve(runRequest(job.req));
        } catch (err) {
          job.reject(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };
  }
  return worker;
}

export function simulateAsync(balls: Ball[], shot: Shot, table: TableSpec, params: PhysicsParams): Promise<Timeline> {
  const w = getWorker();
  if (!w) return Promise.resolve().then(() => runRequest({ balls, shot, table, params }));
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, req: { balls, shot, table, params } });
    w.postMessage({ id, balls, shot, table, params } satisfies SimRequest);
  });
}
